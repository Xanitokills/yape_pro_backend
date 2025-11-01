// src/controllers/workerController.js
const { supabase } = require('../config/database');

/**
 * Obtener todos los trabajadores de una tienda
 * GET /api/workers?store_id=xxx
 */
async function getWorkers(req, res) {
  try {
    const { store_id } = req.query;
    const userId = req.user.userId;
    const role = req.user.role;
    
    if (!store_id) {
      return res.status(400).json({
        error: 'store_id requerido',
        message: 'Debes proporcionar el ID de la tienda'
      });
    }
    
    // Verificar que el usuario tiene acceso a esta tienda
    const { data: store } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', store_id)
      .single();
    
    if (!store) {
      return res.status(404).json({
        error: 'Tienda no encontrada'
      });
    }
    
    // Verificar permisos
    if (role === 'owner' && store.owner_id !== userId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para ver los trabajadores de esta tienda'
      });
    }
    
    // Obtener trabajadores con información del usuario
    const { data: workers, error } = await supabase
      .from('workers')
      .select(`
        id,
        position,
        is_active,
        created_at,
        users:user_id (
          id,
          email,
          full_name,
          phone
        )
      `)
      .eq('store_id', store_id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error al obtener trabajadores:', error);
      throw error;
    }
    
    res.json({
      success: true,
      data: {
        workers: workers || [],
        count: workers?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Error en getWorkers:', error);
    res.status(500).json({
      error: 'Error al obtener trabajadores',
      message: 'No se pudieron cargar los trabajadores'
    });
  }
}

/**
 * Agregar trabajador a una tienda
 * POST /api/workers
 */
async function addWorker(req, res) {
  try {
    const { store_id, user_id, position } = req.body;
    const ownerId = req.user.userId;
    const role = req.user.role;
    
    if (!store_id || !user_id) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'store_id y user_id son requeridos'
      });
    }
    
    // Verificar que la tienda existe y pertenece al owner
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', store_id)
      .single();
    
    if (storeError || !store) {
      return res.status(404).json({
        error: 'Tienda no encontrada'
      });
    }
    
    if (role === 'owner' && store.owner_id !== ownerId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para agregar trabajadores a esta tienda'
      });
    }
    
    // Verificar que el usuario existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', user_id)
      .single();
    
    if (userError || !user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'El usuario que intentas agregar no existe'
      });
    }
    
    // Verificar que el usuario no es owner de otra tienda (opcional)
    if (user.role === 'owner') {
      return res.status(400).json({
        error: 'Usuario inválido',
        message: 'No puedes agregar a un dueño de tienda como trabajador'
      });
    }
    
    // Verificar si ya existe la relación
    const { data: existing } = await supabase
      .from('workers')
      .select('id, is_active')
      .eq('store_id', store_id)
      .eq('user_id', user_id)
      .single();
    
    if (existing) {
      if (existing.is_active) {
        return res.status(409).json({
          error: 'Trabajador ya existe',
          message: 'Este usuario ya es trabajador de esta tienda'
        });
      } else {
        // Reactivar trabajador
        const { data: worker, error: updateError } = await supabase
          .from('workers')
          .update({ is_active: true, position })
          .eq('id', existing.id)
          .select('*')
          .single();
        
        if (updateError) throw updateError;
        
        return res.json({
          success: true,
          message: 'Trabajador reactivado exitosamente',
          data: { worker }
        });
      }
    }
    
    // Crear nueva relación worker
    const { data: worker, error: createError } = await supabase
      .from('workers')
      .insert({
        store_id,
        user_id,
        position,
        is_active: true
      })
      .select('*')
      .single();
    
    if (createError) {
      console.error('Error al crear trabajador:', createError);
      throw createError;
    }
    
    res.status(201).json({
      success: true,
      message: 'Trabajador agregado exitosamente',
      data: { worker }
    });
    
  } catch (error) {
    console.error('Error en addWorker:', error);
    res.status(500).json({
      error: 'Error al agregar trabajador',
      message: 'No se pudo agregar el trabajador a la tienda'
    });
  }
}

