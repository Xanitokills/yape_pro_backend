-- ========================================
-- MIGRACIÓN: Sistema de Patrones de Notificación Parametrizables
-- ========================================
-- Este sistema permite configurar dinámicamente los patrones de parsing
-- de notificaciones por país y tipo de billetera desde el panel admin

-- ========================================
-- 1. TABLA DE PATRONES DE NOTIFICACIÓN
-- ========================================
CREATE TABLE IF NOT EXISTS notification_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificación
    country VARCHAR(3) NOT NULL CHECK (country IN ('PE', 'BO', 'ALL')), -- País: PE=Perú, BO=Bolivia, ALL=Todos
    wallet_type VARCHAR(20) NOT NULL CHECK (wallet_type IN ('yape', 'plin', 'bcp', 'other')), -- Tipo de billetera
    
    -- Patrón de regex
    pattern TEXT NOT NULL, -- Expresión regular para extraer datos
    amount_group INTEGER NOT NULL DEFAULT 1, -- Índice del grupo de captura del monto en la regex (1-based)
    sender_group INTEGER NOT NULL DEFAULT 2, -- Índice del grupo de captura del remitente en la regex (1-based)
    
    -- Metadatos
    name VARCHAR(255) NOT NULL, -- Nombre descriptivo del patrón (ej: "Yape Bolivia - QR")
    description TEXT, -- Descripción detallada del formato
    example TEXT, -- Ejemplo de notificación que coincide con este patrón
    priority INTEGER DEFAULT 100, -- Prioridad de evaluación (menor = mayor prioridad)
    
    -- Control
    is_active BOOLEAN DEFAULT true, -- Si el patrón está activo
    
    -- Configuración adicional
    currency VARCHAR(10) DEFAULT 'PEN', -- Moneda por defecto (PEN, BOB, etc.)
    regex_flags VARCHAR(20) DEFAULT 'i', -- Flags de regex (i=ignore case, m=multiline, etc.)
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id), -- Super admin que lo creó
    updated_by UUID REFERENCES users(id) -- Super admin que lo modificó
);

-- Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_notification_patterns_country ON notification_patterns(country);
CREATE INDEX IF NOT EXISTS idx_notification_patterns_wallet ON notification_patterns(wallet_type);
CREATE INDEX IF NOT EXISTS idx_notification_patterns_active ON notification_patterns(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_patterns_priority ON notification_patterns(priority);
CREATE INDEX IF NOT EXISTS idx_notification_patterns_country_wallet ON notification_patterns(country, wallet_type, is_active);

-- Trigger para actualizar automáticamente updated_at
CREATE TRIGGER update_notification_patterns_updated_at BEFORE UPDATE ON notification_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 2. TABLA DE LOG DE PARSING (Opcional - para debugging)
-- ========================================
CREATE TABLE IF NOT EXISTS notification_parsing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Datos de entrada
    notification_text TEXT NOT NULL,
    country VARCHAR(3),
    
    -- Resultado
    pattern_id UUID REFERENCES notification_patterns(id),
    success BOOLEAN DEFAULT false,
    extracted_amount DECIMAL(10, 2),
    extracted_sender VARCHAR(255),
    extracted_source VARCHAR(20),
    
    -- Información adicional
    processing_time_ms INTEGER, -- Tiempo de procesamiento en milisegundos
    error_message TEXT, -- Mensaje de error si falló
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para análisis
CREATE INDEX IF NOT EXISTS idx_parsing_logs_created ON notification_parsing_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parsing_logs_success ON notification_parsing_logs(success);
CREATE INDEX IF NOT EXISTS idx_parsing_logs_pattern ON notification_parsing_logs(pattern_id);

-- Función para limpiar logs antiguos (mantener solo últimos 30 días)
CREATE OR REPLACE FUNCTION cleanup_old_parsing_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM notification_parsing_logs
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 3. VISTA PARA ADMINISTRACIÓN
-- ========================================
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
-- COMENTARIOS SOBRE EL SISTEMA
-- ========================================

COMMENT ON TABLE notification_patterns IS 'Patrones configurables para parsing de notificaciones de billeteras digitales';
COMMENT ON COLUMN notification_patterns.pattern IS 'Expresión regular JavaScript para extraer datos. Debe tener grupos de captura para monto y remitente';
COMMENT ON COLUMN notification_patterns.amount_group IS 'Índice del grupo de captura en la regex que contiene el monto (1-based)';
COMMENT ON COLUMN notification_patterns.sender_group IS 'Índice del grupo de captura en la regex que contiene el nombre del remitente (1-based)';
COMMENT ON COLUMN notification_patterns.priority IS 'Orden de evaluación: menor valor = mayor prioridad. Útil cuando múltiples patrones podrían coincidir';
COMMENT ON COLUMN notification_patterns.example IS 'Ejemplo de notificación real que debería coincidir con este patrón';

-- ========================================
-- FIN DE LA MIGRACIÓN
-- ========================================
