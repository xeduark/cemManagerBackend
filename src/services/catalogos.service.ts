import { pool } from "../config/db.js";

/// 🔹 servicio de marcas
export const getLaptopMarcas = async () => {
  const result = await pool.query(`
    SELECT id, nombre
    FROM laptop_marcas
    ORDER BY nombre
  `);

  return result.rows;
};

export const getDiademaMarcas = async () => {
  const result = await pool.query(`
    SELECT id, nombre
    FROM diadema_marcas
    ORDER BY nombre
  `);

  return result.rows;
};

export const getCelularMarcas = async () => {
  const result = await pool.query(`
    SELECT id, nombre
    FROM celular_marcas
    ORDER BY nombre
  `);

  return result.rows;
};