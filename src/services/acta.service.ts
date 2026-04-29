import { pool } from "../db.js";
import { ActaPayload } from "../types/acta.types.js";

export interface ActaDB {
  id: number;
  acta_number: string;
  fecha: string;
  cargo_id: number;
  sede_id: number;
  equipo: string;
  laptop_serial: string;
  laptop_marca_id?: number;
  accesorios: string;
  observaciones: string;
  recibido_por_nombre: string;
  recibido_por_cc: string;
  entregado_por_nombre?: string;
  entregado_por_cc?: string;
  visto_bueno: string;
  diadema_serial?: string;
  diadema_marca_id?: number;
  estado: "BORRADOR" | "CERRADA";
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface ActaWithCelular extends ActaDB {
  celular?: {
    numero: string;
    imei: string;
    marca_id: number;
    modelo: string;
    operador_id: number;
  } | null;
}

/**
 * Crear una nueva acta
 */
export const createActa = async (
  data: ActaPayload,
  diademaMarcaId?: number,
  diademaSerial?: string,
  laptopMarcaId?: number,
): Promise<ActaWithCelular | null> => {
  if (diademaMarcaId) {
    const marca = await getDiademaMarcaById(diademaMarcaId);
    if (!marca) throw new Error("La marca de diadema no existe");
  }

  if (laptopMarcaId) {
    const marcaLaptop = await getLaptopMarcaById(laptopMarcaId);
    if (!marcaLaptop) throw new Error("La marca de laptop no existe");
  }

  const result = await pool.query(
    `
    INSERT INTO actas (
      acta_number,
      fecha,
      cargo_id,
      sede_id,
      equipo,
      laptop_serial,
      laptop_marca_id,
      accesorios,
      observaciones,
      recibido_por_nombre,
      recibido_por_cc,
      entregado_por_nombre,
      entregado_por_cc,
      visto_bueno,
      diadema_serial,
      diadema_marca_id,
      estado
    )
    VALUES (
      'ACT-' || LPAD(nextval('acta_number_seq')::text, 4, '0'),
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
      'BORRADOR'
    )
    RETURNING *
    `,
    [
      data.fecha,
      data.cargoId,
      data.sedeId,
      data.equipo,
      data.laptopSerial,
      laptopMarcaId ?? null,
      data.accesorios,
      data.observaciones,
      data.recibidoPorNombre,
      data.recibidoPorCC,
      data.entregadoPorNombre ?? null,
      data.entregadoPorCC ?? null,
      data.vistoBueno,
      diademaSerial ?? null,
      diademaMarcaId ?? null,
    ],
  );

  const acta = result.rows[0];

  if (data.celular) {
    console.log("CELULAR RECIBIDO:", data.celular);
    await pool.query(
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
        acta.id,
        data.celular.numero,
        data.celular.imei,
        data.celular.marca_id,
        data.celular.modelo,
        data.celular.operador_id,
      ],
    );
  }

  return await getActaById(acta.id);
};

/**
 * Obtener un acta por ID
 */
export const getActaById = async (
  id: number
): Promise<ActaWithCelular | null> => {
  const result = await pool.query(
    `SELECT
    a.*,
    c.numero AS celular_numero,
    c.imei AS celular_imei,
    c.marca_id AS celular_marca_id,
    c.modelo AS celular_modelo,
    c.operador_id AS celular_operador_id
  FROM actas a
  LEFT JOIN celulares c ON c.acta_id = a.id
  WHERE a.id = $1`,
    [id],
  );

  const row = result.rows[0];

  if (!row) return null;

  return {
    ...row,
    celular: row.celular_numero
      ? {
          numero: row.celular_numero,
          imei: row.celular_imei,
          marca_id: row.celular_marca_id,
          modelo: row.celular_modelo,
          operador_id: row.celular_operador_id,
        }
      : null,
  };
};

/**
 * Actualizar acta (solo BORRADOR)
 */
