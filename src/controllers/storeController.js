// src/controllers/storeController.js
const { supabase } = require('../config/database');

/**
 * Obtener todas las tiendas del owner autenticado
 * GET /api/stores
 */
async function getStores(req, res) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    
    // Para workers, incluir datos del owner; para owners, solo datos de tienda
    const selectFields = role === 'worker' 
      ? `
        *,
        users:owner_id (
          id,
          full_name,
          phone
        )
      `
      : '*';
    
    let query = supabase
      .from('stores')
      .select(selectFields)
      .order('created_at', { ascending: false });
    
    // Si es owner, solo ver sus tiendas
    // Si es super_admin, ver todas
    if (role === 'owner') {
      query = query.eq('owner_id', userId);
    } else if (role === 'worker') {
      // Workers ven tiendas donde trabajan
      const { data: workerStores } = await supabase
        .from('workers')
        .select('store_id')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      const storeIds = workerStores?.map(w => w.store_id) || [];
      
      if (storeIds.length === 0) {
        return res.json({
          success: true,
          data: { stores: [] }
        });
      }
      
      query = query.in('id', storeIds);
    }
    
    const { data: stores, error } = await query;
    
    if (error) {
      console.error('Error al obtener tiendas:', error);
      throw error;
    }
    
    res.json({
      success: true,
      data: {
        stores: stores || [],
        count: stores?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Error en getStores:', error);
    res.status(500).json({
      error: 'Error al obtener tiendas',
      message: 'No se pudieron cargar las tiendas'
    });
  }
}

/**
 * Obtener una tienda por ID
 * GET /api/stores/:id
 */
async function getStoreById(req, res) {
  try {
    const storeId = req.params.id;
    const userId = req.user.userId;
    const role = req.user.role;
    
    const { data: store, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();
    
    if (error || !store) {
      return res.status(404).json({
        error: 'Tienda no encontrada'
      });
    }
    
    // Verificar permisos
    if (role === 'owner' && store.owner_id !== userId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para ver esta tienda'
      });
    }
    
    if (role === 'worker') {
      // Verificar que el worker trabaje en esta tienda
      const { data: worker } = await supabase
        .from('workers')
        .select('id')
        .eq('store_id', storeId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      
      if (!worker) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: 'No tienes permiso para ver esta tienda'
        });
      }
    }
    
    res.json({
      success: true,
      data: { store }
    });
    
  } catch (error) {
    console.error('Error en getStoreById:', error);
    res.status(500).json({
      error: 'Error al obtener tienda',
      message: 'No se pudo cargar la información de la tienda'
    });
  }
}

/**
 * Crear nueva tienda
 * POST /api/stores
 */
async function createStore(req, res) {
  try {
    const { name, description, address, phone } = req.body;
    const ownerId = req.user.userId;
    
    if (!name) {
      return res.status(400).json({
        error: 'Nombre requerido',
        message: 'El nombre de la tienda es requerido'
      });
    }
    
    const { data: store, error } = await supabase
      .from('stores')
      .insert({
        owner_id: ownerId,
        name,
        description,
        address,
        phone,
        is_active: true
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('Error al crear tienda:', error);
      throw error;
    }
    
    res.status(201).json({
      success: true,
      message: 'Tienda creada exitosamente',
      data: { store }
    });
    
  } catch (error) {
    console.error('Error en createStore:', error);
    res.status(500).json({
      error: 'Error al crear tienda',
      message: 'No se pudo crear la tienda'
    });
  }
}

/**
 * Actualizar tienda
 * PUT /api/stores/:id
 */
async function updateStore(req, res) {
  try {
    const storeId = req.params.id;
    const userId = req.user.userId;
    const role = req.user.role;
    const { name, description, address, phone, is_active } = req.body;
    
    // Verificar que la tienda existe
    const { data: store, error: fetchError } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', storeId)
      .single();
    
    if (fetchError || !store) {
      return res.status(404).json({
        error: 'Tienda no encontrada'
      });
    }
    
    // Verificar permisos (solo owner o super_admin)
    if (role === 'owner' && store.owner_id !== userId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para modificar esta tienda'
      });
    }
    
    // Preparar campos a actualizar
    const updates = {
      updated_at: new Date().toISOString()
    };
    
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (address !== undefined) updates.address = address;
    if (phone !== undefined) updates.phone = phone;
    if (is_active !== undefined) updates.is_active = is_active;
    
    const { data: updatedStore, error: updateError } = await supabase
      .from('stores')
      .update(updates)
      .eq('id', storeId)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('Error al actualizar tienda:', updateError);
      throw updateError;
    }
    
    res.json({
      success: true,
      message: 'Tienda actualizada exitosamente',
      data: { store: updatedStore }
    });
    
  } catch (error) {
    console.error('Error en updateStore:', error);
    res.status(500).json({
      error: 'Error al actualizar tienda',
      message: 'No se pudo actualizar la tienda'
    });
  }
}

/**
 * Eliminar tienda
 * DELETE /api/stores/:id
 */
async function deleteStore(req, res) {
  try {
    const storeId = req.params.id;
    const userId = req.user.userId;
    const role = req.user.role;
    
    // Verificar que la tienda existe
    const { data: store, error: fetchError } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', storeId)
      .single();
    
    if (fetchError || !store) {
      return res.status(404).json({
        error: 'Tienda no encontrada'
      });
    }
    
    // Verificar permisos
    if (role === 'owner' && store.owner_id !== userId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para eliminar esta tienda'
      });
    }
    
    // Eliminar tienda (cascade eliminará workers y notificaciones)
    const { error: deleteError } = await supabase
      .from('stores')
      .delete()
      .eq('id', storeId);
    
    if (deleteError) {
      console.error('Error al eliminar tienda:', deleteError);
      throw deleteError;
    }
    
    res.json({
      success: true,
      message: 'Tienda eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('Error en deleteStore:', error);
    res.status(500).json({
      error: 'Error al eliminar tienda',
      message: 'No se pudo eliminar la tienda'
    });
  }
}

/**
 * Obtener estadísticas de una tienda
 * GET /api/stores/:id/stats
 */
async function getStoreStats(req, res) {
  try {
    const storeId = req.params.id;
    const userId = req.user.userId;
    const role = req.user.role;
    
    // Verificar acceso a la tienda
    const { data: store } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', storeId)
      .single();
    
    if (!store) {
      return res.status(404).json({
        error: 'Tienda no encontrada'
      });
    }
    
    if (role === 'owner' && store.owner_id !== userId) {
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }
    
    // Obtener número de trabajadores
    const { count: workersCount } = await supabase
      .from('workers')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('is_active', true);
    
    // Obtener número de notificaciones del último mes
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: notificationsCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('created_at', thirtyDaysAgo.toISOString());
    
    // Obtener monto total del último mes
    const { data: notifications } = await supabase
      .from('notifications')
      .select('amount')
      .eq('store_id', storeId)
      .gte('created_at', thirtyDaysAgo.toISOString());
    
    const totalAmount = notifications?.reduce((sum, n) => sum + parseFloat(n.amount), 0) || 0;
    
    res.json({
      success: true,
      data: {
        stats: {
          workers: workersCount || 0,
          notifications_last_30_days: notificationsCount || 0,
          total_amount_last_30_days: totalAmount.toFixed(2)
        }
      }
    });
    
  } catch (error) {
    console.error('Error en getStoreStats:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      message: 'No se pudieron cargar las estadísticas de la tienda'
    });
  }
}

module.exports = {
  getStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  getStoreStats
};
