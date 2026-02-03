-- ========================================
-- DATOS INICIALES: Patrones de Notificación
-- ========================================
-- Estos son los patrones actuales extraídos del código hardcodeado
-- Se pueden modificar desde el panel admin sin recompilar

-- ========================================
-- PATRONES DE YAPE BOLIVIA
-- ========================================

-- Patrón 1: QR DE NOMBRE te envió Bs. MONTO
INSERT INTO notification_patterns (
    country, wallet_type, pattern, amount_group, sender_group,
    name, description, example, priority, currency, regex_flags
) VALUES (
    'BO', 'yape', 
    'qr\\s+de\\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\\s]+?)\\s+te\\s+envió\\s+bs\\.?\\s*(\\d+(?:\\.\\d{2})?)',
    2, 1,
    'Yape Bolivia - QR',
    'Formato QR de Yape Bolivia: "QR DE [NOMBRE] te envió Bs. [MONTO]"',
    'Recibiste un yapeo\nQR DE CHOQUE ORTIZ JUAN GABRIEL te envió Bs. 0.30',
    10, 'BOB', 'i'
);

-- Patrón 2: NOMBRE te envió Bs. MONTO (sin QR)
INSERT INTO notification_patterns (
    country, wallet_type, pattern, amount_group, sender_group,
    name, description, example, priority, currency, regex_flags
) VALUES (
    'BO', 'yape',
    '^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\\s]+?)\\s+te\\s+envió\\s+bs\\.?\\s*(\\d+(?:\\.\\d{2})?)',
    2, 1,
    'Yape Bolivia - Formato corto',
    'Formato corto de Yape Bolivia: "[NOMBRE] te envió Bs. [MONTO]"',
    'MARIA LOPEZ PEREZ te envió Bs. 15.50',
    20, 'BOB', 'im'
);

-- Patrón 3: yapeo NOMBRE te envió Bs. MONTO
INSERT INTO notification_patterns (
    country, wallet_type, pattern, amount_group, sender_group,
    name, description, example, priority, currency, regex_flags
) VALUES (
    'BO', 'yape',
    'yapeo\\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\\s]+?)\\s+te\\s+envió\\s+bs\\.?\\s*(\\d+(?:\\.\\d{2})?)',
    2, 1,
    'Yape Bolivia - Con "yapeo"',
    'Formato con palabra "yapeo": "yapeo [NOMBRE] te envió Bs. [MONTO]"',
    'yapeo JUAN PEREZ te envió Bs. 25.00',
    30, 'BOB', 'i'
);

-- Patrón 4: Recibiste Bs. MONTO de NOMBRE
INSERT INTO notification_patterns (
    country, wallet_type, pattern, amount_group, sender_group,
    name, description, example, priority, currency, regex_flags
) VALUES (
    'BO', 'yape',
    'recibiste\\s+bs\\.?\\s*(\\d+(?:\\.\\d{2})?)\\s+de\\s+([^\\n]+?)(?:\\s+via\\s+yape|\\.|$)',
    1, 2,
    'Yape Bolivia - Recibiste formato',
    'Formato alternativo Bolivia: "Recibiste Bs. [MONTO] de [NOMBRE]"',
    'Recibiste Bs. 50.00 de CARLOS RODRIGUEZ via Yape',
    40, 'BOB', 'i'
);

-- ========================================
-- PATRONES DE YAPE PERÚ
-- ========================================

-- Patrón 1: Yape! NOMBRE te envió un pago por S/ MONTO
INSERT INTO notification_patterns (
    country, wallet_type, pattern, amount_group, sender_group,
    name, description, example, priority, currency, regex_flags
) VALUES (
    'PE', 'yape',
    'yape!\\s+([^!]+?)\\s+te\\s+envió\\s+un\\s+pago\\s+por\\s+s/?\\s*(\\d+(?:\\.\\d{2})?)',
    2, 1,
    'Yape Perú - Formato oficial',
    'Formato oficial de Yape Perú: "Yape! [NOMBRE] te envió un pago por S/ [MONTO]"',
    'Confirmación de Pago Yape! SANDRO SAAVEDRA CASTRO te envió un pago por S/ 50.00',
    10, 'PEN', 'i'
);

-- Patrón 2: NOMBRE te envió un pago por S/ MONTO (sin Yape!)
INSERT INTO notification_patterns (
    country, wallet_type, pattern, amount_group, sender_group,
    name, description, example, priority, currency, regex_flags
) VALUES (
    'PE', 'yape',
    '([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\\s]+?)\\s+te\\s+envió\\s+un\\s+pago\\s+por\\s+s/?\\s*(\\d+(?:\\.\\d{2})?)',
    2, 1,
    'Yape Perú - Sin prefijo Yape!',
    'Formato sin "Yape!" al inicio: "[NOMBRE] te envió un pago por S/ [MONTO]"',
    'MARIA LOPEZ te envió un pago por S/ 30.50',
    20, 'PEN', 'i'
);

-- Patrón 3: NOMBRE te envió S/ MONTO
INSERT INTO notification_patterns (
    country, wallet_type, pattern, amount_group, sender_group,
    name, description, example, priority, currency, regex_flags
) VALUES (
    'PE', 'yape',
    '([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\\s]+?)\\s+te\\s+envió\\s+s/?\\s*(\\d+(?:\\.\\d{2})?)',
    2, 1,
    'Yape Perú - Formato corto',
    'Formato corto Perú: "[NOMBRE] te envió S/ [MONTO]"',
    'JUAN PEREZ te envió S/ 25.00',
    30, 'PEN', 'i'
);

