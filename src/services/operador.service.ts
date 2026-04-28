import { pool } from '../db.js';

export const getOperadores = async () => {
  const result = await pool.query(`
    SELECT id, nombre FROM operadores ORDER BY nombre
  `);

  return result.rows;
};