/**
 * Rutas de Administración
 * Solo accesibles para usuarios con rol 'super_admin'
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Middleware: todas las rutas requieren autenticación y rol super_admin
router.use(authenticateToken);
router.use(authorizeRoles('super_admin'));

/**
 * @route   GET /api/admin/users
 * @desc    Obtener todos los usuarios con filtros y paginación
 * @query   plan, status, search, page, limit
 * @access  Super Admin
 */
router.get('/users', adminController.getAllUsers);

/**
 * @route   POST /api/admin/users/:userId/change-plan
 * @desc    Cambiar plan de un usuario específico
 * @body    { planId: string, notes?: string }
 * @access  Super Admin
 */
router.post('/users/:userId/change-plan', adminController.changeUserPlan);

/**
 * @route   GET /api/admin/users/:userId/history
 * @desc    Obtener historial de suscripciones de un usuario
 * @access  Super Admin
 */
router.get('/users/:userId/history', adminController.getUserSubscriptionHistory);

/**
 * @route   POST /api/admin/users/:userId/reset-limits
 * @desc    Resetear límites de uso de un usuario
 * @access  Super Admin
 */
router.post('/users/:userId/reset-limits', adminController.resetUserLimits);

/**
 * @route   GET /api/admin/stats
 * @desc    Obtener estadísticas generales de suscripciones
 * @access  Super Admin
 */
router.get('/stats', adminController.getSubscriptionStats);

/**
 * @route   POST /api/admin/plans
 * @desc    Crear un nuevo plan
 * @access  Super Admin
 */
router.post('/plans', adminController.createPlan);

/**
 * @route   PUT /api/admin/plans/:planId
 * @desc    Actualizar configuración de un plan
 * @access  Super Admin
 */
router.put('/plans/:planId', adminController.updatePlan);

/**
 * @route   DELETE /api/admin/plans/:planId
 * @desc    Desactivar un plan (no elimina, solo desactiva)
 * @access  Super Admin
 */
router.delete('/plans/:planId', adminController.deactivatePlan);

module.exports = router;
