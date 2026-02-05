// src/routes/coupons.js
const express = require('express');
const router = express.Router();
const couponsController = require('../controllers/couponsController');
const { authenticateToken } = require('../middleware/auth');
const { body, query, param } = require('express-validator');
const { validate } = require('../middleware/validator');

// Middleware de validación
const createCouponValidation = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('El código es requerido')
    .isLength({ min: 3, max: 50 })
    .withMessage('El código debe tener entre 3 y 50 caracteres')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('El código solo puede contener letras mayúsculas y números'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('discountType')
    .notEmpty()
    .withMessage('El tipo de descuento es requerido')
    .isIn(['percentage', 'fixed'])
    .withMessage('El tipo de descuento debe ser "percentage" o "fixed"'),
  body('discountValue')
    .notEmpty()
    .withMessage('El valor del descuento es requerido')
    .isFloat({ min: 0.01 })
    .withMessage('El valor del descuento debe ser mayor a 0'),
  body('maxUses')
    .notEmpty()
    .withMessage('El número máximo de usos es requerido')
    .isInt({ min: 1 })
    .withMessage('El número máximo de usos debe ser al menos 1'),
  body('storeId')
    .optional()
    .isUUID()
    .withMessage('El ID de tienda debe ser un UUID válido'),
  body('validFrom')
    .optional()
    .isISO8601()
    .withMessage('La fecha de inicio debe ser válida'),
  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('La fecha de fin debe ser válida'),
  body('minPurchaseAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El monto mínimo debe ser mayor o igual a 0'),
  validate
];

const updateCouponValidation = [
  param('id').isUUID().withMessage('ID inválido'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('discountType')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('El tipo de descuento debe ser "percentage" o "fixed"'),
  body('discountValue')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('El valor del descuento debe ser mayor a 0'),
  body('maxUses')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El número máximo de usos debe ser al menos 1'),
  body('validFrom')
    .optional()
    .isISO8601()
    .withMessage('La fecha de inicio debe ser válida'),
  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('La fecha de fin debe ser válida'),
  body('minPurchaseAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El monto mínimo debe ser mayor o igual a 0'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un valor booleano'),
  validate
];

const validateCouponValidation = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('El código es requerido'),
  body('storeId')
    .optional()
    .isUUID()
    .withMessage('El ID de tienda debe ser un UUID válido'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('El monto debe ser mayor a 0'),
  validate
];

const applyCouponValidation = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('El código es requerido'),
  body('storeId')
    .notEmpty()
    .withMessage('El ID de tienda es requerido')
    .isUUID()
    .withMessage('El ID de tienda debe ser un UUID válido'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('El monto debe ser mayor a 0'),
  body('notificationId')
    .optional()
    .isUUID()
    .withMessage('El ID de notificación debe ser un UUID válido'),
  validate
];

// ========================================
// RUTAS
// ========================================

/**
 * @route   POST /api/coupons
 * @desc    Crear un nuevo cupón
 * @access  Private (Owner, Super Admin)
 */
router.post(
  '/',
  authenticateToken,
  createCouponValidation,
  couponsController.createCoupon
);

/**
 * @route   GET /api/coupons
 * @desc    Obtener todos los cupones (con filtros y paginación)
 * @access  Private
 */
router.get(
  '/',
  authenticateToken,
  [
    query('storeId').optional().isUUID().withMessage('ID de tienda inválido'),
    query('isActive').optional().isBoolean().withMessage('isActive debe ser booleano'),
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser >= 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite entre 1 y 100'),
    validate
  ],
  couponsController.getCoupons
);

/**
 * @route   GET /api/coupons/stats
 * @desc    Obtener estadísticas de cupones
 * @access  Private (Owner, Super Admin)
 */
router.get(
  '/stats',
  authenticateToken,
  [
    query('storeId').optional().isUUID().withMessage('ID de tienda inválido'),
    validate
  ],
  couponsController.getCouponStats
);

/**
 * @route   GET /api/coupons/:id
 * @desc    Obtener un cupón por ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticateToken,
  [
    param('id').isUUID().withMessage('ID inválido'),
    validate
  ],
  couponsController.getCouponById
);

/**
 * @route   GET /api/coupons/:id/usage
 * @desc    Obtener historial de uso de un cupón
 * @access  Private
 */
router.get(
  '/:id/usage',
  authenticateToken,
  [
    param('id').isUUID().withMessage('ID inválido'),
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser >= 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite entre 1 y 100'),
    validate
  ],
  couponsController.getCouponUsageHistory
);

/**
 * @route   PUT /api/coupons/:id
 * @desc    Actualizar un cupón
 * @access  Private (Owner, Super Admin)
 */
router.put(
  '/:id',
  authenticateToken,
  updateCouponValidation,
  couponsController.updateCoupon
);

/**
 * @route   DELETE /api/coupons/:id
 * @desc    Eliminar un cupón
 * @access  Private (Owner, Super Admin)
 */
router.delete(
  '/:id',
  authenticateToken,
  [
    param('id').isUUID().withMessage('ID inválido'),
    validate
  ],
  couponsController.deleteCoupon
);

/**
 * @route   POST /api/coupons/validate
 * @desc    Validar un cupón antes de aplicarlo
 * @access  Public (puede ser usado desde la app móvil sin auth completa)
 */
router.post(
  '/validate',
  validateCouponValidation,
  couponsController.validateCoupon
);

/**
 * @route   POST /api/coupons/apply
 * @desc    Aplicar un cupón a una transacción
 * @access  Public/Private
 */
router.post(
  '/apply',
  applyCouponValidation,
  couponsController.applyCoupon
);

module.exports = router;
