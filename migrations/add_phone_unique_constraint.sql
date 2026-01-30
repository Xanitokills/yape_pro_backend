-- ========================================
-- MIGRACIÓN: Agregar restricción UNIQUE al teléfono
-- ========================================
-- Ejecutar en: Supabase Dashboard > SQL Editor

-- 1. Primero verificar si hay teléfonos duplicados
SELECT phone, COUNT(*) as count 
FROM users 
WHERE phone IS NOT NULL 
GROUP BY phone 
HAVING COUNT(*) > 1;

-- 2. Si no hay duplicados, agregar la restricción UNIQUE
ALTER TABLE users 
ADD CONSTRAINT users_phone_unique UNIQUE (phone);

-- 3. Crear índice para búsquedas rápidas por teléfono
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- ========================================
-- NOTA: Si hay duplicados, primero debes resolverlos
-- manualmente antes de agregar la restricción.
-- ========================================
