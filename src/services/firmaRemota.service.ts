import crypto from "crypto";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { hashPassword, comparePassword } from "../utils/bcrypt.js";
import { sendMail } from "../utils/mailer.js";
import { saveFirma, TipoFirma } from "./firma.service.js";
import { createNotification, resolveNotificationsByReference } from "./notifications.service.js";

const EXPIRACION_HORAS = 24;
const MAX_INTENTOS = 5;
const FIRMA_SESSION_EXPIRES = "10m";

const generarCodigo = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

interface SolicitarFirmaRemotaParams {
  actaId: number;
  tipo: TipoFirma;
  destinatarioNombre?: string;
  destinatarioEmail?: string;
  destinatarioTelefono?: string;
  creadoPor: string;
}

export const solicitarFirmaRemota = async ({
  actaId,
  tipo,
  destinatarioNombre,
  destinatarioEmail,
  destinatarioTelefono,
  creadoPor,
}: SolicitarFirmaRemotaParams) => {
  const actaResult = await pool.query(
    `SELECT id, acta_number, equipo, fecha FROM actas WHERE id = $1`,
    [actaId],
  );

  const acta = actaResult.rows[0];
  if (!acta) {
    throw new Error("Acta no encontrada");
  }

  const token = crypto.randomBytes(24).toString("hex");
  const codigo = generarCodigo();
  const codigoHash = await hashPassword(codigo);
  const expiraEn = new Date(Date.now() + EXPIRACION_HORAS * 60 * 60 * 1000);

  const result = await pool.query(
    `
    INSERT INTO firma_remota_solicitudes
      (acta_id, tipo, destinatario_email, destinatario_nombre, destinatario_telefono, token, codigo_hash, expira_en, creado_por)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, acta_id, tipo, destinatario_email, destinatario_nombre, destinatario_telefono, expira_en, created_at
    `,
    [
      actaId,
      tipo,
      destinatarioEmail ?? null,
      destinatarioNombre ?? null,
      destinatarioTelefono ?? null,
      token,
      codigoHash,
      expiraEn,
      creadoPor,
    ],
  );

  const solicitud = result.rows[0];
  const link = `${process.env.FRONTEND_URL}/firmar/${token}`;

  const mensaje =
    `Hola${destinatarioNombre ? " " + destinatarioNombre : ""}, ` +
    `tienes una firma pendiente para el acta ${acta.acta_number}. ` +
    `Ingresa a ${link} y usa el código ${codigo} (válido por ${EXPIRACION_HORAS} horas).`;

  // Envío por correo es opcional/adicional — el envío principal ahora es manual por WhatsApp
  if (destinatarioEmail) {
    await sendMail(destinatarioEmail, `Firma pendiente — acta ${acta.acta_number}`, mensaje);
  }

  const waLink = destinatarioTelefono
    ? `https://wa.me/${destinatarioTelefono.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(mensaje)}`
    : null;

  await createNotification(
    "FIRMA_REMOTA_SOLICITADA",
    "Firma remota solicitada",
    `Enlace generado para firma remota (${tipo}) de ${destinatarioNombre ?? "destinatario"} — acta ${acta.acta_number}`,
    "firma_remota_solicitudes",
    solicitud.id,
    null,
  );

  return { ...solicitud, link, codigo, waLink };
};

export const validarCodigo = async (
  token: string,
  codigo: string,
  ip?: string,
  userAgent?: string,
) => {
  const result = await pool.query(
    `SELECT * FROM firma_remota_solicitudes WHERE token = $1`,
    [token],
  );

  const solicitud = result.rows[0];
  if (!solicitud) {
    throw new Error("Enlace de firma inválido");
  }

  if (solicitud.usado_at) {
    throw new Error("Esta firma ya fue completada");
  }

  if (new Date(solicitud.expira_en) < new Date()) {
    throw new Error("El código expiró, solicita un nuevo enlace");
  }

  if (solicitud.intentos >= MAX_INTENTOS) {
    throw new Error("Demasiados intentos fallidos, solicita un nuevo enlace");
  }

  const codigoValido = await comparePassword(codigo, solicitud.codigo_hash);

  await pool.query(
    `UPDATE firma_remota_solicitudes SET intentos = intentos + 1, ip = $2, user_agent = $3 WHERE id = $1`,
    [solicitud.id, ip ?? null, userAgent ?? null],
  );

  if (!codigoValido) {
    throw new Error("Código incorrecto");
  }

  const actaResult = await pool.query(
    `SELECT acta_number, equipo, fecha, recibido_por_nombre, entregado_por_nombre FROM actas WHERE id = $1`,
    [solicitud.acta_id],
  );

  const firmaSessionToken = jwt.sign(
    { scope: "firma-remota", solicitudId: solicitud.id, actaId: solicitud.acta_id, tipo: solicitud.tipo },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: FIRMA_SESSION_EXPIRES },
  );

  return { firmaSessionToken, acta: actaResult.rows[0] };
};

export const completarFirmaRemota = async (
  firmaSessionToken: string,
  firmaBase64: string,
  ip?: string,
  userAgent?: string,
) => {
  let payload: any;
  try {
    payload = jwt.verify(firmaSessionToken, process.env.JWT_ACCESS_SECRET!);
  } catch {
    throw new Error("Sesión de firma inválida o expirada");
  }

  if (payload.scope !== "firma-remota") {
    throw new Error("Token inválido para esta operación");
  }

  const result = await pool.query(
    `SELECT * FROM firma_remota_solicitudes WHERE id = $1`,
    [payload.solicitudId],
  );

  const solicitud = result.rows[0];
  if (!solicitud) {
    throw new Error("Solicitud no encontrada");
  }

  if (solicitud.usado_at) {
    throw new Error("Esta firma ya fue completada anteriormente");
  }

  const firma = await saveFirma(
    payload.actaId,
    payload.tipo,
    firmaBase64,
    solicitud.destinatario_nombre,
    undefined,
    "WEB_REMOTA",
  );

  await pool.query(
    `UPDATE firma_remota_solicitudes SET usado_at = NOW(), ip = $2, user_agent = $3 WHERE id = $1`,
    [solicitud.id, ip ?? null, userAgent ?? null],
  );

  await resolveNotificationsByReference("firma_remota_solicitudes", solicitud.id);

  await createNotification(
    "FIRMA_REMOTA_COMPLETADA",
    "Firma remota completada",
    `${solicitud.destinatario_nombre ?? solicitud.destinatario_email} firmó de forma remota (${solicitud.tipo})`,
    "firma_remota_solicitudes",
    solicitud.id,
    null,
  );

  return firma;
};
