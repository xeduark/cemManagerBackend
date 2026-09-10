-- =====================================================
-- MIGRACIÓN: cambio de contraseña obligatorio, solicitudes
-- de cambio de contraseña y configuración general (app_settings)
-- =====================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS password_reset_requests (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  motivo VARCHAR(30) NOT NULL CHECK (motivo IN ('OLVIDO', 'CAMBIO_REGULAR', 'CUENTA_COMPROMETIDA')),
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'RESUELTA')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resuelto_por UUID REFERENCES users(id),
  resuelto_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_requests_estado ON password_reset_requests(estado);

CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (key, value, is_public)
VALUES ('whatsapp_sistemas', '+573012799185', true)
ON CONFLICT (key) DO NOTHING;
