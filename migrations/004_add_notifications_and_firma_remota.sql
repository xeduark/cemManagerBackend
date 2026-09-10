-- =====================================================
-- MIGRACIÓN: notificaciones persistentes + firma remota
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT,
  referencia_tabla VARCHAR(100),
  referencia_id INTEGER,
  target_role VARCHAR(20), -- NULL = visible para cualquier autenticado
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'RESUELTA', 'DESCARTADA')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resuelta_at TIMESTAMP,
  descartada_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_estado ON notifications(estado);
CREATE INDEX IF NOT EXISTS idx_notifications_referencia ON notifications(referencia_tabla, referencia_id);

CREATE TABLE IF NOT EXISTS firma_remota_solicitudes (
  id SERIAL PRIMARY KEY,
  acta_id INTEGER NOT NULL REFERENCES actas(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('RECIBE', 'ENTREGA')),
  destinatario_email VARCHAR(255) NOT NULL,
  destinatario_nombre VARCHAR(255),
  token VARCHAR(100) NOT NULL UNIQUE,
  codigo_hash TEXT NOT NULL,
  intentos INTEGER NOT NULL DEFAULT 0,
  expira_en TIMESTAMP NOT NULL,
  usado_at TIMESTAMP,
  ip VARCHAR(64),
  user_agent TEXT,
  creado_por UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_firma_remota_token ON firma_remota_solicitudes(token);
