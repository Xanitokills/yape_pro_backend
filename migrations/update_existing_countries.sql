-- Actualizar países de usuarios existentes detectando desde el código de teléfono

-- Perú (+51)
UPDATE users 
SET country = 'PE' 
WHERE country IS NULL 
  AND (phone LIKE '+51%' OR phone LIKE '51%');

-- Argentina (+54)
UPDATE users 
SET country = 'AR' 
WHERE country IS NULL 
  AND (phone LIKE '+54%' OR phone LIKE '54%');

-- Bolivia (+591)
UPDATE users 
SET country = 'BO' 
WHERE country IS NULL 
  AND (phone LIKE '+591%' OR phone LIKE '591%');

-- Brasil (+55)
UPDATE users 
SET country = 'BR' 
WHERE country IS NULL 
  AND (phone LIKE '+55%' OR phone LIKE '55%');

-- Chile (+56)
UPDATE users 
SET country = 'CL' 
WHERE country IS NULL 
  AND (phone LIKE '+56%' OR phone LIKE '56%');

-- Colombia (+57)
UPDATE users 
SET country = 'CO' 
WHERE country IS NULL 
  AND (phone LIKE '+57%' OR phone LIKE '57%');

-- Costa Rica (+506)
UPDATE users 
SET country = 'CR' 
WHERE country IS NULL 
  AND (phone LIKE '+506%' OR phone LIKE '506%');

-- Cuba (+53)
UPDATE users 
SET country = 'CU' 
WHERE country IS NULL 
  AND (phone LIKE '+53%' OR phone LIKE '53%');

-- Ecuador (+593)
UPDATE users 
SET country = 'EC' 
WHERE country IS NULL 
  AND (phone LIKE '+593%' OR phone LIKE '593%');

-- El Salvador (+503)
UPDATE users 
SET country = 'SV' 
WHERE country IS NULL 
  AND (phone LIKE '+503%' OR phone LIKE '503%');

-- España (+34)
UPDATE users 
SET country = 'ES' 
WHERE country IS NULL 
  AND (phone LIKE '+34%' OR phone LIKE '34%');

-- Guatemala (+502)
UPDATE users 
SET country = 'GT' 
WHERE country IS NULL 
  AND (phone LIKE '+502%' OR phone LIKE '502%');

-- Honduras (+504)
UPDATE users 
SET country = 'HN' 
WHERE country IS NULL 
  AND (phone LIKE '+504%' OR phone LIKE '504%');

-- México (+52)
UPDATE users 
SET country = 'MX' 
WHERE country IS NULL 
  AND (phone LIKE '+52%' OR phone LIKE '52%');

-- Nicaragua (+505)
UPDATE users 
SET country = 'NI' 
WHERE country IS NULL 
  AND (phone LIKE '+505%' OR phone LIKE '505%');

-- Panamá (+507)
UPDATE users 
SET country = 'PA' 
WHERE country IS NULL 
  AND (phone LIKE '+507%' OR phone LIKE '507%');

-- Paraguay (+595)
UPDATE users 
SET country = 'PY' 
WHERE country IS NULL 
  AND (phone LIKE '+595%' OR phone LIKE '595%');

-- República Dominicana (+1-809)
UPDATE users 
SET country = 'DO' 
WHERE country IS NULL 
  AND (phone LIKE '+1809%' OR phone LIKE '1809%');

-- Uruguay (+598)
UPDATE users 
SET country = 'UY' 
WHERE country IS NULL 
  AND (phone LIKE '+598%' OR phone LIKE '598%');

-- Venezuela (+58)
UPDATE users 
SET country = 'VE' 
WHERE country IS NULL 
  AND (phone LIKE '+58%' OR phone LIKE '58%');

-- Verificar resultados
SELECT country, COUNT(*) as total
FROM users
GROUP BY country
ORDER BY total DESC;
