import { pool } from "../config/db.js";

export const createNotification = async (
  tipo: string,
  titulo: string,
  mensaje: string | null,
  referenciaTabla: string | null,
  referenciaId: number | null,
  targetRole: string | null,
) => {
  const result = await pool.query(
    `
    INSERT INTO notifications (tipo, titulo, mensaje, referencia_tabla, referencia_id, target_role)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [tipo, titulo, mensaje, referenciaTabla, referenciaId, targetRole],
  );

  return result.rows[0];
};

export const getActiveNotifications = async (role: string) => {
  const result = await pool.query(
    `
    SELECT * FROM notifications
    WHERE estado = 'PENDIENTE'
      AND (target_role IS NULL OR target_role = $1)
    ORDER BY created_at DESC
    `,
    [role.toUpperCase()],
  );

  return result.rows;
};

export const dismissNotification = async (id: number) => {
  const result = await pool.query(
    `
    UPDATE notifications
    SET estado = 'DESCARTADA', descartada_at = NOW()
    WHERE id = $1 AND estado = 'PENDIENTE'
    RETURNING *
    `,
    [id],
  );

  return result.rows[0] || null;
};

export const resolveNotificationsByReference = async (
  referenciaTabla: string,
  referenciaId: number,
) => {
  await pool.query(
    `
    UPDATE notifications
    SET estado = 'RESUELTA', resuelta_at = NOW()
    WHERE referencia_tabla = $1 AND referencia_id = $2 AND estado = 'PENDIENTE'
    `,
    [referenciaTabla, referenciaId],
  );
};
