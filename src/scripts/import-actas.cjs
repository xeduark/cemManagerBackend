require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME,
});

const CARGOS = [
  { id: 1, nombre: "Medico" },
  { id: 2, nombre: "Auxiliar" },
  { id: 3, nombre: "Asesor Call Center" },
  { id: 4, nombre: "Lider" },
  { id: 5, nombre: "Gestor Clinico" },
];

const SEDES = [
  { id: 1, nombre: "BALBOA" },
  { id: 2, nombre: "CARPAS" },
  { id: 3, nombre: "CASA ESPERANZA" },
  { id: 4, nombre: "CENTRO DÍA" },
  { id: 5, nombre: "GESTIONES TRANSVERSALES" },
  { id: 6, nombre: "INTERVENCIÓN EN CALLE" },
  { id: 7, nombre: "MALL INDIANA" },
  { id: 8, nombre: "PALMAS" },
  { id: 9, nombre: "RECONSTRUYENDO MI VIDA" },
  { id: 10, nombre: "SAGRADO CORAZÓN" },
  { id: 11, nombre: "SAN CRISTOBAL" },
  { id: 12, nombre: "SAN FERNANDO PLAZA" },
  { id: 13, nombre: "SAN FERNANDO PLAZA DROGUERIA" },
  { id: 14, nombre: "SANTA ELENA" },
  { id: 15, nombre: "SEDE ADMINISTRATIVO" },
  { id: 16, nombre: "SEDE AUTOINMUNES ANTIOQUIA" },
  { id: 17, nombre: "SEDE AYACUCHO" },
  { id: 18, nombre: "SEDE ENVIGADO" },
  { id: 19, nombre: "SEDE EXTERNA" },
  { id: 20, nombre: "SEDE LA 30" },
  { id: 21, nombre: "SEDE LA MARIA" },
  { id: 22, nombre: "SEDE LAURELES" },
  { id: 23, nombre: "SEDE MERIDIAM" },
  { id: 24, nombre: "SEDE OVIEDO" },
  { id: 25, nombre: "SEDE PALMAS" },
  { id: 26, nombre: "SEDE PRADO" },
  { id: 27, nombre: "SEDE RIONEGRO" },
  { id: 28, nombre: "SEDE URABA" },
  { id: 29, nombre: "TRANSITORIO SAN JUAN" },
  { id: 30, nombre: "ZÚÑIGA" },
  { id: 31, nombre: "SEDES CASA" },
];

const SEDE_FALLBACK_ID = 19; // SEDE EXTERNA

