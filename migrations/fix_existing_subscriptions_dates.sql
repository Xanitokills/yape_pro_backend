-- ========================================
-- ACTUALIZAR FECHAS DE SUSCRIPCIÓN PARA USUARIOS EXISTENTES
-- ========================================
-- Ejecutar en Supabase Dashboard > SQL Editor
-- Esto actualiza usuarios que ya tienen plan de pago pero sin fechas

-- Actualizar usuarios con plan profesional/enterprise sin fecha de expiración
UPDATE users
SET 
    subscription_started_at = COALESCE(subscription_started_at, updated_at, created_at),
    subscription_expires_at = COALESCE(
        subscription_expires_at, 
        (COALESCE(subscription_started_at, updated_at, created_at) + INTERVAL '30 days')
    )
WHERE 
    subscription_plan_id IN ('professional', 'enterprise')
    AND subscription_status = 'active'
    AND subscription_expires_at IS NULL;

-- Verificar los cambios
SELECT 
    id,
    email,
    full_name,
    subscription_plan_id,
    subscription_status,
    subscription_started_at,
    subscription_expires_at
FROM users
WHERE subscription_plan_id IN ('professional', 'enterprise');
