/**
 * Middleware para verificar límites de planes
 */

const subscriptionService = require('../services/subscriptionService');

/**
 * Middleware genérico para verificar límites
 */
const checkPlanLimit = (limitType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      // Verificar límite
      const limitCheck = await subscriptionService.checkLimit(userId, limitType);

      if (!limitCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: `Has alcanzado el límite de tu plan`,
          error: 'PLAN_LIMIT_REACHED',
          details: {
            limitType: limitType,
            limit: limitCheck.limit,
            current: limitCheck.current,
            remaining: limitCheck.remaining
          }
        });
      }

      // Pasar información del límite al siguiente handler
      req.limitCheck = limitCheck;
      next();
    } catch (error) {
      console.error('Error en checkPlanLimit:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar límites del plan'
      });
    }
  };
};

/**
 * Middleware para verificar límite de tiendas
 */
const checkStoreLimit = checkPlanLimit('stores');

/**
 * Middleware para verificar límite de empleados
 */
const checkEmployeeLimit = checkPlanLimit('employees');

/**
 * Middleware para verificar límite de transacciones
 */
const checkTransactionLimit = checkPlanLimit('transactions');

/**
 * Middleware para verificar características del plan
 */
const requirePlanFeature = (feature) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      // Obtener suscripción del usuario
      const subscription = await subscriptionService.getUserSubscription(userId);

      // Verificar si tiene la característica
      const hasFeature = subscription[`has_${feature}`];

      if (!hasFeature) {
        return res.status(403).json({
          success: false,
          message: 'Esta función no está disponible en tu plan actual',
          error: 'FEATURE_NOT_AVAILABLE',
          details: {
            feature: feature,
            currentPlan: subscription.plan_name,
            requiredFeature: feature
          }
        });
      }

      next();
    } catch (error) {
      console.error('Error en requirePlanFeature:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar características del plan'
      });
    }
  };
};

module.exports = {
  checkPlanLimit,
  checkStoreLimit,
  checkEmployeeLimit,
  checkTransactionLimit,
  requirePlanFeature
};
