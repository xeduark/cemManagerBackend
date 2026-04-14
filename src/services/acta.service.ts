import { pool } from "../db.js";
import { ActaPayload } from "../types/acta.types.js";

export interface ActaDB {
  id: number;
  acta_number: number;
  payload: ActaPayload;
  estado: "BORRADOR" | "CERRADA";
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}



/**
 * Crear una nueva acta
 */
export const createActa = async (

  payload: ActaPayload,
  diademaMarcaId?: number,
  diademaSerial?: string,
  laptopMarcaId?: number,
): Promise<ActaDB> => {
  //  validar correctamente la marca de diadema si se proporciona (para evitar referencias a marcas inexistentes)
  if (diademaMarcaId) {
    const marca = await getDiademaMarcaById(diademaMarcaId);

    if (!marca) {
      throw new Error("La marca de diadema no existe");
    }
  }

  if (laptopMarcaId) {
    const marcaLaptop = await getLaptopMarcaById(laptopMarcaId); 
    
    if (!marcaLaptop) {
      throw new Error("La marca de laptop no existe");
    }

  }


  const result = await pool.query(
    `
    INSERT INTO actas (
      acta_number,
      payload,
      estado,
      diadema_marca_id,
      diadema_serial,
      laptop_marca_id

    )
    VALUES (
      'ACT-' || LPAD(nextval('acta_number_seq')::text, 4, '0'),
      $1,
      'BORRADOR',
      $2,
      $3,
      $4
    )
    RETURNING *
    `,
    [payload, diademaMarcaId, diademaSerial, laptopMarcaId],
  );

  return result.rows[0];
};

/**
 * Obtener un acta por ID (preview / edición)
 */
export const getActaById = async (id: number): Promise<ActaDB | null> => {
  const result = await pool.query(
    `
    SELECT *
    FROM actas
    WHERE id = $1
    `,
    [id],
  );

  return result.rows[0] ?? null;
};

/**
 * Actualizar acta (solo si está en BORRADOR)
 */
export const updateActa = async (
  id: number,
  payload: ActaPayload,
  diademaMarcaId?: number,
  diademaSerial?: string,
  laptopMarcaId?: number,
): Promise<ActaDB | null> => {

  if (diademaMarcaId) {
    const marca = await getDiademaMarcaById(diademaMarcaId);

    if (!marca) {
      throw new Error("La marca de diadema no existe");
    }
  }

  if (laptopMarcaId) {
    const marcaLaptop = await getLaptopMarcaById(laptopMarcaId);
    
    if (!marcaLaptop) {
      throw new Error("La marca de laptop no existe");
    }

  }


  const result = await pool.query(
    `
    UPDATE actas
    SET payload = $1,
        diadema_marca_id = $2,
        diadema_serial = $3,
        laptop_marca_id = $4,

        updated_at = NOW()
    WHERE id = $5
      AND estado = 'BORRADOR'
    RETURNING *
    `,
    [payload, diademaMarcaId, diademaSerial, laptopMarcaId, id],
  );

  return result.rows[0] ?? null;
};

/**
 * Cerrar acta (ya no editable)
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



// Obtener las últimas N actas (para dashboard) pero permitir un límite dinámico vía query param
export const getLatestActas = async (limit: number = 10) => {
  const result = await pool.query(
    `
    SELECT *
    FROM actas
    ORDER BY created_at DESC
    LIMIT $1
    `,
    [limit],
  );

  return result.rows;
};

// Obtener marca de diadema por ID (para mostrar en el acta)
export const getDiademaMarcaById = async (id: number) => {
  const result = await pool.query(
    `SELECT * FROM diadema_marcas WHERE id = $1`,
    [id],
  );

  return result.rows[0] ?? null;
};

// Obtener marca de laptop por ID (para mostrar en el acta)
export const getLaptopMarcaById = async (id: number) => {
  const result = await pool.query(
    `SELECT * FROM laptop_marcas WHERE id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
};

// Obtener todas las marcas de diademas (para dropdown en el frontend)
export const getDiademaMarcas = async () => {
  const result = await pool.query(`
    SELECT id, nombre
    FROM diadema_marcas
    ORDER BY nombre
  `);

  return result.rows;
};

// Obtener todas las marcas de laptops (para dropdown en el frontend)
export const getLaptopMarcas = async () => {
  const result = await pool.query(`
    SELECT id, nombre
    FROM laptop_marcas
    ORDER BY nombre
  `);

  return result.rows;
};

// Búsqueda avanzada con paginación
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
        payload->>'nombre' ILIKE $1 OR
        payload->>'recibidoPorNombre' ILIKE $1 OR
        acta_number::text ILIKE $1
      )
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const countQuery = `
    SELECT COUNT(*)
    FROM actas
    WHERE 
      ($1 = '' OR 
        payload->>'nombre' ILIKE $1 OR
        payload->>'recibidoPorNombre' ILIKE $1 OR
        acta_number::text ILIKE $1
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
