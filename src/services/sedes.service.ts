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