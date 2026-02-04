-- ========================================
-- MÓDULO DE CUPONES DE DESCUENTO
-- ========================================
-- Tabla para gestionar cupones de descuento

CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')) NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
    max_uses INTEGER NOT NULL DEFAULT 1 CHECK (max_uses > 0),
    used_count INTEGER DEFAULT 0 CHECK (used_count >= 0),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_dates_check CHECK (valid_until IS NULL OR valid_until > valid_from)
);

-- Tabla para registrar el uso de cupones
CREATE TABLE IF NOT EXISTS coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    original_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    final_amount DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_store ON coupons(store_id);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON coupons(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_store ON coupon_usage(store_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_notification ON coupon_usage(notification_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_date ON coupon_usage(used_at DESC);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para validar si un cupón está disponible
CREATE OR REPLACE FUNCTION is_coupon_valid(
    p_code VARCHAR,
    p_store_id UUID,
    p_amount DECIMAL
)
RETURNS TABLE(
    valid BOOLEAN,
    message TEXT,
    coupon_id UUID,
    discount_type VARCHAR,
    discount_value DECIMAL
) AS $$
DECLARE
    v_coupon coupons%ROWTYPE;
BEGIN
    -- Buscar cupón
    SELECT * INTO v_coupon
    FROM coupons
    WHERE code = p_code
    AND is_active = true;
    
    -- Verificar existencia
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Cupón no existe o está inactivo', NULL::UUID, NULL::VARCHAR, NULL::DECIMAL;
        RETURN;
    END IF;
    
    -- Verificar tienda (si el cupón es específico de tienda)
    IF v_coupon.store_id IS NOT NULL AND v_coupon.store_id != p_store_id THEN
        RETURN QUERY SELECT false, 'Cupón no válido para esta tienda', NULL::UUID, NULL::VARCHAR, NULL::DECIMAL;
        RETURN;
    END IF;
    
    -- Verificar fechas
    IF v_coupon.valid_from > NOW() THEN
        RETURN QUERY SELECT false, 'Cupón aún no está disponible', NULL::UUID, NULL::VARCHAR, NULL::DECIMAL;
        RETURN;
    END IF;
    
    IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
        RETURN QUERY SELECT false, 'Cupón expirado', NULL::UUID, NULL::VARCHAR, NULL::DECIMAL;
        RETURN;
    END IF;
    
    -- Verificar usos
    IF v_coupon.used_count >= v_coupon.max_uses THEN
        RETURN QUERY SELECT false, 'Cupón agotado', NULL::UUID, NULL::VARCHAR, NULL::DECIMAL;
        RETURN;
    END IF;
    
    -- Verificar monto mínimo
    IF p_amount < v_coupon.min_purchase_amount THEN
        RETURN QUERY SELECT 
            false, 
            'Monto mínimo de compra: ' || v_coupon.min_purchase_amount::TEXT, 
            NULL::UUID, 
            NULL::VARCHAR, 
            NULL::DECIMAL;
        RETURN;
    END IF;
    
    -- Cupón válido
    RETURN QUERY SELECT 
        true, 
        'Cupón válido'::TEXT, 
        v_coupon.id, 
        v_coupon.discount_type, 
        v_coupon.discount_value;
END;
$$ LANGUAGE plpgsql;

-- Vista para estadísticas de cupones
CREATE OR REPLACE VIEW coupon_stats AS
SELECT 
    c.id,
    c.code,
    c.description,
    c.discount_type,
    c.discount_value,
    c.max_uses,
    c.used_count,
    c.is_active,
    c.valid_from,
    c.valid_until,
    s.name as store_name,
    s.id as store_id,
    u.full_name as created_by_name,
    COUNT(cu.id) as total_uses,
    COALESCE(SUM(cu.discount_amount), 0) as total_discount_given,
    COALESCE(SUM(cu.final_amount), 0) as total_revenue_with_discount
FROM coupons c
LEFT JOIN stores s ON c.store_id = s.id
LEFT JOIN users u ON c.created_by = u.id
LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
GROUP BY c.id, c.code, c.description, c.discount_type, c.discount_value, 
         c.max_uses, c.used_count, c.is_active, c.valid_from, c.valid_until,
         s.name, s.id, u.full_name;

-- ========================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ========================================

-- Cupón de bienvenida (20% descuento, 100 usos)
INSERT INTO coupons (code, description, discount_type, discount_value, max_uses, min_purchase_amount, valid_until)
VALUES (
    'BIENVENIDA20',
    'Cupón de bienvenida - 20% de descuento',
    'percentage',
    20.00,
    100,
    50.00,
    NOW() + INTERVAL '90 days'
)
ON CONFLICT (code) DO NOTHING;

-- Cupón de descuento fijo (S/10 de descuento, 50 usos)
INSERT INTO coupons (code, description, discount_type, discount_value, max_uses, min_purchase_amount, valid_until)
VALUES (
    'AHORRA10',
    'Descuento fijo de S/10',
    'fixed',
    10.00,
    50,
    100.00,
    NOW() + INTERVAL '60 days'
)
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- FIN DEL SCRIPT
-- ========================================
