-- =====================================================
-- MIGRACIÓN: teléfono opcional para armar el link de WhatsApp
-- =====================================================

ALTER TABLE firma_remota_solicitudes
ADD COLUMN IF NOT EXISTS destinatario_telefono VARCHAR(30);

-- destinatario_email ya no es obligatorio: el envío ahora es manual por WhatsApp
ALTER TABLE firma_remota_solicitudes
ALTER COLUMN destinatario_email DROP NOT NULL;
