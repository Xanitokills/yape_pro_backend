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

/**
 * Eliminar un owner y todos sus datos en cascada
 * DELETE /api/admin/users/:userId
 * 
 * Esto eliminará:
 * - Usuario (owner)
 * - Tiendas del owner (CASCADE)
 * - Workers de las tiendas (CASCADE)
 * - Notificaciones de las tiendas (CASCADE)
 * - FCM tokens del usuario (CASCADE)
 * - Refresh tokens del usuario (CASCADE)
 * - Usage tracking del usuario (CASCADE)
 */
const deleteOwner = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;

    console.log(`🗑️ Admin ${adminId} solicitó eliminar owner ${userId}`);

    // Verificar que el usuario existe y es owner
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.log(`❌ Usuario ${userId} no encontrado`);
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir eliminar super_admins
    if (user.role === 'super_admin') {
      console.log(`❌ Intento de eliminar super_admin ${userId}`);
      return res.status(403).json({
        success: false,
        message: 'No se puede eliminar a un super administrador'
      });
    }

    // Obtener información para el log antes de eliminar
    const { data: stores } = await supabase
      .from('stores')
      .select('id, name')
      .eq('owner_id', userId);

    const storeIds = stores?.map(s => s.id) || [];
    
    let workersCount = 0;
    let notificationsCount = 0;
    
    if (storeIds.length > 0) {
      const { count: wCount } = await supabase
        .from('workers')
        .select('*', { count: 'exact', head: true })
        .in('store_id', storeIds);
      workersCount = wCount || 0;

      const { count: nCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .in('store_id', storeIds);
      notificationsCount = nCount || 0;
    }

    console.log(`📊 Datos a eliminar para ${user.email}:`);
    console.log(`   - Tiendas: ${stores?.length || 0}`);
    console.log(`   - Trabajadores: ${workersCount}`);
    console.log(`   - Notificaciones: ${notificationsCount}`);

    // Eliminar trabajadores de las tiendas del owner
    if (storeIds.length > 0) {
      const { error: workersDeleteError } = await supabase
        .from('workers')
        .delete()
        .in('store_id', storeIds);

      if (workersDeleteError) {
        console.error('⚠️ Error al eliminar trabajadores (continuando):', workersDeleteError);
      } else {
        console.log(`✅ ${workersCount} trabajadores eliminados`);
      }

      // Eliminar notificaciones
      const { error: notificationsDeleteError } = await supabase
        .from('notifications')
        .delete()
        .in('store_id', storeIds);

      if (notificationsDeleteError) {
        console.error('⚠️ Error al eliminar notificaciones (continuando):', notificationsDeleteError);
      } else {
        console.log(`✅ ${notificationsCount} notificaciones eliminadas`);
      }
    }

    // Eliminar pagos del usuario primero (para evitar FK constraint)
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .eq('user_id', userId);

    if (paymentsError) {
      console.error('⚠️ Error al eliminar pagos (continuando):', paymentsError);
    } else {
      console.log(`✅ Pagos del usuario eliminados`);
    }

    // Eliminar usage_tracking del usuario
    const { error: usageError } = await supabase
      .from('usage_tracking')
      .delete()
      .eq('user_id', userId);

    if (usageError) {
      console.error('⚠️ Error al eliminar usage_tracking (continuando):', usageError);
    }

    // Eliminar subscription_history del usuario
    const { error: historyError } = await supabase
      .from('subscription_history')
      .delete()
      .eq('user_id', userId);

    if (historyError) {
      console.error('⚠️ Error al eliminar subscription_history (continuando):', historyError);
    }

    // Eliminar tiendas del usuario
    if (storeIds.length > 0) {
      const { error: storesError } = await supabase
        .from('stores')
        .delete()
        .eq('owner_id', userId);

      if (storesError) {
        console.error('⚠️ Error al eliminar tiendas (continuando):', storesError);
      } else {
        console.log(`✅ ${stores?.length || 0} tiendas eliminadas`);
      }
    }

    // Eliminar usuario (también eliminará fcm_tokens, refresh_tokens por CASCADE)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('❌ Error al eliminar usuario:', deleteError);
      throw deleteError;
    }

    console.log(`✅ Usuario ${user.email} eliminado exitosamente con todos sus datos`);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      data: {
        deletedUser: {
          id: userId,
          email: user.email,
          full_name: user.full_name
        },
        deletedResources: {
          stores: stores?.length || 0,
          workers: workersCount,
          notifications: notificationsCount
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en deleteOwner:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el usuario',
      error: error.message
    });
  }
};

