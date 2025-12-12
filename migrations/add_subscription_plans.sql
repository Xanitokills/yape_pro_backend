-- ========================================
-- SISTEMA DE PLANES DE SUSCRIPCIÓN
-- ========================================
-- Este script agrega el sistema de planes y límites

-- ========================================
-- 1. TABLA DE PLANES
-- ========================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- Límites del plan (NULL = ilimitado)
    max_stores INTEGER,
    max_employees INTEGER,
    max_transactions_monthly INTEGER, -- NULL = ilimitado
    
    -- Características
    has_advanced_reports BOOLEAN DEFAULT false,
    has_priority_support BOOLEAN DEFAULT false,
    has_api_access BOOLEAN DEFAULT false,
    has_account_manager BOOLEAN DEFAULT false,
    has_white_label BOOLEAN DEFAULT false,
    has_sla BOOLEAN DEFAULT false,
    
    -- Metadata
    display_order INTEGER DEFAULT 0,
    badge VARCHAR(50), -- 'Popular', 'Premium', etc.
    color VARCHAR(20),
    icon VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar los planes predefinidos
INSERT INTO subscription_plans (
    id, name, description, price_monthly, 
    max_stores, max_employees, max_transactions_monthly,
    has_advanced_reports, has_priority_support, has_api_access,
    has_account_manager, has_white_label, has_sla,
    display_order, badge, color, icon
) VALUES 
(
    'free',
    'Gratis',
    'Perfecto para empezar',
    0.00,
    1,
    1,
    30,
    false, false, false, false, false, false,
    1, NULL, '#64748B', 'bolt'
),
(
    'professional',
    'Profesional',
    'Para negocios en crecimiento',
    30.00,
    3,
    10,
    NULL, -- ilimitado
    true, true, true, false, false, false,
    2, 'Popular', '#5B16D0', 'star'
),
(
    'enterprise',
    'Empresarial',
    'Para grandes empresas',
    200.00,
    NULL, -- ilimitado
    NULL, -- ilimitado
    NULL, -- ilimitado
    true, true, true, true, true, true,
    3, 'Premium', '#EA580C', 'workspace_premium'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    max_stores = EXCLUDED.max_stores,
    max_employees = EXCLUDED.max_employees,
    max_transactions_monthly = EXCLUDED.max_transactions_monthly,
    has_advanced_reports = EXCLUDED.has_advanced_reports,
    has_priority_support = EXCLUDED.has_priority_support,
    has_api_access = EXCLUDED.has_api_access,
    has_account_manager = EXCLUDED.has_account_manager,
    has_white_label = EXCLUDED.has_white_label,
    has_sla = EXCLUDED.has_sla,
    display_order = EXCLUDED.display_order,
    badge = EXCLUDED.badge,
    color = EXCLUDED.color,
    icon = EXCLUDED.icon,
    updated_at = NOW();

-- ========================================
-- 2. AGREGAR CAMPOS DE SUSCRIPCIÓN A USERS
-- ========================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_plan_id VARCHAR(50) DEFAULT 'free' REFERENCES subscription_plans(id),
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'trial'));

-- Índice para búsquedas por plan
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON users(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Actualizar usuarios existentes al plan gratuito
UPDATE users 
SET subscription_plan_id = 'free',
    subscription_status = 'active'
WHERE subscription_plan_id IS NULL;

-- ========================================
-- 3. TABLA DE USO/CONTADORES MENSUALES
-- ========================================
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    
    -- Contadores
    transactions_count INTEGER DEFAULT 0,
    stores_count INTEGER DEFAULT 0,
    employees_count INTEGER DEFAULT 0,
    
    -- Metadata
    last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, year, month)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON usage_tracking(year, month);

