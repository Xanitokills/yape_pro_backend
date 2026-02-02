-- Migración: Tabla para códigos de verificación de email
-- Ejecutar en Supabase SQL Editor

-- Crear tabla para almacenar códigos de verificación de email
CREATE TABLE IF NOT EXISTS email_verification_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas rápidas por email
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON email_verification_codes(email);

-- Índice para limpiar códigos expirados
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires ON email_verification_codes(expires_at);

-- Habilitar RLS
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Política: Solo el backend (service role) puede acceder
CREATE POLICY "Service role full access" ON email_verification_codes
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Función para limpiar códigos expirados (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_email_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM email_verification_codes 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Comentarios
COMMENT ON TABLE email_verification_codes IS 'Almacena códigos de verificación de email temporales para registro';
COMMENT ON COLUMN email_verification_codes.email IS 'Email a verificar';
COMMENT ON COLUMN email_verification_codes.code IS 'Código de 6 dígitos';
COMMENT ON COLUMN email_verification_codes.expires_at IS 'Fecha de expiración del código';
COMMENT ON COLUMN email_verification_codes.verified IS 'Si el código fue verificado correctamente';
