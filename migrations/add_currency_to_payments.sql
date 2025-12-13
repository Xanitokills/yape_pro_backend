-- Agregar columnas faltantes a la tabla payments para upgrade
-- Ejecutar en Supabase SQL Editor

-- PASO 1: Hacer nullable las columnas que no siempre se usan
-- (Para pagos de upgrade con usuario autenticado, estas columnas van en metadata o user_id)
ALTER TABLE payments 
ALTER COLUMN reference DROP NOT NULL;

ALTER TABLE payments 
ALTER COLUMN user_email DROP NOT NULL;

ALTER TABLE payments 
ALTER COLUMN user_phone DROP NOT NULL;

ALTER TABLE payments 
ALTER COLUMN user_name DROP NOT NULL;

-- PASO 2: Agregar nuevas columnas

-- Agregar columna currency
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'PEN';

-- Agregar columna metadata (JSON para información adicional)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Agregar columna order_id (referencia única del pedido)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS order_id VARCHAR(100);

-- Agregar columna user_id (relación con usuario autenticado)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- PASO 3: Actualizar registros existentes
UPDATE payments 
SET currency = 'PEN' 
WHERE currency IS NULL;

UPDATE payments 
SET metadata = '{}'::jsonb 
WHERE metadata IS NULL;

-- PASO 4: Crear índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_payments_currency ON payments(currency);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_metadata ON payments USING gin(metadata);

-- PASO 5: Comentarios sobre las columnas
COMMENT ON COLUMN payments.currency IS 'Moneda del pago (PEN, USD, etc.)';
COMMENT ON COLUMN payments.metadata IS 'Información adicional del pago en formato JSON';
COMMENT ON COLUMN payments.order_id IS 'Referencia única del pedido de pago';
COMMENT ON COLUMN payments.user_id IS 'ID del usuario autenticado que realiza el pago';

-- Actualizar registros existentes
UPDATE payments 
SET currency = 'PEN' 
WHERE currency IS NULL;

UPDATE payments 
SET metadata = '{}'::jsonb 
WHERE metadata IS NULL;

-- Crear índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_payments_currency ON payments(currency);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_metadata ON payments USING gin(metadata);

-- Comentarios sobre las columnas
COMMENT ON COLUMN payments.currency IS 'Moneda del pago (PEN, USD, etc.)';
COMMENT ON COLUMN payments.metadata IS 'Información adicional del pago en formato JSON';
COMMENT ON COLUMN payments.order_id IS 'Referencia única del pedido de pago';
COMMENT ON COLUMN payments.user_id IS 'ID del usuario autenticado que realiza el pago';