-- ========================================
-- 4. TABLA DE HISTORIAL DE SUSCRIPCIONES
-- ========================================
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL REFERENCES subscription_plans(id),
    action VARCHAR(20) CHECK (action IN ('upgrade', 'downgrade', 'renew', 'cancel', 'expire')) NOT NULL,
    previous_plan_id VARCHAR(50) REFERENCES subscription_plans(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscription_history_user ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created ON subscription_history(created_at DESC);

-- ========================================
-- 5. FUNCIÓN PARA VERIFICAR LÍMITES
-- ========================================
CREATE OR REPLACE FUNCTION check_plan_limit(
    p_user_id UUID,
    p_limit_type VARCHAR,
    p_current_count INTEGER DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_plan_id VARCHAR(50);
    v_limit INTEGER;
    v_current INTEGER;
    v_usage usage_tracking%ROWTYPE;
    v_year INTEGER := EXTRACT(YEAR FROM NOW());
    v_month INTEGER := EXTRACT(MONTH FROM NOW());
BEGIN
    -- Obtener el plan del usuario
    SELECT subscription_plan_id INTO v_plan_id
    FROM users
    WHERE id = p_user_id;
    
    -- Obtener el límite según el tipo
    IF p_limit_type = 'stores' THEN
        SELECT max_stores INTO v_limit FROM subscription_plans WHERE id = v_plan_id;
        SELECT stores_count INTO v_current FROM usage_tracking WHERE user_id = p_user_id AND year = v_year AND month = v_month;
        v_current := COALESCE(v_current, 0);
    ELSIF p_limit_type = 'employees' THEN
        SELECT max_employees INTO v_limit FROM subscription_plans WHERE id = v_plan_id;
        SELECT employees_count INTO v_current FROM usage_tracking WHERE user_id = p_user_id AND year = v_year AND month = v_month;
        v_current := COALESCE(v_current, 0);
    ELSIF p_limit_type = 'transactions' THEN
        SELECT max_transactions_monthly INTO v_limit FROM subscription_plans WHERE id = v_plan_id;
        SELECT transactions_count INTO v_current FROM usage_tracking WHERE user_id = p_user_id AND year = v_year AND month = v_month;
        v_current := COALESCE(v_current, 0);
    END IF;
    
    -- Si se pasa current_count, usarlo en lugar del almacenado
    IF p_current_count IS NOT NULL THEN
        v_current := p_current_count;
    END IF;
    
    -- NULL significa ilimitado
    IF v_limit IS NULL THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'limit', 'unlimited',
            'current', v_current,
            'remaining', 'unlimited'
        );
    END IF;
    
    -- Verificar si está dentro del límite
    RETURN jsonb_build_object(
        'allowed', v_current < v_limit,
        'limit', v_limit,
        'current', v_current,
        'remaining', GREATEST(0, v_limit - v_current)
    );
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 6. FUNCIÓN PARA INCREMENTAR CONTADOR
-- ========================================
CREATE OR REPLACE FUNCTION increment_usage(
    p_user_id UUID,
    p_counter_type VARCHAR,
    p_increment INTEGER DEFAULT 1
)
RETURNS void AS $$
DECLARE
    v_year INTEGER := EXTRACT(YEAR FROM NOW());
    v_month INTEGER := EXTRACT(MONTH FROM NOW());
BEGIN
    -- Crear registro si no existe
    INSERT INTO usage_tracking (user_id, year, month)
    VALUES (p_user_id, v_year, v_month)
    ON CONFLICT (user_id, year, month) DO NOTHING;
    
    -- Incrementar el contador correspondiente
    IF p_counter_type = 'transactions' THEN
        UPDATE usage_tracking
        SET transactions_count = transactions_count + p_increment,
            updated_at = NOW()
        WHERE user_id = p_user_id AND year = v_year AND month = v_month;
    ELSIF p_counter_type = 'stores' THEN
        UPDATE usage_tracking
        SET stores_count = stores_count + p_increment,
            updated_at = NOW()
        WHERE user_id = p_user_id AND year = v_year AND month = v_month;
    ELSIF p_counter_type = 'employees' THEN
        UPDATE usage_tracking
        SET employees_count = employees_count + p_increment,
            updated_at = NOW()
        WHERE user_id = p_user_id AND year = v_year AND month = v_month;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. FUNCIÓN PARA RESETEAR CONTADORES MENSUALES
-- ========================================
CREATE OR REPLACE FUNCTION reset_monthly_counters()
RETURNS void AS $$
BEGIN
    -- Esta función debe ejecutarse el día 1 de cada mes
    -- mediante un cron job o manualmente
    UPDATE usage_tracking
    SET transactions_count = 0,
        last_reset_at = NOW(),
        updated_at = NOW()
    WHERE year = EXTRACT(YEAR FROM NOW() - INTERVAL '1 month')
      AND month = EXTRACT(MONTH FROM NOW() - INTERVAL '1 month');
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 8. TRIGGER PARA ACTUALIZAR updated_at
-- ========================================
CREATE TRIGGER update_subscription_plans_updated_at 
BEFORE UPDATE ON subscription_plans
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at 
BEFORE UPDATE ON usage_tracking
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 9. VISTA PARA INFORMACIÓN COMPLETA DE SUSCRIPCIÓN
-- ========================================
CREATE OR REPLACE VIEW user_subscription_info AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    u.subscription_plan_id,
    u.subscription_status,
    u.subscription_started_at,
    u.subscription_expires_at,
    sp.name as plan_name,
    sp.price_monthly,
    sp.max_stores,
    sp.max_employees,
    sp.max_transactions_monthly,
    sp.has_advanced_reports,
    sp.has_priority_support,
    sp.has_api_access,
    sp.badge,
    sp.color,
    sp.icon,
    ut.transactions_count,
    ut.stores_count,
    ut.employees_count,
    ut.year as usage_year,
    ut.month as usage_month
FROM users u
LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
LEFT JOIN usage_tracking ut ON u.id = ut.user_id 
    AND ut.year = EXTRACT(YEAR FROM NOW())
    AND ut.month = EXTRACT(MONTH FROM NOW());

-- ========================================
-- VERIFICACIÓN
-- ========================================
SELECT 'Planes creados:', COUNT(*) FROM subscription_plans;
SELECT 'Usuarios con plan:', COUNT(*) FROM users WHERE subscription_plan_id IS NOT NULL;