/**
 * Crear nuevo super administrador (solo super_admin puede hacerlo)
 * POST /api/admin/create-super-admin
 * Body: { email, password, full_name }
 */
const createSuperAdmin = async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    const bcrypt = require('bcrypt');
    
    // Validaciones básicas
    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        error: 'Datos incompletos',
        message: 'Email, contraseña y nombre completo son requeridos'
      });
    }
    
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña débil',
        message: 'La contraseña debe tener al menos 8 caracteres'
      });
    }
    
    // Verificar si el email ya existe
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email.toLowerCase())
      .single();
    
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: 'Email ya registrado',
        message: 'Ya existe una cuenta con este email'
      });
    }
    
    // Hashear contraseña
    const password_hash = await bcrypt.hash(password, 10);
    
    // Crear super admin
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        full_name,
        role: 'super_admin',
        phone: null
      })
      .select('id, email, full_name, role, created_at')
      .single();
    
    if (error) {
      console.error('Error al crear super admin:', error);
      throw error;
    }
    
    // Log de auditoría
    console.log(`✅ Super admin creado por: ${req.user.email}`);
    console.log(`   Nuevo super admin: ${user.email}`);
    
    res.status(201).json({
      success: true,
      message: 'Super administrador creado exitosamente',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          created_at: user.created_at
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error en createSuperAdmin:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear super administrador',
      message: 'Hubo un problema al crear la cuenta'
    });
  }
};

/**
 * Listar todos los super administradores
 * GET /api/admin/super-admins
 */
const listSuperAdmins = async (req, res) => {
  try {
    const { data: superAdmins, error } = await supabase
      .from('users')
      .select('id, email, full_name, created_at, last_login')
      .eq('role', 'super_admin')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: {
        superAdmins,
        total: superAdmins.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error en listSuperAdmins:', error);
    res.status(500).json({
      success: false,
      error: 'Error al listar super administradores',
      message: error.message
    });
  }
};

/**
 * ========================================
 * GESTIÓN DE PATRONES DE NOTIFICACIÓN
 * ========================================
 */

/**
 * Obtener todos los patrones de notificación
 * GET /api/admin/notification-patterns
 */
const getNotificationPatterns = async (req, res) => {
  try {
    const { country, wallet_type, is_active } = req.query;
    
    console.log('📋 getNotificationPatterns llamado con:', { country, wallet_type, is_active });
    
    let query = supabase
      .from('notification_patterns')
      .select('*');
    
    // Aplicar filtros
    if (country) query = query.eq('country', country);
    if (wallet_type) query = query.eq('wallet_type', wallet_type);
    if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');
    
    // Ordenar por prioridad y fecha
    query = query.order('priority', { ascending: true })
                 .order('created_at', { ascending: false });
    
    const { data: patterns, error } = await query;
    
    if (error) throw error;
    
    console.log('✅ Patrones encontrados:', patterns?.length || 0);
    
    res.json({
      success: true,
      data: {
        patterns,
        total: patterns.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error en getNotificationPatterns:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener patrones de notificación',
      message: error.message
    });
  }
};

/**
 * Obtener un patrón específico por ID
 * GET /api/admin/notification-patterns/:id
 */
const getNotificationPattern = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: pattern, error } = await supabase
      .from('notification_patterns')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!pattern) {
      return res.status(404).json({
        success: false,
        error: 'Patrón no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: { pattern }
    });
    
  } catch (error) {
    console.error('❌ Error en getNotificationPattern:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener patrón',
      message: error.message
    });
  }
};