/**
 * Actualizar información de un trabajador
 * PUT /api/workers/:id
 */
async function updateWorker(req, res) {
  try {
    const workerId = req.params.id;
    const { position, is_active } = req.body;
    const userId = req.user.userId;
    const role = req.user.role;
    
    // Obtener trabajador y verificar permisos
    const { data: worker, error: fetchError } = await supabase
      .from('workers')
      .select('store_id, stores(owner_id)')
      .eq('id', workerId)
      .single();
    
    if (fetchError || !worker) {
      return res.status(404).json({
        error: 'Trabajador no encontrado'
      });
    }
    
    if (role === 'owner' && worker.stores.owner_id !== userId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para modificar este trabajador'
      });
    }
    
    // Actualizar
    const updates = {};
    if (position !== undefined) updates.position = position;
    if (is_active !== undefined) updates.is_active = is_active;
    
    const { data: updatedWorker, error: updateError } = await supabase
      .from('workers')
      .update(updates)
      .eq('id', workerId)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('Error al actualizar trabajador:', updateError);
      throw updateError;
    }
    
    res.json({
      success: true,
      message: 'Trabajador actualizado exitosamente',
      data: { worker: updatedWorker }
    });
    
  } catch (error) {
    console.error('Error en updateWorker:', error);
    res.status(500).json({
      error: 'Error al actualizar trabajador',
      message: 'No se pudo actualizar la información del trabajador'
    });
  }
}

/**
 * Eliminar trabajador de una tienda
 * DELETE /api/workers/:id
 */
async function removeWorker(req, res) {
  try {
    const workerId = req.params.id;
    const userId = req.user.userId;
    const role = req.user.role;
    
    // Obtener trabajador y verificar permisos
    const { data: worker, error: fetchError } = await supabase
      .from('workers')
      .select('store_id, stores(owner_id)')
      .eq('id', workerId)
      .single();
    
    if (fetchError || !worker) {
      return res.status(404).json({
        error: 'Trabajador no encontrado'
      });
    }
    
    if (role === 'owner' && worker.stores.owner_id !== userId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para eliminar este trabajador'
      });
    }
    
    // Eliminar (o desactivar)
    // Opción 1: Eliminar completamente
    const { error: deleteError } = await supabase
      .from('workers')
      .delete()
      .eq('id', workerId);
    
    // Opción 2: Solo desactivar (comentar líneas anteriores y usar esto)
    // const { error: deleteError } = await supabase
    //   .from('workers')
    //   .update({ is_active: false })
    //   .eq('id', workerId);
    
    if (deleteError) {
      console.error('Error al eliminar trabajador:', deleteError);
      throw deleteError;
    }
    
    res.json({
      success: true,
      message: 'Trabajador eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error en removeWorker:', error);
    res.status(500).json({
      error: 'Error al eliminar trabajador',
      message: 'No se pudo eliminar el trabajador'
    });
  }
}

/**
 * Buscar usuarios para agregar como trabajadores
 * GET /api/workers/search?email=xxx
 */
async function searchUsers(req, res) {
  try {
    const { email, full_name } = req.query;
    
    if (!email && !full_name) {
      return res.status(400).json({
        error: 'Parámetro requerido',
        message: 'Debes proporcionar email o full_name para buscar'
      });
    }
    
    let query = supabase
      .from('users')
      .select('id, email, full_name, phone, role')
      .eq('is_active', true)
      .limit(10);
    
    if (email) {
      query = query.ilike('email', `%${email}%`);
    }
    
    if (full_name) {
      query = query.ilike('full_name', `%${full_name}%`);
    }
    
    const { data: users, error } = await query;
    
    if (error) {
      console.error('Error al buscar usuarios:', error);
      throw error;
    }
    
    res.json({
      success: true,
      data: {
        users: users || [],
        count: users?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Error en searchUsers:', error);
    res.status(500).json({
      error: 'Error al buscar usuarios',
      message: 'No se pudieron buscar los usuarios'
    });
  }
}

module.exports = {
  getWorkers,
  addWorker,
  updateWorker,
  removeWorker,
  searchUsers
};
