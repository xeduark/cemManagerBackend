import { PoolClient } from "pg";

/**
 * Insertar celular
 */
export const insertCelular = async (
  client: PoolClient,
  actaId: number,
  celular: {
    numero: string;
    imei: string;
    marca_id: number;
    modelo: string;
    operador_id: number;
  }
) => {
  console.log("🚀 INSERTANDO CELULAR:");
console.log("ACTA ID:", actaId);
console.log("DATA CELULAR:", celular);
  await client.query(
    `
    INSERT INTO celulares (
      acta_id,
      numero,
      imei,
      marca_id,
      modelo,
      operador_id
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    `,
    [
      actaId,
      celular.numero,
      celular.imei,
      celular.marca_id,
      celular.modelo,
      celular.operador_id,
    ]
  );
};

/**
 * Eliminar celular de un acta
 */
export const deleteCelularByActa = async (
  client: PoolClient,
  actaId: number
) => {
  await client.query(
    `DELETE FROM celulares WHERE acta_id = $1`,
    [actaId]
  );
};