-- ========================================
-- VERIFICACIÓN DE TELÉFONO CON OTP
-- ========================================
-- Ejecutar en: Supabase Dashboard > SQL Editor

-- Tabla para códigos de verificación
CREATE TABLE IF NOT EXISTS phone_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    attempts INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires ON phone_verifications(expires_at);

-- Crear índice único para teléfono en users (evita duplicados)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique 
ON users(phone) 
WHERE phone IS NOT NULL AND phone != '';

-- Función para limpiar verificaciones expiradas (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS void AS $$
BEGIN
    DELETE FROM phone_verifications 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Política RLS (Row Level Security) - opcional
-- ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;
