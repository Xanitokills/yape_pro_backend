-- ========================================
-- FIX: Actualizar max_employees del plan gratis de 0 a 1
-- ========================================

UPDATE subscription_plans 
SET max_employees = 1,
    updated_at = NOW()
WHERE id = 'free';
