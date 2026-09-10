const { PDFParse } = require("pdf-parse");
const fs = require("fs");
const path = require("path");

const FILE_PATH = "c:/Users/CEM/Desktop/actasManager/cemManagerBackend/src/data/Actas de entrega para actualizar.pdf";
const OUT_JSON = path.join(__dirname, "../data/actas-parsed.json");
const OUT_REPORT = path.join(__dirname, "../data/actas-parse-report.md");

const HEADER_RE = /FORMATO ACTA DE ENTREGA DE EQUIPOS\s*\nCódigo:\s*\n-DC-012FO\s*\nVersión:\s*\n\d+\s*\nFecha:\s*\n[\d/]+\s*\nPágina \d+\s*\nUna vez descargado o impreso este documento se considera copia no controlada\s*\n?/g;

// Ancla única por acta: siempre aparece exactamente una vez.
const ANCHOR_RE = /Fecha de devoluci[oó]n:\s*([^\n]*)\n\s*Recibido por:\s*([^\n]*)/g;

const isBlank = (v) => {
  if (!v) return true;
  const trimmed = v.trim();
  if (trimmed === "") return true;
  // placeholders tipo "____________" o "____________-" (guiones bajos/medios/espacios)
  if (/^[_\-\s]+$/.test(trimmed)) return true;
  // a veces la línea de la SIGUIENTE acta (FECHA: ...) queda pegada a esta por un
  // glitch de extracción del PDF cuando dos líneas quedan muy cerca verticalmente.
  if (/^FECHA:/i.test(trimmed)) return true;
  return false;
};

const grabAfterLabel = (block, labelRe) => {
  const match = block.match(labelRe);
  return match ? match[1].trim() : null;
};

