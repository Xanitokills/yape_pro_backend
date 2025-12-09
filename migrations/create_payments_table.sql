-- Tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  reference VARCHAR(50) UNIQUE NOT NULL,
  transaction_id VARCHAR(100),
  plan_id VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_phone VARCHAR(20) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_payments_reference ON payments(reference);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_user_email ON payments(user_email);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Comentarios
COMMENT ON TABLE payments IS 'Tabla de órdenes de pago para planes de suscripción';
COMMENT ON COLUMN payments.reference IS 'Referencia única del pago (YPPRO-XXXXX)';
COMMENT ON COLUMN payments.transaction_id IS 'ID de transacción de Izipay';
COMMENT ON COLUMN payments.plan_id IS 'ID del plan: free, pro, enterprise';
COMMENT ON COLUMN payments.payment_method IS 'Método: yape, plin, card, bank';
COMMENT ON COLUMN payments.status IS 'Estado: pending, completed, failed, expired';
