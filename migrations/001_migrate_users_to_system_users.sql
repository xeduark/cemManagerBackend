-- =====================================================
-- MIGRACIÓN: Unificar users en system_users
-- =====================================================

BEGIN;

-- 1️⃣ Agregar campos de autenticación a system_users
ALTER TABLE system_users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- 2️⃣ Migrar usuarios de 'users' a 'system_users'
-- Migrar superadmin primero
INSERT INTO system_users (
  id,
  nombre,
  email,
  password_hash,
  role,
  activo,
  created_at,
  updated_at
)
SELECT 
  id,
  full_name,
  email,
  password_hash,
  role,
  is_active,
  created_at,
  COALESCE(updated_at, NOW())
FROM users
WHERE email = 'admin@cem.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Migrar resto de usuarios
INSERT INTO system_users (
  nombre,
  email,
  password_hash,
  role,
  activo,
  created_at
)
SELECT 
  full_name,
  email,
  password_hash,
  role,
  is_active,
  created_at
FROM users
WHERE email != 'admin@cem.com'
  AND email NOT IN (SELECT email FROM system_users WHERE email IS NOT NULL)
ON CONFLICT (email) DO NOTHING;

-- 3️ Actualizar audit_logs
-- Primero, hacer backup por si acaso
CREATE TABLE IF NOT EXISTS audit_logs_backup AS 
SELECT * FROM audit_logs;

-- Actualizar user_id para que apunte a system_users
-- (Asumiendo que los IDs coinciden entre users y system_users)
UPDATE audit_logs al
SET user_id = su.id
FROM system_users su
WHERE al.user_id = su.id
  AND EXISTS (SELECT 1 FROM users u WHERE u.id = su.id);

-- 4️⃣ Cambiar foreign key constraint
ALTER TABLE audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

ALTER TABLE audit_logs 
ADD CONSTRAINT audit_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES system_users(id) 
ON DELETE SET NULL;

-- 5️ Agregar índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_system_users_email ON system_users(email);
CREATE INDEX IF NOT EXISTS idx_system_users_activo ON system_users(activo);

-- 6️⃣ Agregar constraint UNIQUE en email
ALTER TABLE system_users 
ADD CONSTRAINT system_users_email_unique UNIQUE (email);

COMMIT;

-- =====================================================
-- VERIFICACIÓN (Ejecutar después de COMMIT)
-- =====================================================
-- SELECT COUNT(*) as total_users FROM system_users WHERE email IS NOT NULL;
-- SELECT COUNT(*) as total_logs FROM audit_logs;
-- SELECT * FROM system_users WHERE email = 'admin@cem.com';