import { pool } from "../config/db.js";
import { hashPassword } from "../utils/bcrypt.js";
import { generateTempPassword } from "../utils/password.js";
import { createNotification, resolveNotificationsByReference } from "./notifications.service.js";

export type MotivoSolicitud = "OLVIDO" | "CAMBIO_REGULAR" | "CUENTA_COMPROMETIDA";

const MOTIVOS_VALIDOS: MotivoSolicitud[] = [
  "OLVIDO",
  "CAMBIO_REGULAR",
  "CUENTA_COMPROMETIDA",
];

export const isMotivoValido = (motivo: string): motivo is MotivoSolicitud =>
  MOTIVOS_VALIDOS.includes(motivo as MotivoSolicitud);

export const crearSolicitud = async (
  email: string,
  nombreCompleto: string,
  motivo: MotivoSolicitud,
) => {
  const result = await pool.query(
    `
    INSERT INTO password_reset_requests (email, nombre_completo, motivo)
    VALUES ($1, $2, $3)
    RETURNING id, email, nombre_completo, motivo, estado, created_at
    `,
    [email, nombreCompleto, motivo],
  );

  const solicitud = result.rows[0];

  await createNotification(
    "PASSWORD_RESET_REQUEST",
    "Solicitud de cambio de contraseña",
    `${nombreCompleto} (${email}) solicitó cambio de contraseña — motivo: ${motivo}`,
    "password_reset_requests",
    solicitud.id,
    "SUPERADMIN",
  );

  return solicitud;
};

export const listarSolicitudesPendientes = async () => {
  const result = await pool.query(`
    SELECT id, email, nombre_completo, motivo, estado, created_at
    FROM password_reset_requests
    WHERE estado = 'PENDIENTE'
    ORDER BY created_at ASC
  `);

  return result.rows;
};

export const resolverSolicitud = async (
  requestId: number,
  resueltoPor: string,
) => {
  const solicitud = await pool.query(
    `SELECT * FROM password_reset_requests WHERE id = $1`,
    [requestId],
  );

  const row = solicitud.rows[0];

  if (!row) {
    throw new Error("Solicitud no encontrada");
  }

  if (row.estado === "RESUELTA") {
    throw new Error("Esta solicitud ya fue resuelta");
  }

  const userResult = await pool.query(
    `SELECT id FROM users WHERE email = $1`,
    [row.email],
  );

  const user = userResult.rows[0];

  if (!user) {
    throw new Error("No existe un usuario con ese correo");
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  await pool.query(
    `UPDATE users
     SET password_hash = $1, must_change_password = true, updated_at = NOW()
     WHERE id = $2`,
    [passwordHash, user.id],
  );

  await pool.query(
    `UPDATE password_reset_requests
     SET estado = 'RESUELTA', resuelto_por = $1, resuelto_at = NOW()
     WHERE id = $2`,
    [resueltoPor, requestId],
  );

  await resolveNotificationsByReference("password_reset_requests", requestId);

  return { email: row.email, tempPassword };
};
