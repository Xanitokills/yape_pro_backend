-- Actualizar todos los usuarios existentes a Perú (PE)
-- Ejecutar este script en Supabase SQL Editor

-- Actualizar todos los usuarios sin país asignado a Perú
UPDATE users 
SET country = 'PE' 
WHERE country IS NULL;

-- Verificar actualización
SELECT 
  country,
  COUNT(*) as total_usuarios
FROM users
GROUP BY country
ORDER BY total_usuarios DESC;
