-- Actualizar país del trabajador de Bolivia basado en su número de teléfono
-- El número +59162449491 corresponde a Bolivia (código +591)

UPDATE users
SET country = 'BO'
WHERE phone LIKE '%59162449491%'
   OR phone LIKE '%62449491%';

-- Actualizar otros usuarios de Bolivia que puedan existir
UPDATE users
SET country = 'BO'
WHERE country IS NULL
  AND (phone LIKE '591%' OR phone LIKE '+591%');

-- Actualizar usuarios de otros países basados en código telefónico
UPDATE users
SET country = CASE
  WHEN phone ~ '^(\+)?54[0-9]' THEN 'AR'      -- Argentina
  WHEN phone ~ '^(\+)?591[0-9]' THEN 'BO'     -- Bolivia
  WHEN phone ~ '^(\+)?55[0-9]' THEN 'BR'      -- Brasil
  WHEN phone ~ '^(\+)?56[0-9]' THEN 'CL'      -- Chile
  WHEN phone ~ '^(\+)?57[0-9]' THEN 'CO'      -- Colombia
  WHEN phone ~ '^(\+)?506[0-9]' THEN 'CR'     -- Costa Rica
  WHEN phone ~ '^(\+)?53[0-9]' THEN 'CU'      -- Cuba
  WHEN phone ~ '^(\+)?593[0-9]' THEN 'EC'     -- Ecuador
  WHEN phone ~ '^(\+)?503[0-9]' THEN 'SV'     -- El Salvador
  WHEN phone ~ '^(\+)?502[0-9]' THEN 'GT'     -- Guatemala
  WHEN phone ~ '^(\+)?504[0-9]' THEN 'HN'     -- Honduras
  WHEN phone ~ '^(\+)?52[0-9]' THEN 'MX'      -- México
  WHEN phone ~ '^(\+)?505[0-9]' THEN 'NI'     -- Nicaragua
  WHEN phone ~ '^(\+)?507[0-9]' THEN 'PA'     -- Panamá
  WHEN phone ~ '^(\+)?595[0-9]' THEN 'PY'     -- Paraguay
  WHEN phone ~ '^(\+)?51[0-9]' THEN 'PE'      -- Perú
  WHEN phone ~ '^(\+)?1809[0-9]' THEN 'DO'    -- Rep. Dominicana
  WHEN phone ~ '^(\+)?598[0-9]' THEN 'UY'     -- Uruguay
  WHEN phone ~ '^(\+)?58[0-9]' THEN 'VE'      -- Venezuela
  ELSE 'PE' -- Default Perú
END
WHERE country IS NULL AND phone IS NOT NULL;

-- Verificar cambios
SELECT id, full_name, phone, country 
FROM users 
WHERE phone LIKE '%591%' OR phone LIKE '%62449491%';
