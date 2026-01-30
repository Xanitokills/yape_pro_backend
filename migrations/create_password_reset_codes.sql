-- Tabla para almacenar códigos de recuperación de contraseña
CREATE TABLE IF NOT EXISTS password_reset_codes (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices para mejorar el rendimiento
    CONSTRAINT unique_active_code UNIQUE (user_id, code)
);

-- Índice para búsquedas rápidas por email y código
CREATE INDEX idx_password_reset_email_code ON password_reset_codes(email, code) WHERE used = FALSE;

-- Índice para limpiar códigos expirados
CREATE INDEX idx_password_reset_expires ON password_reset_codes(expires_at);

-- Comentarios
COMMENT ON TABLE password_reset_codes IS 'Códigos de verificación para recuperación de contraseña';
COMMENT ON COLUMN password_reset_codes.code IS 'Código de 6 dígitos enviado al email del usuario';
COMMENT ON COLUMN password_reset_codes.expires_at IS 'Fecha de expiración del código (15 minutos desde su creación)';
COMMENT ON COLUMN password_reset_codes.used IS 'Indica si el código ya fue utilizado';