/**
 * Crear nuevo patrón de notificación
 * POST /api/admin/notification-patterns
 */
const createNotificationPattern = async (req, res) => {
  try {
    const {
      country,
      wallet_type,
      pattern,
      amount_group,
      sender_group,
      name,
      description,
      example,
      priority,
      currency,
      regex_flags,
      is_active
    } = req.body;
    
    // Validaciones
    if (!country || !wallet_type || !pattern || !name) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: country, wallet_type, pattern, name'
      });
    }
    
    // Validar que la regex sea válida
    try {
      new RegExp(pattern, regex_flags || 'i');
    } catch (regexError) {
      return res.status(400).json({
        success: false,
        error: 'Patrón regex inválido',
        message: regexError.message
      });
    }
    
    const userId = req.user.id; // Del middleware de autenticación
    
    const { data: newPattern, error } = await supabase
      .from('notification_patterns')
      .insert([{
        country,
        wallet_type,
        pattern,
        amount_group: amount_group || 1,
        sender_group: sender_group || 2,
        name,
        description,
        example,
        priority: priority || 100,
        currency: currency || 'PEN',
        regex_flags: regex_flags || 'i',
        is_active: is_active !== undefined ? is_active : true,
        created_by: userId,
        updated_by: userId
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Patrón creado exitosamente:', newPattern.id);
    
    res.status(201).json({
      success: true,
      message: 'Patrón creado exitosamente',
      data: { pattern: newPattern }
    });
    
  } catch (error) {
    console.error('❌ Error en createNotificationPattern:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear patrón',
      message: error.message
    });
  }
};

/**
 * Actualizar patrón de notificación existente
 * PUT /api/admin/notification-patterns/:id
 */
const updateNotificationPattern = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      country,
      wallet_type,
      pattern,
      amount_group,
      sender_group,
      name,
      description,
      example,
      priority,
      currency,
      regex_flags,
      is_active
    } = req.body;
    
    // Validar que el patrón existe
    const { data: existingPattern, error: checkError } = await supabase
      .from('notification_patterns')
      .select('id')
      .eq('id', id)
      .single();
    
    if (checkError || !existingPattern) {
      return res.status(404).json({
        success: false,
        error: 'Patrón no encontrado'
      });
    }
    
    // Validar regex si se está actualizando
    if (pattern) {
      try {
        new RegExp(pattern, regex_flags || 'i');
      } catch (regexError) {
        return res.status(400).json({
          success: false,
          error: 'Patrón regex inválido',
          message: regexError.message
        });
      }
    }
    
    const userId = req.user.id;
    
    // Construir objeto de actualización solo con campos proporcionados
    const updateData = { updated_by: userId };
    if (country !== undefined) updateData.country = country;
    if (wallet_type !== undefined) updateData.wallet_type = wallet_type;
    if (pattern !== undefined) updateData.pattern = pattern;
    if (amount_group !== undefined) updateData.amount_group = amount_group;
    if (sender_group !== undefined) updateData.sender_group = sender_group;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (example !== undefined) updateData.example = example;
    if (priority !== undefined) updateData.priority = priority;
    if (currency !== undefined) updateData.currency = currency;
    if (regex_flags !== undefined) updateData.regex_flags = regex_flags;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    const { data: updatedPattern, error } = await supabase
      .from('notification_patterns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Patrón actualizado:', id);
    
    res.json({
      success: true,
      message: 'Patrón actualizado exitosamente',
      data: { pattern: updatedPattern }
    });
    
  } catch (error) {
    console.error('❌ Error en updateNotificationPattern:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar patrón',
      message: error.message
    });
  }
};

