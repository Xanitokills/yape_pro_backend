-- ============================================
-- CONFIGURACIÓN DE SUPER ADMIN
-- ============================================

-- 1. Actualizar el rol del usuario Super Admin
UPDATE users 
SET role = 'super_admin'
WHERE email = 'saavedracastrosandro@gmail.com';

-- 2. Verificar que el usuario tenga un plan activo (opcional, asignar enterprise)
UPDATE users 
SET 
  subscription_plan_id = 'enterprise',
  subscription_status = 'active',
  subscription_started_at = NOW()
WHERE email = 'saavedracastrosandro@gmail.com'
AND subscription_plan_id IS NULL;

-- 3. Crear función para obtener usuarios cerca del límite (usada en estadísticas)
CREATE OR REPLACE FUNCTION get_users_near_limit(threshold DECIMAL DEFAULT 0.8)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  plan_name TEXT,
  usage_percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id AS user_id,
    u.email,
    u.full_name,
    sp.name AS plan_name,
    CASE 
      WHEN sp.max_transactions_monthly IS NULL THEN 0
      ELSE CAST(ut.transactions_count AS DECIMAL) / sp.max_transactions_monthly
    END AS usage_percentage
  FROM users u
  LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
  LEFT JOIN usage_tracking ut ON u.id = ut.user_id 
    AND ut.year = EXTRACT(YEAR FROM NOW())
    AND ut.month = EXTRACT(MONTH FROM NOW())
  WHERE sp.max_transactions_monthly IS NOT NULL
    AND CAST(ut.transactions_count AS DECIMAL) / sp.max_transactions_monthly >= threshold
  ORDER BY usage_percentage DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. Verificar que la función authorizeRoles en el middleware acepte 'super_admin'
-- Esta verificación es informativa, el cambio real se hace en el código

-- 5. Mostrar información del Super Admin
SELECT 
  id,
  email,
  full_name,
  role,
  subscription_plan_id,
  subscription_status,
  created_at
FROM users
WHERE email = 'saavedracastrosandro@gmail.com';

-- ============================================
-- SCRIPT COMPLETADO
-- ============================================
-- El usuario saavedracastrosandro@gmail.com ahora tiene rol 'super_admin'
-- Puede acceder a las rutas /api/admin/ en el backend
-- Puede acceder a /admin en el Front (Next.js)
-- 
-- IMPORTANTE: Reiniciar el backend después de ejecutar este script
