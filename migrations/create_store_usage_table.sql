-- =====================================================
-- CREAR TABLA store_usage PARA BONIFICACIONES DE CUPONES
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Crear la tabla store_usage
CREATE TABLE IF NOT EXISTS store_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    usage_month VARCHAR(7) NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY-MM'),
    transactions_count INTEGER DEFAULT 0,
    transaction_bonus INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, usage_month)
);

-- 2. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_store_usage_store_id ON store_usage(store_id);
CREATE INDEX IF NOT EXISTS idx_store_usage_month ON store_usage(usage_month);

-- 3. Habilitar RLS
ALTER TABLE store_usage ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de seguridad
CREATE POLICY "Users can view their store usage" ON store_usage
    FOR SELECT USING (
        store_id IN (
            SELECT id FROM stores WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "System can manage store usage" ON store_usage
    FOR ALL USING (true);

-- 5. Insertar el bonus para tu tienda de prueba
INSERT INTO store_usage (store_id, transaction_bonus, transactions_count, usage_month)
VALUES ('7ab06377-80d1-4571-b563-e4939613545c', 50, 3, '2026-02')
ON CONFLICT (store_id, usage_month) 
DO UPDATE SET transaction_bonus = 50;

-- 6. Verificar
SELECT * FROM store_usage;
