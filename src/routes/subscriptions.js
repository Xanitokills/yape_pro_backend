/**
 * Rutas de Suscripciones
 */

const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/subscriptions/plans
 * @desc    Obtener todos los planes disponibles
 * @access  Public
 */
router.get('/plans', subscriptionController.getPlans);

/**
 * @route   GET /api/subscriptions/my-subscription
 * @desc    Obtener información de suscripción del usuario actual
 * @access  Private
 */
router.get('/my-subscription', authenticateToken, subscriptionController.getMySubscription);

/**
 * @route   GET /api/subscriptions/usage
 * @desc    Obtener estadísticas de uso del usuario
 * @access  Private
 */
router.get('/usage', authenticateToken, subscriptionController.getUsageStats);

/**
 * @route   POST /api/subscriptions/change-plan
 * @desc    Cambiar plan de suscripción
 * @access  Private
 */
router.post('/change-plan', authenticateToken, subscriptionController.changePlan);

/**
 * @route   GET /api/subscriptions/check-limit/:limitType
 * @desc    Verificar límite específico (stores, employees, transactions)
 * @access  Private
 */
router.get('/check-limit/:limitType', authenticateToken, subscriptionController.checkLimit);

module.exports = router;
