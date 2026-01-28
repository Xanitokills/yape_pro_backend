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
    throw new Error(`⚠️ Faltan variables de entorno requeridas: ${missing.join(', ')}\nRevisa el archivo .env.example`);
  }

  // Validar JWT_SECRET tiene suficiente longitud
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('⚠️ SEGURIDAD: JWT_SECRET debe tener al menos 32 caracteres. Genera uno seguro con: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  }

  // Validar CORS en producción
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === '*') {
      throw new Error('⚠️ SEGURIDAD: CORS_ORIGIN debe estar configurado en producción. No usar "*"');
    }
    
    // Verificar que test routes están deshabilitadas
    if (process.env.ENABLE_TEST_ROUTES === 'true' || process.env.ENABLE_TEST_UI === 'true') {
      throw new Error('⚠️ SEGURIDAD: ENABLE_TEST_ROUTES y ENABLE_TEST_UI deben estar deshabilitadas en producción');
    }
  }

  console.log('✅ Variables de entorno validadas correctamente');
}

// Validar al cargar el módulo
if (process.env.NODE_ENV !== 'test') {
  validateEnv();
}

module.exports = config;
