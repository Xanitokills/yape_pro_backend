// src/controllers/workerController.js
const { supabase } = require('../config/database');

/**
 * Generar código de invitación único (formato: YP-XXXXXX)
 */
function generateInvitationCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin letras/números confusos
  let code = 'YP-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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
    
    // Obtener trabajadores con información del usuario (o datos temporales)
    const { data: workers, error } = await supabase
      .from('workers')
      .select(`
        id,
        position,
        is_active,
        created_at,
        temp_full_name,
        temp_phone,
        invitation_code,
        registration_status,
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
    
    // Transformar datos: usar temp_* si no hay usuario, o datos de usuario si existe
    const transformedWorkers = workers?.map(worker => {
      // Si tiene usuario (registration_status = 'completed'), usar datos de usuario
      if (worker.users && worker.registration_status === 'completed') {
        return {
          id: worker.id,
          position: worker.position,
          is_active: worker.is_active,
          created_at: worker.created_at,
          registration_status: worker.registration_status,
          users: worker.users
        };
      } 
      // Si es pendiente, crear objeto users con datos temporales
      else {
        return {
          id: worker.id,
          position: worker.position,
          is_active: worker.is_active,
          created_at: worker.created_at,
          registration_status: worker.registration_status,
          invitation_code: worker.invitation_code,
          users: {
            id: null,
            email: null,
            full_name: worker.temp_full_name,
            phone: worker.temp_phone
          }
        };
      }
    }) || [];
    
    res.json({
      success: true,
      data: {
        workers: transformedWorkers,
        count: transformedWorkers.length
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
 * Agregar trabajador a una tienda (NUEVO FLUJO - Sin crear usuario)
 * POST /api/workers
 * Body: { store_id, full_name, phone, position? }
 * Crea worker pendiente con código de invitación
 */
async function addWorker(req, res) {
  try {
    const { store_id, full_name, phone, position } = req.body;
    const ownerId = req.user.userId;
    const role = req.user.role;
    
    if (!store_id || !full_name || !phone) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'store_id, full_name y phone son requeridos'
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
    
    // Verificar si ya existe un worker con ese teléfono en CUALQUIER tienda
    const { data: existingWorkers, error: checkError } = await supabase
      .from('workers')
      .select('id, store_id, is_active, registration_status')
      .eq('temp_phone', phone)
      .in('registration_status', ['pending', 'completed']);
    
    console.log('🔍 Verificando teléfono:', phone);
    console.log('🔍 Workers encontrados:', existingWorkers);
    
    if (existingWorkers && existingWorkers.length > 0) {
      const existingWorkerAnyStore = existingWorkers[0];
      
      // Si está en otra tienda
      if (existingWorkerAnyStore.store_id !== store_id) {
        console.log('❌ Teléfono ya registrado en otra tienda:', existingWorkerAnyStore.store_id);
        return res.status(409).json({
          error: 'Trabajador ya registrado',
          message: 'Este número de teléfono ya está registrado como trabajador en otra tienda'
        });
      }
      
      // Si está en la misma tienda
      if (existingWorkerAnyStore.registration_status === 'pending') {
        return res.status(409).json({
          error: 'Trabajador ya existe',
          message: 'Ya existe un trabajador pendiente de registro con este teléfono'
        });
      } else if (existingWorkerAnyStore.is_active) {
        return res.status(409).json({
          error: 'Trabajador ya existe',
          message: 'Este trabajador ya está registrado en esta tienda'
        });
      }
    }
    
    // También verificar en la tabla users si ya existe un usuario con rol worker con ese teléfono
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('phone', phone)
      .eq('role', 'worker')
      .limit(1)
      .single();
    
    if (existingUser) {
      return res.status(409).json({
        error: 'Trabajador ya registrado',
        message: 'Ya existe un usuario trabajador con este número de teléfono'
      });
    }
    
    // Generar código de invitación único
    const invitationCode = generateInvitationCode();
    
    console.log('✅ Código de invitación generado:', invitationCode);
    console.log('📝 Creando trabajador pendiente:', { full_name, phone, position });
    
    // Crear worker PENDIENTE (sin user_id aún)
    const { data: worker, error: createError } = await supabase
      .from('workers')
      .insert({
        store_id,
        user_id: null, // Sin usuario aún
        temp_full_name: full_name,
        temp_phone: phone,
        position: position || null,
        is_active: true,
        invitation_code: invitationCode,
        registration_status: 'pending'
      })
      .select('*')
      .single();
    
    if (createError) {
      console.error('❌ Error al crear trabajador:', createError);
      throw createError;
    }
    
    console.log('✅ Trabajador creado exitosamente:', worker.id);
    
    res.status(201).json({
      success: true,
      message: 'Trabajador agregado exitosamente. Comparte el código de invitación.',
      data: { 
        worker: {
          id: worker.id,
          full_name: worker.temp_full_name,
          phone: worker.temp_phone,
          position: worker.position,
          invitation_code: worker.invitation_code,
          registration_status: worker.registration_status
        },
        invitation_code: invitationCode
      }
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
    
    console.log(`🗑️ Intentando eliminar trabajador ${workerId} por usuario ${userId} (rol: ${role})`);
    
    // Obtener trabajador y verificar permisos
    const { data: worker, error: fetchError } = await supabase
      .from('workers')
      .select('id, store_id, user_id, stores(owner_id, name)')
      .eq('id', workerId)
      .single();
    
    if (fetchError || !worker) {
      console.log(`❌ Trabajador ${workerId} no encontrado:`, fetchError);
      return res.status(404).json({
        error: 'Trabajador no encontrado'
      });
    }
    
    console.log(`📊 Trabajador encontrado:`, {
      workerId: worker.id,
      storeId: worker.store_id,
      storeName: worker.stores?.name,
      userId: worker.user_id,
      ownerId: worker.stores?.owner_id
    });
    
    if (role === 'owner' && worker.stores.owner_id !== userId) {
      console.log(`❌ Acceso denegado: Owner ${userId} no es dueño de tienda ${worker.store_id}`);
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para eliminar este trabajador'
      });
    }

    const workerUserId = worker.user_id;

    // Eliminar primero de la tabla workers
    const { data: deletedData, error: deleteError } = await supabase
      .from('workers')
      .delete()
      .eq('id', workerId)
      .select();
    
    if (deleteError) {
      console.error('❌ Error al eliminar trabajador:', deleteError);
      throw deleteError;
    }
    
    console.log(`✅ Worker eliminado de tabla workers`);
    
    // Verificar que realmente se eliminó
    if (!deletedData || deletedData.length === 0) {
      console.log(`⚠️ No se eliminó ningún registro - posible problema de RLS`);
      
      const { data: stillExists } = await supabase
        .from('workers')
        .select('id')
        .eq('id', workerId)
        .single();
      
      if (stillExists) {
        console.log(`❌ El trabajador ${workerId} aún existe en la base de datos`);
        return res.status(500).json({
          success: false,
          error: 'No se pudo eliminar el trabajador',
          message: 'La eliminación no se completó. Puede ser un problema de permisos en la base de datos.'
        });
      }
    }

    // Ahora eliminar el usuario completamente
    console.log(`🗑️ Eliminando usuario ${workerUserId} del sistema...`);
    
    // Eliminar FCM tokens del usuario
    await supabase
      .from('fcm_tokens')
      .delete()
      .eq('user_id', workerUserId);

    // Eliminar refresh tokens del usuario
    await supabase
      .from('refresh_tokens')
      .delete()
      .eq('user_id', workerUserId);

    // Eliminar el usuario
    const { error: userDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', workerUserId);

    if (userDeleteError) {
      console.error('⚠️ Error al eliminar usuario:', userDeleteError);
      // No fallar si el usuario no se puede eliminar, ya eliminamos la relación worker
    } else {
      console.log(`✅ Usuario ${workerUserId} eliminado completamente del sistema`);
    }
    
    console.log(`✅ Trabajador ${workerId} y usuario eliminados exitosamente`);
    
    res.json({
      success: true,
      message: 'Trabajador eliminado exitosamente',
      data: {
        deletedWorkerId: workerId,
        userId: worker.user_id
      }
    });
    
  } catch (error) {
    console.error('❌ Error en removeWorker:', error);
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
