// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter General - Para toda la API
 * 100 requests por 15 minutos
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: {
    success: false,
    error: 'Demasiadas peticiones desde esta IP. Intenta de nuevo en 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate Limiter para Login
 * 20 intentos por 15 minutos (aumentado para testing)
 * TODO: Reducir a 5 en producción
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
    code: 'LOGIN_RATE_LIMIT'
  },
  skipSuccessfulRequests: true, // No cuenta requests exitosos
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate Limiter para Registro
 * 3 registros por hora por IP
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: {
    success: false,
    error: 'Demasiados intentos de registro. Intenta de nuevo en 1 hora.',
    code: 'REGISTER_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate Limiter para Verificación SMS
 * 3 códigos por 1 hora
 */
const smsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: {
    success: false,
    error: 'Has alcanzado el límite de códigos SMS. Intenta de nuevo en 1 hora.',
    code: 'SMS_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false
  // Usar IP por defecto (mejor práctica)
});

/**
 * Rate Limiter para Contacto/Formularios
 * 5 envíos por hora
 */
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Has enviado demasiadas solicitudes. Intenta de nuevo en 1 hora.',
    code: 'CONTACT_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate Limiter estricto para rutas administrativas
 * 30 requests por 15 minutos
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    error: 'Demasiadas peticiones a rutas administrativas.',
    code: 'ADMIN_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalLimiter,
  loginLimiter,
  registerLimiter,
  smsLimiter,
  contactLimiter,
  adminLimiter
};