-- Patrón 4: Recibiste S/ MONTO de NOMBRE
INSERT INTO notification_patterns (
    country, wallet_type, pattern, amount_group, sender_group,
    name, description, example, priority, currency, regex_flags
) VALUES (
    'PE', 'yape',
    'recibiste\\s+s/?\\s*(\\d+(?:\\.\\d{2})?)\\s+de\\s+([^\\n]+?)(?:\\s+via\\s+yape|\\.|$)',
    1, 2,
    'Yape Perú - Recibiste formato',
    'Formato antiguo Perú: "Recibiste S/ [MONTO] de [NOMBRE]"',
    'Recibiste S/ 100.00 de PEDRO GARCIA via Yape',
    40, 'PEN', 'i'
);

-- ========================================
-- PATRONES DE PLIN (PERÚ)
-- ========================================

-- Patrón 1: NOMBRE te ha plineado S/ MONTO
INSERT INTO notification_patterns (
    country, wallet_type, pattern, amount_group, sender_group,
    name, description, example, priority, currency, regex_flags
) VALUES (
    'PE', 'plin',
    '([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\\s]+?)\\s+te\\s+ha\\s+plineado\\s+s/?\\s*(\\d+(?:\\.\\d{2})?)',
    2, 1,
    'Plin - Formato "te ha plineado"',
    'Formato oficial de Plin: "[NOMBRE] te ha plineado S/ [MONTO]"',
    'CARLOS RODRIGUEZ te ha plineado S/ 45.00',
    10, 'PEN', 'i'
);

-- Patrón 2: Recibiste S/ MONTO de NOMBRE con Plin
INSERT INTO notification_patterns (
    country, wallet_type, pattern, amount_group, sender_group,
    name, description, example, priority, currency, regex_flags
) VALUES (
    'PE', 'plin',
    'recibiste\\s+s/?\\s*(\\d+(?:\\.\\d{2})?)\\s+de\\s+([^\\n]+?)(?:\\s+con\\s+plin)?',
    1, 2,
    'Plin - Formato "Recibiste"',
    'Formato alternativo: "Recibiste S/ [MONTO] de [NOMBRE] con Plin"',
    'Recibiste S/ 30.50 de MARIA LOPEZ con Plin',
    20, 'PEN', 'i'
);

-- Patrón 3: NOMBRE te envió S/ MONTO
INSERT INTO notification_patterns (
    country, wallet_type, pattern, amount_group, sender_group,
    name, description, example, priority, currency, regex_flags
) VALUES (
    'PE', 'plin',
    'plin.*?s/?\\s*(\\d+(?:\\.\\d{2})?)\\s+de\\s+([^\\n]+)',
    1, 2,
    'Plin - Formato genérico',
    'Formato genérico con Plin: menciona "Plin", "S/ [MONTO]", "de [NOMBRE]"',
    'Transferencia Plin S/ 75.00 de ANA TORRES',
    30, 'PEN', 'i'
);

-- ========================================
-- PATRONES DE BCP (PERÚ)
-- ========================================

-- Patrón 1: BCP: Abono de S/ MONTO
INSERT INTO notification_patterns (
    country, wallet_type, pattern, amount_group, sender_group,
    name, description, example, priority, currency, regex_flags
) VALUES (
    'PE', 'bcp',
    'bcp.*?abono.*?s/?\\s*(\\d+(?:\\.\\d{2})?)',
    1, 2,
    'BCP - Abono',
    'Formato BCP: "BCP: Abono de S/ [MONTO]" - No siempre incluye nombre del remitente',
    'BCP: Abono de S/ 100.00 de cuenta ****1234',
    10, 'PEN', 'i'
);

-- Patrón 2: Depósito BCP S/ MONTO
INSERT INTO notification_patterns (
    country, wallet_type, pattern, amount_group, sender_group,
    name, description, example, priority, currency, regex_flags
) VALUES (
    'PE', 'bcp',
    'depósito.*?bcp.*?s/?\\s*(\\d+(?:\\.\\d{2})?)',
    1, 2,
    'BCP - Depósito',
    'Formato alternativo: "Depósito BCP S/ [MONTO]"',
    'Depósito BCP S/ 250.00 realizado',
    20, 'PEN', 'i'
);

-- ========================================
-- PATRONES GENÉRICOS (FALLBACK)
-- ========================================

-- Solo usar si ningún patrón específico coincide
INSERT INTO notification_patterns (
    country, wallet_type, pattern, amount_group, sender_group,
    name, description, example, priority, currency, regex_flags
) VALUES (
    'ALL', 'other',
    's/?\\s*(\\d+(?:\\.\\d{2})?)',
    1, 0,
    'Genérico - Solo monto S/',
    'Patrón fallback que solo detecta monto en Soles. No captura remitente.',
    'Pago recibido S/ 50.00',
    1000, 'PEN', 'i'
);

INSERT INTO notification_patterns (
    country, wallet_type, pattern, amount_group, sender_group,
    name, description, example, priority, currency, regex_flags
) VALUES (
    'ALL', 'other',
    'bs\\.?\\s*(\\d+(?:\\.\\d{2})?)',
    1, 0,
    'Genérico - Solo monto Bs.',
    'Patrón fallback que solo detecta monto en Bolivianos. No captura remitente.',
    'Pago recibido Bs. 30.00',
    1010, 'BOB', 'i'
);

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Ver todos los patrones creados
SELECT 
    country,
    wallet_type,
    name,
    priority,
    is_active
FROM notification_patterns
ORDER BY country, wallet_type, priority;

-- Contar patrones por país y billetera
SELECT 
    country,
    wallet_type,
    COUNT(*) as pattern_count
FROM notification_patterns
WHERE is_active = true
GROUP BY country, wallet_type
ORDER BY country, wallet_type;
