/**
 * Controlador de Suscripciones
 */

const subscriptionService = require('../services/subscriptionService');

/**
 * Obtener todos los planes disponibles
 */
const getPlans = async (req, res) => {
  try {
    const plans = await subscriptionService.getAllPlans();

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error al obtener planes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los planes'
    });
  }
};

/**
 * Obtener información de suscripción del usuario actual
 */
const getMySubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscription = await subscriptionService.getUserSubscription(userId);

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Error al obtener suscripción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información de suscripción'
    });
  }
};

/**
 * Obtener estadísticas de uso
 */
const getUsageStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await subscriptionService.getUsageStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de uso'
    });
  }
};

/**
 * Cambiar plan de suscripción
 */
const changePlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId, notes } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'El ID del plan es requerido'
      });
    }

    const result = await subscriptionService.changePlan(userId, planId, notes);

    res.json({
      success: true,
      message: `Plan ${result.action === 'upgrade' ? 'actualizado' : 'cambiado'} exitosamente`,
      data: result
    });
  } catch (error) {
    console.error('Error al cambiar plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar el plan'
    });
  }
};

/**
 * Verificar límite específico
 */
const checkLimit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limitType } = req.params;

    if (!['stores', 'employees', 'transactions'].includes(limitType)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de límite inválido'
      });
    }

    const limitCheck = await subscriptionService.checkLimit(userId, limitType);

    res.json({
      success: true,
      data: limitCheck
    });
  } catch (error) {
    console.error('Error al verificar límite:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar límite'
    });
  }
};

module.exports = {
  getPlans,
  getMySubscription,
  getUsageStats,
  changePlan,
  checkLimit
};
