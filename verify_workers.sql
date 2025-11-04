-- Verificar trabajadores de la tienda "Xanito Store"
SELECT 
  w.id,
  w.store_id,
  w.user_id,
  u.email,
  u.name,
  u.phone,
  w.is_active,
  w.created_at
FROM workers w
JOIN users u ON w.user_id = u.id
WHERE w.store_id = 'bb323d85-679e-4cc1-9a62-211a460be28d'
ORDER BY w.created_at DESC;

-- Ver todos los usuarios y sus roles
SELECT 
  id,
  email,
  name,
  role,
  phone,
  created_at
FROM users
ORDER BY created_at DESC;

-- Ver todas las relaciones de trabajadores con tiendas
SELECT 
  w.id as worker_relation_id,
  s.name as store_name,
  u.email as worker_email,
  u.role as worker_role,
  w.is_active
FROM workers w
JOIN stores s ON w.store_id = s.id
JOIN users u ON w.user_id = u.id
ORDER BY s.name, u.email;