const normalize = (s) =>
  (s || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const SEDE_SYNONYMS = [
  [/TRABAJO EN CASA|SEDES? ?- ?CASA|SEDES CASA/, "SEDES CASA"],
  [/APARTAD|URABA/, "SEDE URABA"],
  [/LA MARIA/, "SEDE LA MARIA"],
  [/MERIDIAN|MERIDIAM/, "SEDE MERIDIAM"],
  [/CENTRO DIA/, "CENTRO DIA"],
  [/AYACUCHO/, "SEDE AYACUCHO"],
  [/OVIEDO/, "SEDE OVIEDO"],
  [/^PRADO$|SEDES? PRADO/, "SEDE PRADO"],
  [/LAURELES/, "SEDE LAURELES"],
  [/RIONEGRO/, "SEDE RIONEGRO"],
  [/SAGRADO CORAZON/, "SAGRADO CORAZON"],
  [/SAN CRISTOBAL/, "SAN CRISTOBAL"],
  [/^SANTA ELENA$|SEDES? SANTA ELENA/, "SANTA ELENA"],
  [/ENVIGADO/, "SEDE ENVIGADO"],
  [/ADMINISTRATIV/, "SEDE ADMINISTRATIVO"],
  [/AUTOINMUNE/, "SEDE AUTOINMUNES ANTIOQUIA"],
  [/LA 30/, "SEDE LA 30"],
  [/SAN JUAN/, "TRANSITORIO SAN JUAN"],
  [/BALBOA/, "BALBOA"],
  [/CARPAS/, "CARPAS"],
  [/^PALMAS$|SEDES? PALMAS/, "PALMAS"],
  [/ZUNIGA/, "ZUNIGA"],
  [/MALL INDIANA/, "MALL INDIANA"],
  [/CASA ESPERANZA/, "CASA ESPERANZA"],
  [/RECONSTRUYENDO/, "RECONSTRUYENDO MI VIDA"],
];

const normalizedSedes = SEDES.map((s) => ({ ...s, norm: normalize(s.nombre) }));

function matchSede(rawSede) {
  if (!rawSede) return { id: SEDE_FALLBACK_ID, matched: false };
  const norm = normalize(rawSede);

  // 1. match exacto
  let hit = normalizedSedes.find((s) => s.norm === norm);
  if (hit) return { id: hit.id, matched: true };

  // 2. sinónimos conocidos
  for (const [re, target] of SEDE_SYNONYMS) {
    if (re.test(norm)) {
      hit = normalizedSedes.find((s) => s.norm === target);
      if (hit) return { id: hit.id, matched: true };
    }
  }

  // 3. contiene / está contenido
  hit = normalizedSedes.find((s) => norm.includes(s.norm) || s.norm.includes(norm));
  if (hit) return { id: hit.id, matched: true };

  return { id: SEDE_FALLBACK_ID, matched: false };
}

const CARGO_RULES = [
  [/CALL CENTER|ASESOR/, "Asesor Call Center"],
  [/MEDIC|PSIQUIATR|ENFERMER|EPIDEMIOLOG|QUIMIC|QUIMIC FARMACEUT|FARMACEUT|TERAPEUT|NUTRICIONISTA|INSTRUMENTADORA|BIOMEDIC/, "Medico"],
  [/GESTOR|PSICOLOG|NEUROPSICOLOG|TRABAJADOR|TRABAJO SOCIAL|ORIENTADOR|REGENTE/, "Gestor Clinico"],
  [/LIDER|COORDINAD|DIRECTOR|GERENTE|JEFE/, "Lider"],
];

function matchCargo(rawCargo) {
  const norm = normalize(rawCargo);
  for (const [re, target] of CARGO_RULES) {
    if (re.test(norm)) {
      return CARGOS.find((c) => c.nombre === target).id;
    }
  }
  return CARGOS.find((c) => c.nombre === "Auxiliar").id; // catch-all
}

async function main() {
  const actas = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/actas-parsed.json"), "utf8"),
  );

  const client = await pool.connect();
  const importLog = [];
  let sedeFallbackCount = 0;
  const cargoCounts = {};

  try {
    await client.query("BEGIN");

    for (const acta of actas) {
      const cargoId = matchCargo(acta.cargo);
      cargoCounts[cargoId] = (cargoCounts[cargoId] || 0) + 1;

      const sedeMatch = matchSede(acta.sede);
      if (!sedeMatch.matched) sedeFallbackCount++;

      let observaciones = acta.observaciones || "";
      if (!sedeMatch.matched && acta.sede) {
        observaciones = `[SEDE ORIGINAL: ${acta.sede}] ${observaciones}`.trim();
      }

      const equipoTexto = [acta.equipo, acta.marca ? `Marca: ${acta.marca}` : null]
        .filter(Boolean)
        .join(" | ");

      const fechaIso = acta.fecha?.iso || null;
      const createdAt = fechaIso ? `${fechaIso}T08:00:00` : null;
      const closedAt =
        acta.estado === "CERRADA" && acta.fechaDevolucion?.iso
          ? `${acta.fechaDevolucion.iso}T08:00:00`
          : null;

      const result = await client.query(
        `
        INSERT INTO actas (
          acta_number, fecha, cargo_id, cargo_especificacion, sede_id,
          equipo, accesorios, observaciones,
          recibido_por_nombre, recibido_por_cc,
          entregado_por_nombre, entregado_por_cc,
          visto_bueno, estado, created_at, updated_at, closed_at
        )
        VALUES (
          'ACT-' || LPAD(nextval('acta_number_seq')::text, 4, '0'),
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          COALESCE($14::timestamp, NOW()), COALESCE($14::timestamp, NOW()), $15::timestamp
        )
        RETURNING id, acta_number
        `,
        [
          fechaIso,
          cargoId,
          acta.cargo || null,
          sedeMatch.id,
          equipoTexto || null,
          acta.accesorios || null,
          observaciones || null,
          acta.recibidoPor?.nombre || null,
          acta.recibidoPor?.cc || null,
          acta.entregadoPor?.nombre || null,
          acta.entregadoPor?.cc || null,
          acta.vistoBueno || null,
          acta.estado,
          createdAt,
          closedAt,
        ],
      );

      importLog.push({
        sourceIndex: acta.index,
        actaNumber: result.rows[0].acta_number,
        sedeFallback: !sedeMatch.matched,
      });
    }

    await client.query("COMMIT");
    console.log(`✅ Insertadas ${importLog.length} actas.`);
    console.log(`Sedes sin match confiable (usaron SEDE EXTERNA como respaldo): ${sedeFallbackCount}`);
    console.log("Distribución de cargo_id asignado:", cargoCounts);

    fs.writeFileSync(
      path.join(__dirname, "../data/actas-import-log.json"),
      JSON.stringify(importLog, null, 2),
      "utf8",
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error durante la importación, se hizo ROLLBACK:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  main();
}