const parseDate = (raw) => {
  if (isBlank(raw)) return null;
  const cleaned = raw.trim();
  // admite DD/MM/YYYY, DD-MM-YYYY, D/M/YY etc.
  const m = cleaned.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (!m) return { raw: cleaned, iso: null };
  let [, d, mo, y] = m;
  if (y.length === 2) y = "20" + y;

  const dNum = Number(d);
  const moNum = Number(mo);
  const yNum = Number(y);

  // valida rangos reales antes de confiar en el ISO construido
  if (moNum < 1 || moNum > 12 || dNum < 1 || dNum > 31 || yNum < 2000 || yNum > 2035) {
    return { raw: cleaned, iso: null };
  }

  const iso = `${y.padStart(4, "0")}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  return { raw: cleaned, iso };
};

function parseActaBlock(rawBlock, devolucionRaw, recibidoDevolucionRaw, index) {
  const warnings = [];
  const block = rawBlock;

  // ---- Campos de encabezado ----
  const fechaMatch = block.match(/FECHA:\s*([^\n]+)/) || block.match(/\n(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*\n/);
  const fecha = fechaMatch ? parseDate(fechaMatch[1]) : null;
  if (!fecha) warnings.push("No se encontró FECHA de entrega");

  const nombre = grabAfterLabel(block, /\nNombre:[ \t]*([^\n]+)/);
  if (!nombre) warnings.push("Falta Nombre del empleado");

  const cargo = grabAfterLabel(block, /\nCargo[ \t]*:?[ \t]*([^\n]+)/);
  if (!cargo) warnings.push("Falta Cargo");

  const sede = grabAfterLabel(block, /\nSede[ \t]*:?[ \t]*([^\n]+)/);
  if (!sede) warnings.push("Falta Sede");

  const equipo = grabAfterLabel(block, /\nEquipo:[ \t]*([^\n]+)/);
  if (!equipo) warnings.push("Falta Equipo");

  let marca = grabAfterLabel(block, /\nMarca:[ \t]*([^\n]+)/);
  if (marca !== null && marca.trim() === "") {
    // A veces "Marca:" queda solo y el valor cae en la siguiente línea
    const idx = block.indexOf("Marca:");
    const after = block.slice(idx + "Marca:".length);
    const nextLine = after.split("\n").map((l) => l.trim()).find((l) => l !== "");
    marca = nextLine || null;
  }
  if (!marca) warnings.push("Falta Marca");

  // tolerante a "Ac1cesorios:" u otros glitches de extracción
  const accesorios = grabAfterLabel(block, /\nAc.{0,2}cesorios:[ \t]*([^\n]+(?:\n(?!Estado:)[^\n]+)*)/);
  if (!accesorios) warnings.push("Falta Accesorios");

  const estadoEquipo = grabAfterLabel(block, /\nEstado:[ \t]*([^\n]+)/);
  if (!estadoEquipo) warnings.push("Falta Estado del equipo");

  const observaciones = grabAfterLabel(
    block,
    /\nObservaciones:[ \t]*([^\n]+(?:\n(?!La persona que firma)[^\n]+)*)/,
  );

  // ---- Firmas / nombres completos / cédulas ----
  // Bloques "Nombre:" o "Nombre Completo:" seguidos de "CC." -> orden: recibido primero, entregado segundo
  // Tolera que el nombre se parta en una línea adicional (nombres largos que no caben en una línea).
  const nombreCcRe = /Nombre(?: Completo)?[ \t]*:?[ \t]*([^\n]+(?:\n(?!CC\.?|Nombre)[^\n]+)?)\n[ \t]*CC\.?[ \t]*:?[ \t]*([^\n]+)/g;
  const personas = [];
  let m;
  while ((m = nombreCcRe.exec(block)) !== null) {
    const nombrePersona = m[1].replace(/\s+/g, " ").trim();
    personas.push({ nombre: nombrePersona, cc: m[2].trim().replace(/^:/, "").trim() });
  }

  const recibidoPor = personas[0] || null;
  const entregadoPor = personas[1] || null;

  if (!recibidoPor) warnings.push("No se pudo extraer Recibido por (nombre/CC)");
  if (!entregadoPor) warnings.push("No se pudo extraer Entregado por (nombre/CC)");
  if (personas.length > 2) warnings.push(`Se encontraron ${personas.length} bloques nombre/CC (se esperaban 2)`);

  const vistoBueno = grabAfterLabel(block, /V\.?[ºo°]\s*B\.?[ºo°]\s*\n\s*([^\n]+)/);

  // ---- Estado del acta (abierta/cerrada) según devolución ----
  const devolucionBlank = isBlank(recibidoDevolucionRaw);
  const fechaDevolucion = devolucionBlank ? null : parseDate(devolucionRaw);
  const estado = devolucionBlank ? "ABIERTA" : "CERRADA";

  if (!devolucionBlank && !fechaDevolucion) {
    warnings.push("Hay 'Recibido por' de devolución pero no se pudo parsear la fecha de devolución");
  }

  return {
    index,
    fecha,
    nombre,
    cargo,
    sede,
    equipo,
    marca,
    accesorios,
    estadoEquipo,
    observaciones,
    recibidoPor,
    entregadoPor,
    vistoBueno,
    estado,
    fechaDevolucion,
    recibidoDevolucionNombre: devolucionBlank ? null : recibidoDevolucionRaw.trim(),
    warnings,
  };
}

async function main() {
  const buffer = fs.readFileSync(FILE_PATH);
  const parser = new PDFParse({ data: buffer });

  const info = await parser.getInfo();
  const totalPages = info.total;
  console.log(`Total de páginas en el PDF: ${totalPages}`);

  const textResult = await parser.getText();
  await parser.destroy();

  // Concatenar todo el documento en un solo stream, quitando encabezado/pie repetido
  let fullText = "";
  for (const page of textResult.pages) {
    fullText += page.text.replace(HEADER_RE, "") + "\n";
  }

  // Encontrar todas las anclas (fin de cada acta)
  const anchors = [];
  let match;
  ANCHOR_RE.lastIndex = 0;
  while ((match = ANCHOR_RE.exec(fullText)) !== null) {
    let end = match.index + match[0].length;
    let recibidoDevolucionRaw = match[2];

    // Si la línea de "Recibido por:" quedó pegada a la FECHA de la SIGUIENTE
    // acta (glitch de extracción cuando dos líneas caen muy cerca en Y),
    // no consumir esa parte: le pertenece al siguiente bloque.
    const bleedIdx = recibidoDevolucionRaw.search(/FECHA:/i);
    if (bleedIdx !== -1) {
      end -= recibidoDevolucionRaw.length - bleedIdx;
      recibidoDevolucionRaw = recibidoDevolucionRaw.slice(0, bleedIdx);
    }

    anchors.push({
      start: match.index,
      end,
      devolucionRaw: match[1],
      recibidoDevolucionRaw,
    });
  }

  console.log(`Actas detectadas (anclas encontradas): ${anchors.length}`);

  const actas = [];
  let cursor = 0;

  anchors.forEach((anchor, i) => {
    const rawBlock = fullText.slice(cursor, anchor.start);
    const acta = parseActaBlock(rawBlock, anchor.devolucionRaw, anchor.recibidoDevolucionRaw, i + 1);
    actas.push(acta);
    cursor = anchor.end;
  });

  // Sobrante después de la última ancla (no debería tener contenido útil, pero lo reportamos)
  const trailing = fullText.slice(cursor).trim();

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(actas, null, 2), "utf8");

  // ---- Reporte de validación ----
  const withWarnings = actas.filter((a) => a.warnings.length > 0);
  const clean = actas.length - withWarnings.length;
  const abiertas = actas.filter((a) => a.estado === "ABIERTA").length;
  const cerradas = actas.filter((a) => a.estado === "CERRADA").length;

  const warningCounts = {};
  for (const acta of actas) {
    for (const w of acta.warnings) {
      warningCounts[w] = (warningCounts[w] || 0) + 1;
    }
  }

  const cargosUnicos = new Set(actas.map((a) => (a.cargo || "").trim().toUpperCase()).filter(Boolean));
  const sedesUnicas = new Set(actas.map((a) => (a.sede || "").trim().toUpperCase()).filter(Boolean));
  const marcasUnicas = new Set(actas.map((a) => (a.marca || "").trim().toUpperCase()).filter(Boolean));

  const entregadoresUnicos = new Map();
  for (const a of actas) {
    if (a.entregadoPor) {
      const key = a.entregadoPor.cc || a.entregadoPor.nombre;
      if (!entregadoresUnicos.has(key)) entregadoresUnicos.set(key, { ...a.entregadoPor, count: 0 });
      entregadoresUnicos.get(key).count++;
    }
    if (a.recibidoPor) {
      const key = a.recibidoPor.cc || a.recibidoPor.nombre;
      if (!entregadoresUnicos.has(key)) entregadoresUnicos.set(key, { ...a.recibidoPor, count: 0 });
      entregadoresUnicos.get(key).count++;
    }
  }

  let report = `# Reporte de extracción — Actas de entrega\n\n`;
  report += `- Páginas del PDF: ${totalPages}\n`;
  report += `- Actas detectadas: ${actas.length}\n`;
  report += `- Sin ninguna advertencia: ${clean}\n`;
  report += `- Con al menos una advertencia: ${withWarnings.length}\n`;
  report += `- ABIERTA: ${abiertas}\n`;
  report += `- CERRADA: ${cerradas}\n`;
  report += `- Sobrante tras la última acta (debería estar vacío): ${trailing.length} caracteres\n\n`;

  report += `## Advertencias por tipo\n\n`;
  for (const [w, count] of Object.entries(warningCounts).sort((a, b) => b[1] - a[1])) {
    report += `- ${count}x — ${w}\n`;
  }

  report += `\n## Valores únicos de "Cargo" (comparar contra catálogo \`cargos\`)\n\n`;
  report += [...cargosUnicos].sort().map((c) => `- ${c}`).join("\n") + "\n";

  report += `\n## Valores únicos de "Sede" (comparar contra catálogo \`sedes\`)\n\n`;
  report += [...sedesUnicas].sort().map((s) => `- ${s}`).join("\n") + "\n";

  report += `\n## Valores únicos de "Marca" (comparar contra catálogos de marcas)\n\n`;
  report += [...marcasUnicas].sort().map((m) => `- ${m}`).join("\n") + "\n";

  report += `\n## Personas distintas que aparecen firmando (candidatos a "Entregado por" / usuarios de sistemas)\n\n`;
  const sortedPersonas = [...entregadoresUnicos.values()].sort((a, b) => b.count - a.count);
  for (const p of sortedPersonas) {
    report += `- ${p.nombre} — CC ${p.cc} — aparece en ${p.count} acta(s)\n`;
  }

  report += `\n## Primeras 5 actas con advertencias (muestra)\n\n`;
  for (const acta of withWarnings.slice(0, 5)) {
    report += `### Acta #${acta.index}\n`;
    report += "```json\n" + JSON.stringify(acta, null, 2) + "\n```\n\n";
  }

  fs.writeFileSync(OUT_REPORT, report, "utf8");

  console.log("JSON guardado en:", OUT_JSON);
  console.log("Reporte guardado en:", OUT_REPORT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
