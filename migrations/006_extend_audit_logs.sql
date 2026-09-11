-- =====================================================
-- MIGRACIÓN: extender audit_logs para que sea útil de verdad
-- =====================================================
-- La tabla ya existía (id, user_id, action, module, created_at) pero nada
-- le escribía nunca. Se agregan columnas para saber SOBRE QUÉ se actuó.

ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS entidad_tipo VARCHAR(50),
ADD COLUMN IF NOT EXISTS entidad_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS detalle TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
