-- ========================================
-- TABLA DE SOLICITUDES DE CONTACTO EMPRESARIAL
-- ========================================
-- Ejecutar en: Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS contact_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Información de la empresa
    company_name VARCHAR(255) NOT NULL,
    
    -- Información del contacto
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    position VARCHAR(100) NOT NULL,
    
    -- Tamaño del negocio
    employees VARCHAR(20) NOT NULL,
    stores VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    
    -- Mensaje opcional
    message TEXT,
    
    -- Estado de la solicitud
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'qualified', 'converted', 'rejected')),
    
    -- Metadata
    assigned_to UUID REFERENCES users(id),
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contacted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_contact_requests_email ON contact_requests(email);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_created ON contact_requests(created_at DESC);

-- Comentarios
COMMENT ON TABLE contact_requests IS 'Solicitudes de contacto del plan empresarial';
COMMENT ON COLUMN contact_requests.status IS 'pending: nuevo, contacted: contactado, qualified: calificado, converted: cliente, rejected: rechazado';
