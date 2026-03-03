import { pool } from '../db.js';
import { CargoResponse } from '../types/jobTitle.types.js';

export const getActiveCargos = async (): Promise<CargoResponse[]> => {
  const result = await pool.query(`
    SELECT id, nombre
    FROM cargos
    WHERE activo = TRUE
    ORDER BY nombre
  `);

  return result.rows;
};