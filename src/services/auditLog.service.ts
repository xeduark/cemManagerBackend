import { pool } from "../config/db.js";

export const logAction = async (
  userId: string | undefined,
  action: string,
  module: string,
  entidadTipo?: string,
  entidadId?: string | number,
  detalle?: string,
) => {
  try {
    await pool.query(
      `
      INSERT INTO audit_logs (user_id, action, module, entidad_tipo, entidad_id, detalle)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        userId ?? null,
        action,
        module,
        entidadTipo ?? null,
        entidadId !== undefined ? String(entidadId) : null,
        detalle ?? null,
      ],
    );
  } catch (error) {
    // La auditoría nunca debe tumbar la acción real que la originó
    console.error("⚠️ No se pudo registrar el log de auditoría:", error);
  }
};

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  module?: string;
  userId?: string;
}

export const getAuditLogs = async (filters: AuditLogFilters) => {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const offset = (page - 1) * limit;

  const values: any[] = [];
  const conditions: string[] = [];

  if (filters.module) {
    values.push(filters.module);
    conditions.push(`al.module = $${values.length}`);
  }

  if (filters.userId) {
    values.push(filters.userId);
    conditions.push(`al.user_id = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const data = await pool.query(
    `
    SELECT al.id, al.action, al.module, al.entidad_tipo, al.entidad_id, al.detalle, al.created_at,
           u.full_name AS usuario_nombre, u.email AS usuario_email
    FROM audit_logs al
    LEFT JOIN users u ON u.id = al.user_id
    ${where}
    ORDER BY al.created_at DESC
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `,
    [...values, limit, offset],
  );

  const total = await pool.query(
    `SELECT COUNT(*) FROM audit_logs al ${where}`,
    values,
  );

  return {
    data: data.rows,
    total: Number(total.rows[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(total.rows[0].count) / limit),
  };
};
