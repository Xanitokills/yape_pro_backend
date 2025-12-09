/**
 * Controlador de Administración
 * Solo para usuarios con rol 'super_admin'
 */

const { supabase } = require('../config/database');
const subscriptionService = require('../services/subscriptionService');

/**
 * Obtener todos los usuarios con información de suscripción
 */
const getAllUsers = async (req, res) => {
  try {
    const { plan, status, search, page = 1, limit = 50 } = req.query;
    
    // Consultar directamente desde users con joins
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        subscription_plan_id,
        subscription_status,
        subscription_started_at,
        subscription_expires_at,
        is_active,
        created_at,
        subscription_plans:subscription_plan_id (
          name,
          price_monthly,
          badge,
          color
        )
      `, { count: 'exact' });

    // Filtros
    if (plan) {
      query = query.eq('subscription_plan_id', plan);
    }
    
    if (status) {
      query = query.eq('subscription_status', status);
    }
    
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);
    
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: {
        users: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de usuarios'
    });
  }
};

/**
 * Cambiar plan de un usuario (admin override)
 */
const changeUserPlan = async (req, res) => {
  try {
    const { userId } = req.params;
    const { planId, notes } = req.body;
    const adminId = req.user.id;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'El ID del plan es requerido'
      });
    }

    const adminNotes = `Cambio manual por admin ${req.user.email}${notes ? ': ' + notes : ''}`;
    const result = await subscriptionService.changePlan(userId, planId, adminNotes);

    res.json({
      success: true,
      message: 'Plan actualizado exitosamente',
      data: result
    });
  } catch (error) {
    console.error('Error al cambiar plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar el plan del usuario'
    });
  }
};

/**
 * Obtener estadísticas generales de suscripciones
 */
const getSubscriptionStats = async (req, res) => {
  try {
    // Total de usuarios por plan
    const { data: usersByPlan, error: planError } = await supabase
      .from('users')
      .select('subscription_plan_id')
      .not('subscription_plan_id', 'is', null);

    if (planError) throw planError;

    const planDistribution = usersByPlan.reduce((acc, user) => {
      const plan = user.subscription_plan_id;
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {});

    // Revenue mensual estimado
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('id, name, price_monthly');

    if (plansError) throw plansError;

    let totalRevenue = 0;
    plans.forEach(plan => {
      const userCount = planDistribution[plan.id] || 0;
      totalRevenue += userCount * parseFloat(plan.price_monthly);
    });

    // Usuarios activos vs inactivos
    const { data: activeUsers, error: activeError } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('subscription_status', 'active');

    if (activeError) throw activeError;

    // Transacciones totales del mes actual
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    const { data: usageData, error: usageError } = await supabase
      .from('usage_tracking')
      .select('transactions_count')
      .eq('year', year)
      .eq('month', month);

    if (usageError) throw usageError;

    const totalTransactions = usageData.reduce((sum, row) => sum + row.transactions_count, 0);

    // Usuarios cerca del límite (>80%)
    const { data: nearLimitUsers, error: limitError } = await supabase
      .rpc('get_users_near_limit', { threshold: 0.8 });

    // Obtener conversiones (cambios de plan) del último mes
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const { data: recentChanges, error: changesError } = await supabase
      .from('subscription_history')
      .select('*')
      .gte('created_at', lastMonth.toISOString())
      .in('action', ['upgrade', 'downgrade']);

    if (changesError) throw changesError;

    const upgrades = recentChanges.filter(c => c.action === 'upgrade').length;
    const downgrades = recentChanges.filter(c => c.action === 'downgrade').length;

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers: usersByPlan.length,
          activeUsers: activeUsers.length,
          totalRevenue: totalRevenue.toFixed(2),
          totalTransactionsThisMonth: totalTransactions
        },
        planDistribution,
        recentActivity: {
          upgrades,
          downgrades,
          netChange: upgrades - downgrades
        },
        alerts: {
          usersNearLimit: nearLimitUsers?.length || 0
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de suscripciones'
    });
  }
};

/**
 * Actualizar configuración de un plan
 */
const updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const updates = req.body;

    // Validar que no se intente modificar el ID
    if (updates.id) {
      delete updates.id;
    }

    const { data, error } = await supabase
      .from('subscription_plans')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Plan actualizado exitosamente',
      data
    });
  } catch (error) {
    console.error('Error al actualizar plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el plan'
    });
  }
};

/**
 * Crear un nuevo plan
 */
const createPlan = async (req, res) => {
  try {
    const planData = req.body;

    const { data, error } = await supabase
      .from('subscription_plans')
      .insert(planData)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Plan creado exitosamente',
      data
    });
  } catch (error) {
    console.error('Error al crear plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el plan'
    });
  }
};

/**
 * Desactivar un plan (no se puede eliminar si hay usuarios)
 */
const deactivatePlan = async (req, res) => {
  try {
    const { planId } = req.params;

    // Verificar que no haya usuarios con este plan
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_plan_id', planId);

    if (countError) throw countError;

    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede desactivar el plan. Hay ${count} usuario(s) usando este plan.`
      });
    }

    const { data, error } = await supabase
      .from('subscription_plans')
      .update({ is_active: false })
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Plan desactivado exitosamente',
      data
    });
  } catch (error) {
    console.error('Error al desactivar plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desactivar el plan'
    });
  }
};

/**
 * Obtener historial de cambios de un usuario
 */
const getUserSubscriptionHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('subscription_history')
      .select(`
        *,
        plan:plan_id(name),
        previous_plan:previous_plan_id(name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de suscripciones'
    });
  }
};

/**
 * Resetear límites de un usuario manualmente
 */
const resetUserLimits = async (req, res) => {
  try {
    const { userId } = req.params;
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    const { error } = await supabase
      .from('usage_tracking')
      .update({
        transactions_count: 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('year', year)
      .eq('month', month);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Límites reseteados exitosamente'
    });
  } catch (error) {
    console.error('Error al resetear límites:', error);
    res.status(500).json({
      success: false,
      message: 'Error al resetear los límites del usuario'
    });
  }
};

module.exports = {
  getAllUsers,
  changeUserPlan,
  getSubscriptionStats,
  updatePlan,
  createPlan,
  deactivatePlan,
  getUserSubscriptionHistory,
  resetUserLimits
};
