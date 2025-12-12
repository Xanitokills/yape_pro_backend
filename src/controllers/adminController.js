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
    
    console.log('📊 getAllUsers llamado con:', { plan, status, search, page, limit });
    
    // Primero obtener los usuarios owners
    let ownerQuery = supabase
      .from('users')
      .select('*')
      .eq('role', 'owner');

    // Filtros para owners
    if (plan) ownerQuery = ownerQuery.eq('subscription_plan_id', plan);
    if (status) ownerQuery = ownerQuery.eq('subscription_status', status);
    if (search) {
      ownerQuery = ownerQuery.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }
    
    ownerQuery = ownerQuery.order('created_at', { ascending: false });

    const { data: owners, error: ownersError } = await ownerQuery;

    if (ownersError) {
      console.error('❌ Error en query owners:', ownersError);
      throw ownersError;
    }

    console.log('✅ Owners encontrados:', owners?.length || 0);

    // Obtener todas las tiendas de los owners
    const ownerIds = owners.map(o => o.id);
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, owner_id')
      .in('owner_id', ownerIds);

    if (storesError) {
      console.error('❌ Error en query stores:', storesError);
      throw storesError;
    }

    // Obtener todos los trabajadores de esas tiendas
    const storeIds = stores?.map(s => s.id) || [];
    let workersData = [];
    
    if (storeIds.length > 0) {
      const { data: workers, error: workersError } = await supabase
        .from('workers')
        .select(`
          *,
          users!workers_user_id_fkey (
            id,
            email,
            full_name,
            phone,
            role,
            subscription_plan_id,
            subscription_status,
            created_at
          )
        `)
        .in('store_id', storeIds);

      if (workersError) {
        console.error('❌ Error en query workers:', workersError);
      } else {
        workersData = workers || [];
      }
    }

    // Obtener los planes para agregar información
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*');

    if (plansError) {
      console.error('❌ Error en query planes:', plansError);
      throw plansError;
    }

    // Obtener transacciones actuales del mes para cada owner
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const { data: usageData, error: usageError } = await supabase
      .from('usage_tracking')
      .select('user_id, transactions_count')
      .in('user_id', ownerIds)
      .eq('month', currentMonth)
      .eq('year', currentYear);

    if (usageError) {
      console.error('❌ Error en query usage_tracking:', usageError);
    }

    // Mapear owners con sus tiendas y trabajadores
    const ownersWithWorkers = owners.map(owner => {
      const plan = plans.find(p => p.id === owner.subscription_plan_id);
      const ownerStores = stores?.filter(s => s.owner_id === owner.id) || [];
      
      // Obtener uso actual del owner
      const usage = usageData?.find(u => u.user_id === owner.id);
      const transactions_count = usage?.transactions_count || 0;
      
      // Obtener trabajadores de todas las tiendas del owner
      const ownerWorkers = workersData
        .filter(w => ownerStores.some(s => s.id === w.store_id))
        .map(w => ({
          user_id: w.users?.id,
          id: w.users?.id,
          email: w.users?.email,
          full_name: w.users?.full_name,
          phone: w.users?.phone,
          role: w.users?.role || 'worker',
          subscription_plan_id: w.users?.subscription_plan_id,
          subscription_status: w.users?.subscription_status || 'active',
          created_at: w.users?.created_at,
          store_name: ownerStores.find(s => s.id === w.store_id)?.name,
          position: w.position,
          worker_id: w.id
        }));

      return {
        user_id: owner.id,
        id: owner.id,
        email: owner.email,
        full_name: owner.full_name,
        phone: owner.phone,
        role: owner.role,
        subscription_plan_id: owner.subscription_plan_id,
        subscription_status: owner.subscription_status,
        subscription_started_at: owner.subscription_started_at,
        subscription_expires_at: owner.subscription_expires_at,
        is_active: owner.is_active,
        created_at: owner.created_at,
        transactions_count, // 📊 Agregar contador de transacciones
        plan: plan ? {
          name: plan.name,
          price_monthly: plan.price_monthly,
          badge: plan.badge,
          color: plan.color
        } : null,
        max_stores: plan?.max_stores,
        max_employees: plan?.max_employees,
        max_transactions_monthly: plan?.max_transactions_monthly,
        stores: ownerStores.map(s => ({ id: s.id, name: s.name })),
        workers: ownerWorkers
      };
    });

    // Calcular total para paginación (solo owners)
    const total = owners.length;
    
    res.json({
      success: true,
      data: {
        users: ownersWithWorkers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de usuarios',
      error: error.message
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

    console.log('📜 Obteniendo historial para usuario:', userId);

    // Primero obtener el historial sin joins complejos
    const { data: history, error: historyError } = await supabase
      .from('subscription_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('❌ Error al obtener historial:', historyError);
      throw historyError;
    }

    console.log('✅ Historial encontrado:', history?.length || 0);

    // Si hay historial, obtener información de los planes
    if (history && history.length > 0) {
      const planIds = [...new Set([
        ...history.map(h => h.plan_id).filter(Boolean),
        ...history.map(h => h.previous_plan_id).filter(Boolean)
      ])];

      const { data: plans, error: plansError } = await supabase
        .from('subscription_plans')
        .select('id, name')
        .in('id', planIds);

      if (plansError) {
        console.error('❌ Error al obtener planes:', plansError);
      }

      // Mapear los datos con información de planes
      const historyWithPlans = history.map(record => ({
        ...record,
        plan: plans?.find(p => p.id === record.plan_id),
        previous_plan: plans?.find(p => p.id === record.previous_plan_id)
      }));

      res.json({
        success: true,
        data: historyWithPlans
      });
    } else {
      res.json({
        success: true,
        data: []
      });
    }
  } catch (error) {
    console.error('❌ Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de suscripciones',
      error: error.message
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
