import { pool } from '../db.js';
import { ActaPayload } from '../types/acta.types.js';

export interface ActaDB {
  id: number;
  acta_number: number;
  payload: ActaPayload;
  estado: 'BORRADOR' | 'CERRADA';
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

/**
 * Crear una nueva acta (estado BORRADOR)
 */
export const createActa = async (
  payload: ActaPayload
): Promise<ActaDB> => {
  const result = await pool.query(
    `
    INSERT INTO actas (acta_number, payload, estado)
    VALUES (
      (SELECT COALESCE(MAX(acta_number), 0) + 1 FROM actas),
      $1,
      'BORRADOR'
    )
    RETURNING *
    `,
    [payload]
  );

  return result.rows[0];
};

/**
 * Obtener un acta por ID (preview / edición)
 */
export const getActaById = async (
  id: number
): Promise<ActaDB | null> => {
  const result = await pool.query(
    `
    SELECT *
    FROM actas
    WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] ?? null;
};

/**
 * Actualizar acta (solo si está en BORRADOR)
 */
export const updateActa = async (
  id: number,
  payload: ActaPayload
): Promise<ActaDB | null> => {
  const result = await pool.query(
    `
    UPDATE actas
    SET payload = $1,
        updated_at = NOW()
    WHERE id = $2
      AND estado = 'BORRADOR'
    RETURNING *
    `,
    [payload, id]
  );

  return result.rows[0] ?? null;
};

/**
 * Cerrar acta (ya no editable)
 */
export const closeActa = async (
  id: number
): Promise<ActaDB | null> => {
  const result = await pool.query(
    `
    UPDATE actas
    SET estado = 'CERRADA',
        closed_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );

  return result.rows[0] ?? null;
};

/**
 * Obtener todas las actas (ordenadas por fecha)
 */
export const getAllActas = async () => {
  const result = await pool.query(`
    SELECT *
    FROM actas
    ORDER BY created_at DESC
  `);

  return result.rows;
};
