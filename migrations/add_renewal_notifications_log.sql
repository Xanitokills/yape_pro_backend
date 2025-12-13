-- ========================================
-- TABLA DE LOG DE NOTIFICACIONES DE RENOVACIÓN
-- ========================================
-- Ejecutar en Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS renewal_notifications_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    days_remaining INTEGER,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_renewal_log_user ON renewal_notifications_log(user_id);
CREATE INDEX IF NOT EXISTS idx_renewal_log_sent_at ON renewal_notifications_log(sent_at);
CREATE INDEX IF NOT EXISTS idx_renewal_log_type_days ON renewal_notifications_log(notification_type, days_remaining);

-- Comentario
COMMENT ON TABLE renewal_notifications_log IS 'Registro de notificaciones de renovación enviadas para evitar spam';
