-- IMPORTANTE: Este archivo debe ejecutarse en Supabase SQL Editor
-- Primero ejecuta esto para eliminar las tablas si ya existen (CUIDADO: perderás datos)

DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;

-- Ahora ejecuta el contenido completo de 002_create_coupons.sql
