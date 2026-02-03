-- ========================================
-- MIGRACIÓN: Flexibilizar Países y Billeteras (CORREGIDA)
-- ========================================

-- 1. Eliminar dependencias (Vistas)
-- PostgreSQL no permite alterar columnas usadas en vistas sin borrar la vista primero.
DROP VIEW IF EXISTS notification_patterns_detailed;

-- 2. Eliminar las restricciones CHECK para permitir nuevos países y billeteras dinámicamente
ALTER TABLE notification_patterns DROP CONSTRAINT IF EXISTS notification_patterns_country_check;
ALTER TABLE notification_patterns DROP CONSTRAINT IF EXISTS notification_patterns_wallet_type_check;

-- 3. Ampliar columnas (Ahora que no hay vista bloqueando)
ALTER TABLE notification_patterns ALTER COLUMN country TYPE VARCHAR(10);
ALTER TABLE notification_patterns ALTER COLUMN wallet_type TYPE VARCHAR(50);

-- 4. Recrear la vista eliminada
CREATE OR REPLACE VIEW notification_patterns_detailed AS
SELECT 
    np.*,
    uc.full_name as created_by_name,
    uu.full_name as updated_by_name,
    COUNT(npl.id) as usage_count
FROM notification_patterns np
LEFT JOIN users uc ON np.created_by = uc.id
LEFT JOIN users uu ON np.updated_by = uu.id
LEFT JOIN notification_parsing_logs npl ON npl.pattern_id = np.id 
    AND npl.created_at > NOW() - INTERVAL '30 days'
GROUP BY np.id, uc.full_name, uu.full_name
ORDER BY np.priority ASC, np.created_at DESC;

-- ========================================
-- Actualización de comentarios
-- ========================================
COMMENT ON COLUMN notification_patterns.country IS 'Código de país (ej: PE, BO, COL, MX) o ALL';
COMMENT ON COLUMN notification_patterns.wallet_type IS 'Identificador de la billetera (ej: yape, plin, nequi, daviplata)';
