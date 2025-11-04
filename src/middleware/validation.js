// src/middleware/validation.js
const { body, validationResult } = require('express-validator');

/**
 * Middleware para manejar errores de validación
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos inválidos',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
}

/**
 * Validaciones para autenticación
 */
const authValidation = {
  register: [
    body('email')
      .isEmail()
      .withMessage('Email inválido')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('La contraseña debe tener al menos 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
    body('full_name')
      .trim()
      .notEmpty()
      .withMessage('El nombre completo es requerido')
      .isLength({ min: 2, max: 255 })
      .withMessage('El nombre debe tener entre 2 y 255 caracteres'),
    body('phone')
      .optional()
      .matches(/^\+?[\d\s-()]+$/)
      .withMessage('Número de teléfono inválido'),
    body('role')
      .optional()
      .isIn(['super_admin', 'owner', 'worker'])
      .withMessage('Rol inválido'),
    handleValidationErrors
  ],
  
  login: [
    body('email')
      .optional({ checkFalsy: true })
      .isEmail()
      .withMessage('Email inválido')
      .normalizeEmail(),
    body('phone')
      .optional({ checkFalsy: true })
      .matches(/^[0-9]{9}$/)
      .withMessage('Teléfono debe tener 9 dígitos'),
    body('password')
      .notEmpty()
      .withMessage('La contraseña es requerida'),
    // Al menos email o phone debe estar presente
    (req, res, next) => {
      if (!req.body.email && !req.body.phone) {
        return res.status(400).json({
          error: 'Datos incompletos',
          message: 'Debes proporcionar email o teléfono'
        });
      }
      next();
    },
    handleValidationErrors
  ]
};

/**
 * Validaciones para tiendas
 */
const storeValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('El nombre de la tienda es requerido')
      .isLength({ min: 2, max: 255 })
      .withMessage('El nombre debe tener entre 2 y 255 caracteres'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('La descripción no puede exceder 1000 caracteres'),
    body('address')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('La dirección no puede exceder 500 caracteres'),
    body('phone')
      .optional()
      .matches(/^\+?[\d\s-()]+$/)
      .withMessage('Número de teléfono inválido'),
    handleValidationErrors
  ],
  
  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('El nombre debe tener entre 2 y 255 caracteres'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 }),
    body('address')
      .optional()
      .trim()
      .isLength({ max: 500 }),
    body('phone')
      .optional()
      .matches(/^\+?[\d\s-()]+$/),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active debe ser un booleano'),
    handleValidationErrors
  ]
};

/**
 * Validaciones para notificaciones
 */
const notificationValidation = {
  create: [
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('El monto debe ser mayor a 0'),
    body('sender_name')
      .optional()
      .trim()
      .isLength({ max: 255 }),
    body('source')
      .isIn(['yape', 'plin', 'bcp', 'other'])
      .withMessage('Fuente inválida (yape, plin, bcp, other)'),
    body('message')
      .optional()
      .trim()
      .isLength({ max: 1000 }),
    body('notification_timestamp')
      .optional()
      .isISO8601()
      .withMessage('Fecha inválida'),
    handleValidationErrors
  ]
};

/**
 * Validaciones para trabajadores
 */
const workerValidation = {
  add: [
    body('store_id')
      .isUUID()
      .withMessage('ID de tienda inválido'),
    body('full_name')
      .trim()
      .notEmpty()
      .withMessage('El nombre completo es requerido')
      .isLength({ min: 2, max: 255 })
      .withMessage('El nombre debe tener entre 2 y 255 caracteres'),
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('El teléfono es requerido')
      .matches(/^[0-9]{9}$/)
      .withMessage('El teléfono debe tener exactamente 9 dígitos'),
    body('position')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('El cargo no puede exceder 100 caracteres'),
    handleValidationErrors
  ]
};

/**
 * Validar UUID en parámetros
 */
function validateUUID(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        error: 'ID inválido',
        message: `El parámetro ${paramName} debe ser un UUID válido`
      });
    }
    
    next();
  };
}

module.exports = {
  handleValidationErrors,
  authValidation,
  storeValidation,
  notificationValidation,
  workerValidation,
  validateUUID
};
