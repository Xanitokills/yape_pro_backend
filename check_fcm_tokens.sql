-- Verificar tokens FCM registrados para el owner
SELECT 
  ft.id,
  ft.user_id,
  u.email,
  u.role,
  ft.fcm_token,
  ft.device_type,
  ft.created_at,
  ft.updated_at
FROM fcm_tokens ft
JOIN users u ON ft.user_id = u.id
WHERE u.email = 'owner@test.com'
ORDER BY ft.created_at DESC;

-- Ver todos los tokens FCM
SELECT 
  ft.id,
  u.email,
  u.role,
  ft.device_type,
  ft.created_at
FROM fcm_tokens ft
JOIN users u ON ft.user_id = u.id
ORDER BY ft.created_at DESC;

-- Ver si hay usuarios sin tokens FCM
SELECT 
  u.id,
  u.email,
  u.role,
  COUNT(ft.id) as token_count
FROM users u
LEFT JOIN fcm_tokens ft ON u.id = ft.user_id
GROUP BY u.id, u.email, u.role
ORDER BY token_count ASC, u.email;
