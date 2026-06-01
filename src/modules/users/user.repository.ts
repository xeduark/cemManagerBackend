import { pool } from "../../config/db.js";

export const findUserByEmail = async (
  email: string,
) => {
  const query = `
    SELECT *
    FROM users
    WHERE email = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(
    query,
    [email],
  );

  return rows[0];
};

export const findUserById = async (
  id: string,
) => {
  const query = `
    SELECT *
    FROM users
    WHERE id = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(
    query,
    [id],
  );

  return rows[0];
};