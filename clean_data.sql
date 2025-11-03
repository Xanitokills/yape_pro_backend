-- ========================================
-- SCRIPT PARA LIMPIAR DATOS DE PRUEBA
-- ========================================
-- Este script limpia todos los datos excepto los usuarios de prueba
-- para simular un caso real donde el owner debe configurar todo desde cero

-- ========================================
-- 1. ELIMINAR DATOS DE NOTIFICACIONES
-- ========================================
DELETE FROM notifications;

-- ========================================
-- 2. ELIMINAR TOKENS FCM
-- ========================================
DELETE FROM fcm_tokens;

-- ========================================
-- 3. ELIMINAR REFRESH TOKENS
-- ========================================
DELETE FROM refresh_tokens;

-- ========================================
-- 4. ELIMINAR TRABAJADORES
-- ========================================
DELETE FROM workers;

-- ========================================
-- 5. ELIMINAR TIENDAS
-- ========================================
DELETE FROM stores;

-- ========================================
-- NOTA: Los usuarios (admin, owner, worker) NO se eliminan
-- Esto permite hacer login pero sin ninguna configuración
-- ========================================

-- Verificar que todo se limpió correctamente
SELECT 
    'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'stores', COUNT(*) FROM stores
UNION ALL
SELECT 'workers', COUNT(*) FROM workers
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'fcm_tokens', COUNT(*) FROM fcm_tokens
UNION ALL
SELECT 'refresh_tokens', COUNT(*) FROM refresh_tokens;

-- Resultado esperado:
-- users: 3 (admin, owner, worker)
-- stores: 0
-- workers: 0
-- notifications: 0
-- fcm_tokens: 0
-- refresh_tokens: 0
