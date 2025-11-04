-- ========================================
-- 🚀 MIGRACIONES PENDIENTES
-- ========================================
-- EJECUTAR EN: Supabase Dashboard > SQL Editor

-- ========================================
-- MIGRACIÓN 1: Sistema de Códigos de Invitación
-- ========================================

-- 1. Hacer user_id nullable (permitir workers sin usuario aún)
ALTER TABLE workers
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Agregar campos para datos temporales del trabajador
ALTER TABLE workers
ADD COLUMN IF NOT EXISTS temp_full_name VARCHAR(255);

ALTER TABLE workers
ADD COLUMN IF NOT EXISTS temp_phone VARCHAR(20);

-- 3. Agregar columna invitation_code
ALTER TABLE workers
ADD COLUMN IF NOT EXISTS invitation_code VARCHAR(10) UNIQUE;

-- 4. Agregar estado de registro
ALTER TABLE workers
ADD COLUMN IF NOT EXISTS registration_status VARCHAR(20) DEFAULT 'pending'
CHECK (registration_status IN ('pending', 'completed'));

-- 5. Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_workers_invitation_code 
ON workers(invitation_code) 
WHERE invitation_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workers_temp_phone 
ON workers(temp_phone) 
WHERE temp_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workers_registration_status 
ON workers(registration_status);

-- 6. Actualizar constraint UNIQUE
ALTER TABLE workers
DROP CONSTRAINT IF EXISTS workers_store_id_user_id_key;

-- Nueva constraint: unique por store + user_id (solo cuando user_id no es null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_workers_store_user_unique 
ON workers(store_id, user_id) 
WHERE user_id IS NOT NULL;

-- Unique por store + phone temporal (para evitar duplicados antes del registro)
CREATE UNIQUE INDEX IF NOT EXISTS idx_workers_store_phone_unique 
ON workers(store_id, temp_phone) 
WHERE temp_phone IS NOT NULL AND registration_status = 'pending';

-- 7. Actualizar workers existentes a 'completed'
UPDATE workers 
SET registration_status = 'completed' 
WHERE user_id IS NOT NULL;

-- ========================================
-- MIGRACIÓN 2: Agregar columna raw_data a notifications
-- ========================================
-- PROPÓSITO: Almacenar datos adicionales de notificaciones en formato JSON
--            Incluye flag 'simulated' para notificaciones de prueba

-- 1. Agregar columna raw_data
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}';

-- 2. Crear índice para búsquedas en JSONB
CREATE INDEX IF NOT EXISTS idx_notifications_raw_data_simulated 
ON notifications ((raw_data->>'simulated'));

-- 3. Agregar comentario
COMMENT ON COLUMN notifications.raw_data IS 
'Datos adicionales de la notificación en formato JSON. Incluye: simulated (bool), format (int), original_message (string), etc.';

-- ========================================
-- ✅ VERIFICACIÓN FINAL
-- ========================================

-- Verificar tabla workers
SELECT 
    'workers' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'workers'
AND column_name IN ('invitation_code', 'registration_status', 'temp_full_name', 'temp_phone')
ORDER BY column_name;

-- Verificar tabla notifications
SELECT 
    'notifications' as table_name,
    column_name, 
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'notifications' 
AND column_name = 'raw_data';

-- ========================================
-- ✅ MIGRACIONES COMPLETADAS
-- ========================================
