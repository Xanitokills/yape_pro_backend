-- ========================================
-- MIGRACIÓN: Sistema de Invitación de Trabajadores
-- ========================================
-- Fecha: 2024
-- Descripción: Modifica la tabla workers para soportar el sistema de códigos de invitación
--              Permite crear workers pendientes sin usuario hasta que se registren

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

-- 6. Comentarios en las columnas para documentación
COMMENT ON COLUMN workers.user_id IS 
'UUID del usuario asociado. Nullable para permitir trabajadores pendientes de registro';

COMMENT ON COLUMN workers.temp_full_name IS 
'Nombre temporal del trabajador antes de completar su registro';

COMMENT ON COLUMN workers.temp_phone IS 
'Teléfono temporal del trabajador antes de completar su registro';

COMMENT ON COLUMN workers.invitation_code IS 
'Código único de invitación generado por el sistema cuando el dueño crea un trabajador. Formato: YP-XXXXXX';

COMMENT ON COLUMN workers.registration_status IS 
'Estado del registro: pending (creado por owner, sin cuenta), completed (trabajador se registró)';

-- 7. Actualizar constraint UNIQUE para incluir workers sin user_id
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

-- 8. Actualizar workers existentes a 'completed'
UPDATE workers 
SET registration_status = 'completed' 
WHERE user_id IS NOT NULL;

-- Verificar la estructura actualizada
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'workers'
ORDER BY ordinal_position;

-- Contar registros por estado
SELECT 
    registration_status,
    COUNT(*) as count
FROM workers
GROUP BY registration_status;
