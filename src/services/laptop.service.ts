import { PoolClient } from "pg";

/**
 * Buscar laptop por serial
 */
export const getLaptopBySerial = async (client: PoolClient, serial: string) => {
  const result = await client.query(
    `SELECT * FROM laptops WHERE placa_inventario = $1`,
    [serial]
  );

  return result.rows[0] ?? null;
};

/**
 * Validar estado de laptop
 */
export const validateLaptop = (laptop: any) => {
  if (laptop.estado_id === 2) {
    throw new Error("La laptop ya está asignada");
  }

  if (laptop.estado_id !== 1) {
    throw new Error("La laptop no está disponible");
  }
};

/**
 * Asignar laptop a acta
 */
export const assignLaptopToActa = async (
  client: PoolClient,
  actaId: number,
  laptopId: number
) => {
  await client.query(
    `INSERT INTO acta_equipos (acta_id, tipo, equipo_id)
     VALUES ($1, 'laptop', $2)`,
    [actaId, laptopId]
  );

  await client.query(
    `UPDATE laptops SET estado_id = 2 WHERE id = $1`,
    [laptopId]
  );
};

/**
 * Liberar laptops de un acta
 */
export const releaseLaptopsFromActa = async (
  client: PoolClient,
  actaId: number
) => {
  const result = await client.query(
    `SELECT equipo_id FROM acta_equipos 
     WHERE acta_id = $1 AND tipo = 'laptop'`,
    [actaId]
  );

  for (const row of result.rows) {
    await client.query(
      `UPDATE laptops SET estado_id = 1 WHERE id = $1`,
      [row.equipo_id]
    );
  }
};