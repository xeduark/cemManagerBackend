import { pool } from "../config/db.js";

export const getSummary = async () => {
  const [actas, usuarios, sedes, cargos, operadores] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE estado = 'ABIERTA')::int AS abiertas,
        COUNT(*) FILTER (WHERE estado = 'CERRADA')::int AS cerradas
      FROM actas
    `),
    pool.query(`SELECT COUNT(*)::int AS total FROM users WHERE is_active = TRUE`),
    pool.query(`SELECT COUNT(*)::int AS total FROM sedes`),
    pool.query(`SELECT COUNT(*)::int AS total FROM cargos`),
    pool.query(`SELECT COUNT(*)::int AS total FROM operadores`),
  ]);

  return {
    actas: actas.rows[0],
    usuariosActivos: usuarios.rows[0].total,
    sedes: sedes.rows[0].total,
    cargos: cargos.rows[0].total,
    operadores: operadores.rows[0].total,
  };
};

export const getActasByEstado = async () => {
  const result = await pool.query(`
    SELECT estado, COUNT(*)::int AS total
    FROM actas
    GROUP BY estado
  `);

  return result.rows;
};

export const getActasBySede = async () => {
  const result = await pool.query(`
    SELECT s.id AS sede_id, s.nombre AS sede, COUNT(a.id)::int AS total
    FROM sedes s
    LEFT JOIN actas a ON a.sede_id = s.id
    GROUP BY s.id, s.nombre
    ORDER BY total DESC
  `);

  return result.rows;
};

export const getActasPorMes = async (months: number) => {
  const result = await pool.query(
    `
    SELECT
      to_char(date_trunc('month', created_at), 'YYYY-MM') AS mes,
      COUNT(*)::int AS total
    FROM actas
    WHERE created_at >= date_trunc('month', NOW()) - ($1 || ' months')::interval
    GROUP BY 1
    ORDER BY 1
    `,
    [months],
  );

  return result.rows;
};

export const getTiempoCierrePromedio = async () => {
  const result = await pool.query(`
    SELECT AVG(EXTRACT(EPOCH FROM (closed_at - created_at)) / 86400)::float AS dias_promedio
    FROM actas
    WHERE estado = 'CERRADA' AND closed_at IS NOT NULL
  `);

  return { diasPromedio: result.rows[0].dias_promedio ?? 0 };
};

export const getEquiposStats = async () => {
  const [laptops, diademas, celulares] = await Promise.all([
    pool.query(`
      SELECT lm.nombre AS marca, COUNT(a.id)::int AS total
      FROM laptop_marcas lm
      LEFT JOIN actas a ON a.laptop_marca_id = lm.id
      GROUP BY lm.nombre
      ORDER BY total DESC
    `),
    pool.query(`
      SELECT dm.nombre AS marca, COUNT(a.id)::int AS total
      FROM diadema_marcas dm
      LEFT JOIN actas a ON a.diadema_marca_id = dm.id
      GROUP BY dm.nombre
      ORDER BY total DESC
    `),
    pool.query(`
      SELECT cm.nombre AS marca, op.nombre AS operador, COUNT(c.id)::int AS total
      FROM celulares c
      LEFT JOIN celular_marcas cm ON cm.id = c.marca_id
      LEFT JOIN operadores op ON op.id = c.operador_id
      GROUP BY cm.nombre, op.nombre
      ORDER BY total DESC
    `),
  ]);

  return {
    laptops: laptops.rows,
    diademas: diademas.rows,
    celulares: celulares.rows,
  };
};

export const getUsuariosPorRol = async () => {
  const result = await pool.query(`
    SELECT role, is_active, COUNT(*)::int AS total
    FROM users
    GROUP BY role, is_active
    ORDER BY role
  `);

  return result.rows;
};
