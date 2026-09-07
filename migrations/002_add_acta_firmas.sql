-- =====================================================
-- MIGRACIÓN: Firmas digitales de actas (panel TOPAZ)
-- =====================================================

-- Existía una tabla acta_firmas residual de la vieja integración
-- Cloudinary (columnas firma_url/public_id) que se borró del código
-- sin limpiar el esquema. Estaba vacía (0 filas) al momento de esta
-- migración, así que se reemplaza por el nuevo esquema base64.
DROP TABLE IF EXISTS acta_firmas;

CREATE TABLE IF NOT EXISTS acta_firmas (
  id SERIAL PRIMARY KEY,
  acta_id INTEGER NOT NULL REFERENCES actas(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('RECIBE', 'ENTREGA')),
  firma_base64 TEXT NOT NULL,
  firmante_nombre VARCHAR(255),
  firmante_cc VARCHAR(50),
  dispositivo VARCHAR(100) DEFAULT 'TOPAZ_T-S460-HBS-R',
  capturada_en TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (acta_id, tipo)
);

CREATE INDEX IF NOT EXISTS idx_acta_firmas_acta_id ON acta_firmas(acta_id);
