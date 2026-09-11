import { pool } from "../config/db.js";

export const getPersonalActivo = async () => {
  const result = await pool.query(`
    SELECT id, nombre, dni
    FROM system_users
    WHERE activo = TRUE
    ORDER BY nombre
  `);

  return result.rows;
};
