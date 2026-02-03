/**
 * Rutas de Administración
 * Solo accesibles para usuarios con rol 'super_admin'
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimiter');

// Middleware: todas las rutas requieren autenticación y rol super_admin
router.use(adminLimiter); // Rate limiting adicional para admin
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

// ========================================
// ROUTAS PARA GESTIÓN DE PATRONES DE NOTIFICACIÓN
// ========================================

/**
 * @route   GET /api/admin/notification-patterns
 * @desc    Obtener todos los patrones de notificación
 * @query   country, wallet_type, is_active
 * @access  Super Admin
 */
router.get('/notification-patterns', adminController.getNotificationPatterns);

/**
 * @route   GET /api/admin/notification-patterns/stats
 * @desc    Obtener estadísticas de patrones
 * @access  Super Admin
 */
router.get('/notification-patterns/stats', adminController.getNotificationPatternStats);

/**
 * @route   GET /api/admin/notification-patterns/:id
 * @desc    Obtener un patrón específico
 * @access  Super Admin
 */
router.get('/notification-patterns/:id', adminController.getNotificationPattern);

/**
 * @route   POST /api/admin/notification-patterns
 * @desc    Crear nuevo patrón
 * @body    { country, wallet_type, pattern, ... }
 * @access  Super Admin
 */
router.post('/notification-patterns', adminController.createNotificationPattern);

/**
 * @route   POST /api/admin/notification-patterns/test
 * @desc    Probar un patrón regex
 * @body    { pattern, test_text, ... }
 * @access  Super Admin
 */
router.post('/notification-patterns/test', adminController.testNotificationPattern);

/**
 * @route   PUT /api/admin/notification-patterns/:id
 * @desc    Actualizar patrón existente
 * @access  Super Admin
 */
router.put('/notification-patterns/:id', adminController.updateNotificationPattern);

/**
 * @route   DELETE /api/admin/notification-patterns/:id
 * @desc    Eliminar patrón
 * @access  Super Admin
 */
router.delete('/notification-patterns/:id', adminController.deleteNotificationPattern);

// ========================================
// FIN RUTAS PATRONES
// ========================================
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

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Eliminar un owner y todos sus datos en cascada
 *          (tiendas, trabajadores, notificaciones, tokens)
 * @access  Super Admin
 */
router.delete('/users/:userId', adminController.deleteOwner);

/**
 * @route   POST /api/admin/create-super-admin
 * @desc    Crear un nuevo super administrador
 * @body    { email, password, full_name }
 * @access  Super Admin (requiere estar autenticado como super_admin)
 */
router.post('/create-super-admin', adminController.createSuperAdmin);

/**
 * @route   GET /api/admin/super-admins
 * @desc    Listar todos los super administradores
 * @access  Super Admin
 */
router.get('/super-admins', adminController.listSuperAdmins);

module.exports = router;