/**
 * Eliminar patrón de notificación
 * DELETE /api/admin/notification-patterns/:id
 */
const deleteNotificationPattern = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que existe
    const { data: existingPattern, error: checkError } = await supabase
      .from('notification_patterns')
      .select('id, name')
      .eq('id', id)
      .single();
    
    if (checkError || !existingPattern) {
      return res.status(404).json({
        success: false,
        error: 'Patrón no encontrado'
      });
    }
    
    const { error } = await supabase
      .from('notification_patterns')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    console.log('✅ Patrón eliminado:', id, existingPattern.name);
    
    res.json({
      success: true,
      message: 'Patrón eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error en deleteNotificationPattern:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar patrón',
      message: error.message
    });
  }
};

/**
 * Probar un patrón contra un texto de ejemplo
 * POST /api/admin/notification-patterns/test
 */
const testNotificationPattern = async (req, res) => {
  try {
    const { pattern, regex_flags, amount_group, sender_group, test_text } = req.body;
    
    if (!pattern || !test_text) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren campos: pattern, test_text'
      });
    }
    
    try {
      const regex = new RegExp(pattern, regex_flags || 'i');
      const match = test_text.match(regex);
      
      if (match) {
        const amountIdx = amount_group || 1;
        const senderIdx = sender_group || 2;
        
        res.json({
          success: true,
          data: {
            matched: true,
            amount: match[amountIdx] || null,
            sender: match[senderIdx] || null,
            full_match: match[0],
            groups: match.slice(1)
          }
        });
      } else {
        res.json({
          success: true,
          data: {
            matched: false,
            message: 'El patrón no coincide con el texto de prueba'
          }
        });
      }
    } catch (regexError) {
      return res.status(400).json({
        success: false,
        error: 'Patrón regex inválido',
        message: regexError.message
      });
    }
    
  } catch (error) {
    console.error('❌ Error en testNotificationPattern:', error);
    res.status(500).json({
      success: false,
      error: 'Error al probar patrón',
      message: error.message
    });
  }
};

/**
 * Obtener estadísticas de uso de patrones
 * GET /api/admin/notification-patterns/stats
 */
const getNotificationPatternStats = async (req, res) => {
  try {
    // Obtener resumen de patrones por país y tipo
    const { data: patterns, error: patternsError } = await supabase
      .from('notification_patterns')
      .select('country, wallet_type, is_active');
    
    if (patternsError) throw patternsError;
    
    // Obtener estadísticas de uso (últimos 30 días)
    const { data: logs, error: logsError } = await supabase
      .from('notification_parsing_logs')
      .select('pattern_id, success')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    // Agrupar estadísticas
    const stats = {
      total_patterns: patterns.length,
      active_patterns: patterns.filter(p => p.is_active).length,
      inactive_patterns: patterns.filter(p => !p.is_active).length,
      by_country: {},
      by_wallet: {},
      usage_last_30_days: logs ? logs.length : 0,
      success_rate: logs ? (logs.filter(l => l.success).length / logs.length * 100).toFixed(2) : 0
    };
    
    // Agrupar por país
    patterns.forEach(p => {
      stats.by_country[p.country] = (stats.by_country[p.country] || 0) + 1;
    });
    
    // Agrupar por billetera
    patterns.forEach(p => {
      stats.by_wallet[p.wallet_type] = (stats.by_wallet[p.wallet_type] || 0) + 1;
    });
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Error en getNotificationPatternStats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      message: error.message
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
  resetUserLimits,
  deleteOwner,
  createSuperAdmin,
  listSuperAdmins,
  // Patrones de notificación
  getNotificationPatterns,
  getNotificationPattern,
  createNotificationPattern,
  updateNotificationPattern,
  deleteNotificationPattern,
  testNotificationPattern,
  getNotificationPatternStats
};
