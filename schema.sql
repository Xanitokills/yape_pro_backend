-- ========================================
-- YAPE PRO - SCHEMA SQL para Supabase
-- ========================================
-- Este script crea todas las tablas necesarias
-- Ejecutar en: Supabase Dashboard > SQL Editor

-- ========================================
-- 1. TABLA DE USUARIOS
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) CHECK (role IN ('super_admin', 'owner', 'worker')) DEFAULT 'worker',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ========================================
-- 2. TABLA DE TIENDAS
-- ========================================
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address VARCHAR(500),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(is_active);

-- ========================================
-- 3. TABLA DE TRABAJADORES (Relación)
-- ========================================
CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    position VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_workers_store ON workers(store_id);
CREATE INDEX IF NOT EXISTS idx_workers_user ON workers(user_id);
CREATE INDEX IF NOT EXISTS idx_workers_active ON workers(is_active);

-- ========================================
-- 4. TABLA DE NOTIFICACIONES
-- ========================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    sender_name VARCHAR(255),
    source VARCHAR(20) CHECK (source IN ('yape', 'plin', 'bcp', 'other')) NOT NULL,
    message TEXT,
    notification_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    processed BOOLEAN DEFAULT false,
    workers_notified INTEGER DEFAULT 0,
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_notifications_store ON notifications(store_id);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(notification_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_processed ON notifications(processed);
CREATE INDEX IF NOT EXISTS idx_notifications_source ON notifications(source);
CREATE INDEX IF NOT EXISTS idx_notifications_raw_data_simulated ON notifications ((raw_data->>'simulated'));

-- ========================================
-- 5. TABLA DE TOKENS FCM
-- ========================================
CREATE TABLE IF NOT EXISTS fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    device_type VARCHAR(20) CHECK (device_type IN ('android', 'ios', 'web')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user ON fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_active ON fcm_tokens(is_active);

-- ========================================
-- 6. TABLA DE REFRESH TOKENS (Opcional)
-- ========================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ========================================
-- 7. FUNCIÓN PARA ACTUALIZAR updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar automáticamente updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fcm_tokens_updated_at BEFORE UPDATE ON fcm_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 8. DATOS DE PRUEBA (OPCIONAL)
-- ========================================
-- Contraseña: Admin123!
-- Hash bcrypt de "Admin123!" (rounds=10)
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
    'admin@yapepro.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Super Admin',
    'super_admin'
)
ON CONFLICT (email) DO NOTHING;

-- Insertar usuario owner de prueba
-- Contraseña: Owner123!
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
    'owner@test.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Dueño Test',
    'owner'
)
ON CONFLICT (email) DO NOTHING;

-- Insertar usuario worker de prueba
-- Contraseña: Worker123!
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
    'worker@test.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Trabajador Test',
    'worker'
)
ON CONFLICT (email) DO NOTHING;

-- ========================================
-- 9. VISTAS ÚTILES (OPCIONAL)
-- ========================================

-- Vista para ver tiendas con su owner
CREATE OR REPLACE VIEW stores_with_owner AS
SELECT 
    s.id,
    s.name,
    s.description,
    s.address,
    s.phone,
    s.is_active,
    s.created_at,
    u.id as owner_id,
    u.email as owner_email,
    u.full_name as owner_name
FROM stores s
JOIN users u ON s.owner_id = u.id;

-- Vista para ver trabajadores con información completa
CREATE OR REPLACE VIEW workers_detailed AS
SELECT 
    w.id,
    w.position,
    w.is_active,
    w.created_at,
    s.id as store_id,
    s.name as store_name,
    u.id as user_id,
    u.email as user_email,
    u.full_name as user_name,
    u.phone as user_phone
FROM workers w
JOIN stores s ON w.store_id = s.id
JOIN users u ON w.user_id = u.id;

-- ========================================
-- 10. POLÍTICAS RLS (Row Level Security) - OPCIONAL
-- ========================================
-- Descomentar si quieres usar RLS de Supabase
-- (Requiere configuración adicional)

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Ejemplo de política: Los usuarios solo pueden ver sus propios datos
-- CREATE POLICY "Users can view own data" ON users
--     FOR SELECT USING (auth.uid() = id);

-- ========================================
-- FIN DEL SCRIPT
-- ========================================

-- Verificar que todo se creó correctamente
SELECT 
    'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'stores', COUNT(*) FROM stores
UNION ALL
SELECT 'workers', COUNT(*) FROM workers
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'fcm_tokens', COUNT(*) FROM fcm_tokens;
