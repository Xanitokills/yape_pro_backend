/**
 * Controlador de Suscripciones
 */

const subscriptionService = require('../services/subscriptionService');

// 🔄 CACHÉ EN MEMORIA PARA PLANES (evitar consultas repetidas)
let plansCache = null;
let plansCacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtener todos los planes disponibles (con caché)
 */
const getPlans = async (req, res) => {
  try {
    const now = Date.now();
    
    // Verificar si el caché es válido
    if (plansCache && plansCacheTimestamp && (now - plansCacheTimestamp) < CACHE_DURATION) {
      console.log('📦 Sirviendo planes desde caché');
      return res.json({
        success: true,
        data: plansCache,
        cached: true
      });
    }

    // Si no hay caché válido, obtener de la BD
    console.log('🔄 Obteniendo planes desde base de datos');
    const plans = await subscriptionService.getAllPlans();

    // Actualizar caché
    plansCache = plans;
    plansCacheTimestamp = now;

    res.json({
      success: true,
      data: plans,
      cached: false
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
    const userId = req.user.userId;
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
    const userId = req.user.userId;
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
    const userId = req.user.userId;
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
    const userId = req.user.userId;
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
