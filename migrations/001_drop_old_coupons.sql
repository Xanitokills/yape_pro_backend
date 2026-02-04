-- PASO 1: ELIMINAR TABLAS ANTIGUAS
-- Ejecuta esto primero en Supabase SQL Editor

DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP VIEW IF EXISTS coupon_stats CASCADE;
DROP FUNCTION IF EXISTS is_coupon_valid CASCADE;

-- PASO 2: Ahora ejecuta el contenido completo del archivo 003_coupons_improved.sql
