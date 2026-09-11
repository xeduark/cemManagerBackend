import { pool } from "../config/db.js";
import { SedeResponse } from "../types/sedes.types.js";

export const getActiveSedes = async (): Promise<SedeResponse[]> => {
  const result = await pool.query(`
    SELECT id, nombre
    FROM sedes
    WHERE activo = TRUE
    ORDER BY nombre
  `);

  return result.rows;
};

export interface CreateSedeDTO {
  nombre: string;
  direccion?: string;
  ciudad?: string;
  codigo?: string;
}

export const createSede = async (data: CreateSedeDTO) => {
  const result = await pool.query(
    `
    INSERT INTO sedes (nombre, direccion, ciudad, codigo, activo, created_at)
    VALUES ($1, $2, $3, $4, TRUE, NOW())
    RETURNING id, nombre, direccion, ciudad, codigo, activo
    `,
    [data.nombre, data.direccion ?? null, data.ciudad ?? null, data.codigo ?? null],
  );

  return result.rows[0];
};

export const deactivateSede = async (id: number) => {
  const result = await pool.query(
    `
    UPDATE sedes
    SET activo = FALSE
    WHERE id = $1
    RETURNING id, nombre, activo
    `,
    [id],
  );

  return result.rows[0] || null;
};