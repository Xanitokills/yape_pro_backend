-- Agregar campo para verificación de teléfono
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Los usuarios existentes con phone pero sin verificar quedan como false
-- Los nuevos usuarios tendrán false por defecto

-- Índice para búsquedas rápidas de usuarios verificados
CREATE INDEX IF NOT EXISTS idx_users_phone_verified ON users(phone_verified);

COMMENT ON COLUMN users.phone_verified IS 'Indica si el número de teléfono ha sido verificado vía SMS';
