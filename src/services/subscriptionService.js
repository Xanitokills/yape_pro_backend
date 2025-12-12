/**
 * Servicio de Planes de Suscripción
 * Maneja la lógica de negocio relacionada con planes y límites
 */

const { supabase } = require('../config/database');

class SubscriptionService {
  /**
   * Obtener todos los planes activos
   */
  async getAllPlans() {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al obtener planes:', error);
      throw error;
    }
  }

  /**
   * Obtener información del plan del usuario
   */
  async getUserSubscription(userId) {
    try {
      const { data, error } = await supabase
        .from('user_subscription_info')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al obtener suscripción del usuario:', error);
      throw error;
    }
  }

  /**
   * Verificar si el usuario puede realizar una acción según su plan
   */
  async checkLimit(userId, limitType) {
    try {
      // Obtener conteo actual según el tipo
      let currentCount = 0;

      if (limitType === 'stores') {
        const { count, error } = await supabase
          .from('stores')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', userId)
          .eq('is_active', true);
        
        if (error) throw error;
        currentCount = count || 0;
      } else if (limitType === 'employees') {
        // Contar empleados en todas las tiendas del usuario
        const { data: stores, error: storesError } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', userId)
          .eq('is_active', true);
        
        if (storesError) throw storesError;
        
        const storeIds = stores.map(s => s.id);
        
        if (storeIds.length > 0) {
          const { count, error } = await supabase
            .from('workers')
            .select('*', { count: 'exact', head: true })
            .in('store_id', storeIds)
            .eq('is_active', true);
          
          if (error) throw error;
          currentCount = count || 0;
        }
      } else if (limitType === 'transactions') {
        // Obtener del tracking
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;
        
        const { data, error } = await supabase
          .from('usage_tracking')
          .select('transactions_count')
          .eq('user_id', userId)
          .eq('year', year)
          .eq('month', month)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        currentCount = data?.transactions_count || 0;
      }

      // Llamar a la función SQL para verificar el límite
      const { data, error } = await supabase
        .rpc('check_plan_limit', {
          p_user_id: userId,
          p_limit_type: limitType,
          p_current_count: currentCount
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error al verificar límite ${limitType}:`, error);
      throw error;
    }
  }

  /**
   * Incrementar contador de uso
   */
  async incrementUsage(userId, counterType, increment = 1) {
    try {
      const { error } = await supabase
        .rpc('increment_usage', {
          p_user_id: userId,
          p_counter_type: counterType,
          p_increment: increment
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error al incrementar ${counterType}:`, error);
      throw error;
    }
  }

  /**
   * Cambiar plan de usuario
   */
  async changePlan(userId, newPlanId, notes = null) {
    try {
      // Obtener plan actual
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('subscription_plan_id')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const previousPlanId = currentUser.subscription_plan_id;

      // Determinar tipo de cambio
      const planOrder = { 'free': 1, 'professional': 2, 'enterprise': 3 };
      let action = 'renew';
      
      if (planOrder[newPlanId] > planOrder[previousPlanId]) {
        action = 'upgrade';
      } else if (planOrder[newPlanId] < planOrder[previousPlanId]) {
        action = 'downgrade';
      }

      // Actualizar plan del usuario
      const { error: updateError } = await supabase
        .from('users')
        .update({
          subscription_plan_id: newPlanId,
          subscription_started_at: new Date().toISOString(),
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Registrar en historial
      const { error: historyError } = await supabase
        .from('subscription_history')
        .insert({
          user_id: userId,
          plan_id: newPlanId,
          action: action,
          previous_plan_id: previousPlanId,
          notes: notes
        });

      if (historyError) throw historyError;

      return {
        success: true,
        action: action,
        previousPlan: previousPlanId,
        newPlan: newPlanId
      };
    } catch (error) {
      console.error('Error al cambiar plan:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de uso del usuario
   */
  async getUsageStats(userId) {
    try {
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;

      // Obtener tracking del mes actual para transacciones
      const { data: usage, error: usageError } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year)
        .eq('month', month)
        .single();

      if (usageError && usageError.code !== 'PGRST116') throw usageError;

      // Obtener conteo REAL de tiendas activas
      const { count: storesCount, error: storesError } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .eq('is_active', true);

      if (storesError) throw storesError;

      // Obtener conteo REAL de empleados activos
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', userId)
        .eq('is_active', true);

      const storeIds = stores?.map(s => s.id) || [];
      let employeesCount = 0;

      if (storeIds.length > 0) {
        const { count, error: workersError } = await supabase
          .from('workers')
          .select('*', { count: 'exact', head: true })
          .in('store_id', storeIds)
          .eq('is_active', true);

        if (workersError) throw workersError;
        employeesCount = count || 0;
      }

      // Obtener límites del plan
      const subscription = await this.getUserSubscription(userId);

      return {
        current: {
          transactions: usage?.transactions_count || 0,
          stores: storesCount || 0,
          employees: employeesCount
        },
        limits: {
          transactions: subscription.max_transactions_monthly,
          stores: subscription.max_stores,
          employees: subscription.max_employees
        },
        plan: {
          id: subscription.subscription_plan_id,
          name: subscription.plan_name,
          status: subscription.subscription_status
        }
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }

  /**
   * Validar si puede crear una tienda
   */
  async canCreateStore(userId) {
    return await this.checkLimit(userId, 'stores');
  }

  /**
   * Validar si puede agregar un empleado
   */
  async canAddEmployee(userId) {
    return await this.checkLimit(userId, 'employees');
  }

  /**
   * Validar si puede registrar una transacción
   */
  async canCreateTransaction(userId) {
    return await this.checkLimit(userId, 'transactions');
  }

  /**
   * Registrar uso de transacción
   */
  async recordTransaction(userId) {
    // Verificar límite primero
    const canCreate = await this.canCreateTransaction(userId);
    
    if (!canCreate.allowed) {
      throw new Error(`Límite de transacciones alcanzado. Límite: ${canCreate.limit}, Actual: ${canCreate.current}`);
    }

    // Incrementar contador
    await this.incrementUsage(userId, 'transactions', 1);
    
    return true;
  }
}

module.exports = new SubscriptionService();
