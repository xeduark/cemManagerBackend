import { pool } from "../config/db.js";

export type TipoFirma = "RECIBE" | "ENTREGA";

const MIN_BASE64_LENGTH = 500;

export const saveFirma = async (
  actaId: number,
  tipo: TipoFirma,
  firmaBase64: string,
  firmanteNombre?: string,
  firmanteCC?: string,
  dispositivo?: string,
) => {
  if (!firmaBase64 || firmaBase64.length < MIN_BASE64_LENGTH) {
    throw new Error("Firma vacía o inválida");
  }

  const result = await pool.query(
    `
    INSERT INTO acta_firmas (acta_id, tipo, firma_base64, firmante_nombre, firmante_cc, dispositivo)
    VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'TOPAZ_T-S460-HBS-R'))
    ON CONFLICT (acta_id, tipo) DO UPDATE SET
      firma_base64 = EXCLUDED.firma_base64,
      firmante_nombre = EXCLUDED.firmante_nombre,
      firmante_cc = EXCLUDED.firmante_cc,
      dispositivo = EXCLUDED.dispositivo,
      capturada_en = NOW()
    RETURNING id, acta_id, tipo, firmante_nombre, firmante_cc, dispositivo, capturada_en
    `,
    [actaId, tipo, firmaBase64, firmanteNombre ?? null, firmanteCC ?? null, dispositivo ?? null],
  );

  return result.rows[0];
};
