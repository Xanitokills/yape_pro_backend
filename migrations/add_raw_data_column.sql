-- ========================================
-- MIGRACIÓN: Agregar columna raw_data a notifications
-- ========================================
-- Fecha: 2025-11-03
-- Propósito: Almacenar datos adicionales en formato JSONB
--            Incluye flag 'simulated' para notificaciones de prueba

-- Agregar columna raw_data como JSONB
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}';

-- Crear índice para búsquedas en JSONB
CREATE INDEX IF NOT EXISTS idx_notifications_raw_data_simulated 
ON notifications ((raw_data->>'simulated'));

-- Agregar comentario a la columna
COMMENT ON COLUMN notifications.raw_data IS 
'Datos adicionales de la notificación en formato JSON. Incluye: simulated (bool), format (int), original_message (string), etc.';

-- Verificar que la columna se agregó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'notifications' 
AND column_name = 'raw_data';
