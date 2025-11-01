// src/middleware/errorHandler.js

/**
 * Middleware global para manejo de errores
 */
function errorHandler(err, req, res, next) {
  // Log del error (en producción esto debería ir a un servicio de logging)
  console.error('❌ Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    body: req.body,
    user: req.user?.userId
  });

  // Error de validación de Joi
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Datos inválidos',
      message: err.message,
      details: err.details
    });
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      message: 'El token de autenticación no es válido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
    });
  }

  // Error de Supabase
  if (err.code && err.code.startsWith('PGRST')) {
    return res.status(400).json({
      error: 'Error en la base de datos',
      message: 'Hubo un problema al procesar tu solicitud',
      code: err.code
    });
  }

  // Error de duplicado (unique constraint)
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Recurso duplicado',
      message: 'El recurso que intentas crear ya existe'
    });
  }

  // Error de clave foránea (foreign key)
  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Referencia inválida',
      message: 'El recurso referenciado no existe'
    });
  }

  // Errores personalizados con statusCode
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.name || 'Error',
      message: err.message
    });
  }

  // Error genérico 500
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Ocurrió un error inesperado. Por favor intenta nuevamente.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * Clase de error personalizado
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Wrapper para funciones async (evita try-catch repetitivo)
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = errorHandler;
module.exports.AppError = AppError;
module.exports.asyncHandler = asyncHandler;
