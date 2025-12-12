-- ========================================
-- CONFIGURAR SUPER ADMIN
-- ========================================
-- Este script crea o actualiza el usuario super_admin

-- Credenciales por defecto:
-- Email: admin@pagoseguro.com
-- Password: Admin123!

-- Verificar si ya existe el super admin
DO $$
DECLARE
    v_user_id UUID;
    v_password_hash TEXT := '$2b$10$6jnKPgfEvZdNrXTVu5.rTu/1aBlzsPuDUWBe6S3a9qqgR1DQWwMxa'; -- Admin123!
BEGIN
    -- Buscar usuario super admin
    SELECT id INTO v_user_id
    FROM users
    WHERE email = 'admin@pagoseguro.com';

    IF v_user_id IS NULL THEN
        -- Crear nuevo super admin
        INSERT INTO users (
            email,
            password_hash,
            full_name,
            role,
            subscription_plan_id,
            subscription_status,
            phone
        ) VALUES (
            'admin@pagoseguro.com',
            v_password_hash,
            'Super Admin',
            'super_admin',
            'enterprise', -- Plan enterprise para el admin
            'active',
            '999999999'
        )
        RETURNING id INTO v_user_id;

        RAISE NOTICE 'Super Admin creado con ID: %', v_user_id;
    ELSE
        -- Actualizar super admin existente
        UPDATE users
        SET 
            password_hash = v_password_hash,
            role = 'super_admin',
            subscription_plan_id = 'enterprise',
            subscription_status = 'active',
            full_name = 'Super Admin'
        WHERE id = v_user_id;

        RAISE NOTICE 'Super Admin actualizado con ID: %', v_user_id;
    END IF;

    -- Verificar resultado
    SELECT 
        id,
        email,
        full_name,
        role,
        subscription_plan_id,
        subscription_status
    FROM users
    WHERE id = v_user_id;
END $$;

-- Verificación
SELECT 
    'SUPER ADMIN CONFIGURADO:' as status,
    email,
    full_name,
    role,
    subscription_plan_id,
    subscription_status
FROM users
WHERE email = 'admin@pagoseguro.com';
