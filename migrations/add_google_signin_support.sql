-- ========================================
-- MIGRACIÓN: Agregar soporte para Google Sign-In
-- ========================================
-- Ejecutar en: Supabase Dashboard > SQL Editor

-- 1. Agregar columna para Google UID
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_uid VARCHAR(255);

-- 2. Agregar columna para foto de perfil
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 3. Crear índice para búsquedas por google_uid
CREATE INDEX IF NOT EXISTS idx_users_google_uid ON users(google_uid);

-- 4. La contraseña ahora puede ser NULL para usuarios de Google
-- (Opcional: si quieres permitir que users de Google no tengan password)
-- ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- ========================================
-- NOTA: Los usuarios que se registren con Google
-- tendrán una contraseña aleatoria que no usarán.
-- Pueden vincular un teléfono después si quieren.
-- ========================================