export const updateActa = async (
  id: number,
  data: ActaPayload,
  diademaMarcaId?: number,
  diademaSerial?: string,
  laptopMarcaId?: number,
): Promise<ActaWithCelular | null> => {
  if (diademaMarcaId) {
    const marca = await getDiademaMarcaById(diademaMarcaId);
    if (!marca) throw new Error("La marca de diadema no existe");
  }

  if (laptopMarcaId) {
    const marcaLaptop = await getLaptopMarcaById(laptopMarcaId);
    if (!marcaLaptop) throw new Error("La marca de laptop no existe");
  }

  const result = await pool.query(
    `
    UPDATE actas
    SET
      fecha = $1,
      cargo_id = $2,
      sede_id = $3,
      equipo = $4,
      laptop_serial = $5,
      laptop_marca_id = $6,
      accesorios = $7,
      observaciones = $8,
      recibido_por_nombre = $9,
      recibido_por_cc = $10,
      entregado_por_nombre = $11,
      entregado_por_cc = $12,
      visto_bueno = $13,
      diadema_serial = $14,
      diadema_marca_id = $15,
      updated_at = NOW()
    WHERE id = $16
      AND estado = 'BORRADOR'
    RETURNING *
    `,
    [
      data.fecha,
      data.cargoId,
      data.sedeId,
      data.equipo,
      data.laptopSerial,
      laptopMarcaId ?? null,
      data.accesorios,
      data.observaciones,
      data.recibidoPorNombre,
      data.recibidoPorCC,
      data.entregadoPorNombre ?? null,
      data.entregadoPorCC ?? null,
      data.vistoBueno,
      diademaSerial ?? null,
      diademaMarcaId ?? null,
      id,
    ],
  );

  const acta = result.rows[0];

  if (data.celular) {
    await pool.query(`DELETE FROM celulares WHERE acta_id = $1`, [id]);

    await pool.query(
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
        id,
        data.celular.numero,
        data.celular.imei,
        data.celular.marca_id,
        data.celular.modelo,
        data.celular.operador_id,
      ],
    );
  }

  return await getActaById(id);
};

/**
 * Cerrar acta
 */
export const closeActa = async (id: number): Promise<ActaDB | null> => {
  const result = await pool.query(
    `
    UPDATE actas
    SET estado = 'CERRADA',
        closed_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [id],
  );

  return result.rows[0] ?? null;
};

/**
 * Listar todas
 */
export const getAllActas = async () => {
  const result = await pool.query(`
    SELECT * FROM actas
    ORDER BY created_at DESC
  `);

  return result.rows;
};

/**
 * Últimas actas
 */
export const getLatestActas = async (limit: number = 10) => {
  const result = await pool.query(
    `
    SELECT * FROM actas
    ORDER BY created_at DESC
    LIMIT $1
    `,
    [limit],
  );

  return result.rows;
};

/**
 * Marcas
 */
export const getDiademaMarcaById = async (id: number) => {
  const result = await pool.query(
    `SELECT * FROM diadema_marcas WHERE id = $1`,
    [id],
  );

  return result.rows[0] ?? null;
};

export const getLaptopMarcaById = async (id: number) => {
  const result = await pool.query(`SELECT * FROM laptop_marcas WHERE id = $1`, [
    id,
  ]);

  return result.rows[0] ?? null;
};

export const getDiademaMarcas = async () => {
  const result = await pool.query(`
    SELECT id, nombre FROM diadema_marcas ORDER BY nombre
  `);

  return result.rows;
};

export const getLaptopMarcas = async () => {
  const result = await pool.query(`
    SELECT id, nombre FROM laptop_marcas ORDER BY nombre
  `);

  return result.rows;
};

/**
 * Paginación + búsqueda
 */
export const getActasPaginated = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
) => {
  const offset = (page - 1) * limit;
  const searchQuery = `%${search}%`;

  const dataQuery = `
    SELECT *
    FROM actas
    WHERE 
      ($1 = '' OR 
        acta_number::text ILIKE $1 OR
        recibido_por_nombre ILIKE $1
      )
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const countQuery = `
    SELECT COUNT(*)
    FROM actas
    WHERE 
      ($1 = '' OR 
        acta_number::text ILIKE $1 OR
        recibido_por_nombre ILIKE $1
      )
  `;

  const data = await pool.query(dataQuery, [searchQuery, limit, offset]);
  const total = await pool.query(countQuery, [searchQuery]);

  return {
    data: data.rows,
    total: Number(total.rows[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(total.rows[0].count) / limit),
  };
};
