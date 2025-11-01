// src/config/env.js

/**
 * Configuración centralizada de variables de entorno
 */
const config = {
  // Servidor
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  
  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // Firebase
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*'
  }
};

/**
 * Validar variables de entorno críticas
 */
function validateEnv() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'JWT_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`⚠️ Faltan variables de entorno requeridas: ${missing.join(', ')}`);
  }

  // Validar JWT_SECRET tiene suficiente longitud
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️ JWT_SECRET debería tener al menos 32 caracteres para mayor seguridad');
  }

  console.log('✅ Variables de entorno validadas');
}

// Validar al cargar el módulo
if (process.env.NODE_ENV !== 'test') {
  validateEnv();
}

module.exports = config;
