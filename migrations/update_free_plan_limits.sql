-- Actualizar límites del plan gratis
UPDATE subscription_plans 
SET 
    max_stores = 1,
    max_employees = 1,
    max_transactions_monthly = 30,
    updated_at = NOW()
WHERE id = 'free';

-- Verificar que se aplicó correctamente
SELECT id, name, max_stores, max_employees, max_transactions_monthly 
FROM subscription_plans 
WHERE id = 'free';
