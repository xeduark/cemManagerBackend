import { pool } from "../config/db.js";
import { ActaPayload } from "../types/acta.types.js";

// 🔹 servicios externos
import {
  getLaptopBySerial,
  assignLaptopToActa,
  releaseLaptopsFromActa,
  validateLaptop,
} from "./laptop.service.js";

import { insertCelular, deleteCelularByActa } from "./celular.service.js";

/* ======================================================
   TYPES
====================================================== */

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
  estado: "ABIERTA" | "CERRADA";
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

/* ======================================================
   CREATE
====================================================== */

export const createActa = async (
  data: ActaPayload,
  diademaMarcaId?: number,
  diademaSerial?: string,
  laptopMarcaId?: number,
): Promise<ActaWithCelular | null> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 🔹 1. crear acta
    const result = await client.query(
      `
      INSERT INTO actas (
        acta_number,
        fecha,
        cargo_id,
        cargo_especificacion,
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
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
      )
      RETURNING *
      `,
      [
        data.fecha,                        // $1
        data.cargoId,                      // $2
        data.cargoEspecificacion ?? null,  // $3
        data.sedeId,                       // $4
        data.equipo,                       // $5
        data.laptopSerial,                 // $6
        laptopMarcaId ?? null,             // $7
        data.accesorios,                   // $8
        data.observaciones,                // $9
        data.recibidoPorNombre,            // $10
        data.recibidoPorCC,                // $11
        data.entregadoPorNombre ?? null,   // $12
        data.entregadoPorCC ?? null,       // $13
        data.vistoBueno,                   // $14
        diademaSerial ?? null,             // $15
        diademaMarcaId ?? null,            // $16
        data.estado ?? "ABIERTA",          // $17
      ],
    );

    const acta = result.rows[0];

    // 🔹 2. celular
    if (data.celular && data.celular.numero) {
      await insertCelular(client, acta.id, data.celular);
    }

    // 🔹 3. laptop (opcional)
    if (data.laptopSerial) {
      const laptop = await getLaptopBySerial(client, data.laptopSerial);

      if (laptop) {
        validateLaptop(laptop);
        await assignLaptopToActa(client, acta.id, laptop.id);
      }
    }

    await client.query("COMMIT");

    return await getActaById(acta.id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/* ======================================================
   GET BY ID
====================================================== */

export const getActaById = async (
  id: number,
): Promise<ActaWithCelular | null> => {
  const result = await pool.query(
    `
    SELECT
      a.*,

      -- 🔥 CARGO Y SEDE
      cg.nombre AS cargo,
      s.nombre AS sede,

      -- 🔥 CELULAR
      ce.numero AS celular_numero,
      ce.imei AS celular_imei,
      ce.marca_id AS celular_marca_id,
      ce.modelo AS celular_modelo,
      ce.operador_id AS celular_operador_id,

      -- 🔥 NOMBRES
      cm.nombre AS celular_marca_nombre,
      op.nombre AS celular_operador_nombre,
      dm.nombre AS diadema_marca_nombre,
      lm.nombre AS laptop_marca_nombre

    FROM actas a

    LEFT JOIN cargos cg
      ON cg.id = a.cargo_id

    LEFT JOIN sedes s
      ON s.id = a.sede_id

    LEFT JOIN laptop_marcas lm
      ON lm.id = a.laptop_marca_id

    LEFT JOIN celulares ce
      ON ce.acta_id = a.id

    LEFT JOIN celular_marcas cm
      ON cm.id = ce.marca_id

    LEFT JOIN operadores op
      ON op.id = ce.operador_id

    LEFT JOIN diadema_marcas dm 
      ON dm.id = a.diadema_marca_id

    WHERE a.id = $1
    `,
    [id],
  );

  const row = result.rows[0];
  if (!row) return null;

  // ✅ Mapear cargo_especificacion a cargoEspecificacion
  return {
    ...row,
    cargoEspecificacion: row.cargo_especificacion,
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

/* ======================================================
   UPDATE
====================================================== */

export const updateActa = async (
  id: number,
  data: ActaPayload,
  diademaMarcaId?: number,
  diademaSerial?: string,
  laptopMarcaId?: number,
): Promise<ActaWithCelular | null> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      UPDATE actas
      SET
        fecha = $1,
        cargo_id = $2,
        cargo_especificacion = $3,
        sede_id = $4,
        equipo = $5,
        laptop_serial = $6,
        laptop_marca_id = $7,
        accesorios = $8,
        observaciones = $9,
        recibido_por_nombre = $10,
        recibido_por_cc = $11,
        entregado_por_nombre = $12,
        entregado_por_cc = $13,
        visto_bueno = $14,
        diadema_serial = $15,
        diadema_marca_id = $16,
        estado = $17,
        updated_at = NOW()
      WHERE id = $18
        AND estado = 'ABIERTA'
      RETURNING *
      `,
      [
        data.fecha,
        data.cargoId,
        data.cargoEspecificacion ?? null, 
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
        data.estado,
        id,
      ],
    );

    const acta = result.rows[0];
    if (!acta) {
      await client.query("ROLLBACK");
      return null;
    }

    // 🔹 celular
    await deleteCelularByActa(client, id);

    if (data.celular) {
      await insertCelular(client, id, data.celular);
    }

    // 🔹 laptop
    if (data.laptopSerial) {
      await releaseLaptopsFromActa(client, id);

      await client.query(
        `DELETE FROM acta_equipos WHERE acta_id = $1 AND tipo = 'laptop'`,
        [id],
      );

      const laptop = await getLaptopBySerial(client, data.laptopSerial);

      if (laptop) {
        validateLaptop(laptop);
        await assignLaptopToActa(client, id, laptop.id);
      }
    }

    await client.query("COMMIT");

    return await getActaById(id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/* ======================================================
   CLOSE ACTA
====================================================== */

export const closeActa = async (id: number): Promise<ActaDB | null> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      UPDATE actas
      SET estado = 'CERRADA',
          closed_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id],
    );

    await releaseLaptopsFromActa(client, id);

    await client.query("COMMIT");

    return result.rows[0] ?? null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/* ======================================================
   LIST
====================================================== */

export const getAllActas = async () => {
  const result = await pool.query(`
    SELECT * FROM actas
    ORDER BY created_at DESC
  `);

  return result.rows;
};

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

/* ======================================================
   PAGINATED y SEARCH
====================================================== */

export const getActasPaginated = async (
  page: number = 1,
  limit: number = 10,
  estado?: "ABIERTA" | "CERRADA",
  search?: string,
) => {
  const offset = (page - 1) * limit;

  let query = `
    SELECT *
    FROM actas
  `;

  const values: any[] = [];
  const filters: string[] = [];

  // FILTRO ESTADO
  if (estado) {
    values.push(estado);
    filters.push(`estado = $${values.length}`);
  }

  // FILTRO BÚSQUEDA (NOMBRE O CÉDULA)
  if (search?.trim()) {
    values.push(`%${search.trim()}%`);

    filters.push(`
      (
        LOWER(recibido_por_nombre) LIKE LOWER($${values.length})
        OR CAST(recibido_por_cc AS TEXT) LIKE $${values.length}
      )
    `);
  }

  // WHERE
  if (filters.length) {
    query += ` WHERE ${filters.join(" AND ")}`;
  }

  // Guardamos los valores SOLO para el COUNT
  const countValues = [...values];

  // Paginación
  query += `
    ORDER BY created_at DESC
    LIMIT $${values.length + 1}
    OFFSET $${values.length + 2}
  `;

  values.push(limit, offset);

  // Datos
  const data = await pool.query(query, values);

  // Total registros
  const total = await pool.query(
    `
      SELECT COUNT(*)
      FROM actas
      ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
    `,
    countValues,
  );

  return {
    data: data.rows,
    total: Number(total.rows[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(total.rows[0].count) / limit),
  };
};

//ESTADOS DE ACTA
export const updateEstadoActa = async (
  id: number,
  estado: "ABIERTA" | "CERRADA",
) => {
  const result = await pool.query(
    `UPDATE actas 
     SET estado = $1, updated_at = NOW() 
     WHERE id = $2 
     RETURNING *`,
    [estado, id],
  );

  return result.rows[0] ?? null;
};
