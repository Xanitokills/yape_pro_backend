// src/controllers/couponsController.js
const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

/**
 * Crear un nuevo cupón
 */
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxUses,
      storeId,
      validFrom,
      validUntil,
      minPurchaseAmount
    } = req.body;

    const userId = req.user.id;

    // Validaciones básicas
    if (!code || !discountType || !discountValue || !maxUses) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: code, discountType, discountValue, maxUses'
      });
    }

    // Validar tipo de descuento
    if (!['percentage', 'fixed'].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: 'discountType debe ser "percentage" o "fixed"'
      });
    }

    // Validar valor de descuento
    if (discountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'discountValue debe ser mayor a 0'
      });
    }

    // Validar porcentaje no mayor a 100
    if (discountType === 'percentage' && discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: 'El porcentaje no puede ser mayor a 100'
      });
    }

    // Verificar si el código ya existe
    const { data: existingCoupon } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', code.toUpperCase())
      .single();

    if (existingCoupon) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un cupón con ese código'
      });
    }

    // Verificar permisos de tienda si se especifica
    if (storeId) {
      const { data: store } = await supabase
        .from('stores')
        .select('owner_id')
        .eq('id', storeId)
        .single();

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Tienda no encontrada'
        });
      }

      // Solo el owner o super_admin pueden crear cupones para una tienda específica
      if (req.user.role !== 'super_admin' && store.owner_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para crear cupones en esta tienda'
        });
      }
    }

    // Crear cupón
    const { data: newCoupon, error } = await supabase
      .from('coupons')
      .insert([{
        code: code.toUpperCase(),
        description,
        discount_type: discountType,
        discount_value: discountValue,
        max_uses: maxUses,
        store_id: storeId || null,
        valid_from: validFrom || new Date().toISOString(),
        valid_until: validUntil || null,
        min_purchase_amount: minPurchaseAmount || 0,
        created_by: userId,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Cupón creado exitosamente',
      data: newCoupon
    });

  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear cupón',
      error: error.message
    });
  }
};

/**
 * Obtener todos los cupones (con filtros)
 */
const getCoupons = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { storeId, isActive, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('coupons')
      .select(`
        *,
        stores:store_id(id, name),
        users:created_by(id, full_name)
      `, { count: 'exact' });

    // Si no es super_admin, filtrar por tiendas del usuario
    if (userRole !== 'super_admin') {
      if (userRole === 'owner') {
        const { data: userStores } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', userId);

        const storeIds = userStores.map(s => s.id);
        query = query.or(`store_id.in.(${storeIds.join(',')}),store_id.is.null`);
      } else {
        // Workers solo ven cupones de su tienda
        const { data: workerStores } = await supabase
          .from('workers')
          .select('store_id')
          .eq('user_id', userId)
          .eq('is_active', true);

        const storeIds = workerStores.map(w => w.store_id);
        query = query.or(`store_id.in.(${storeIds.join(',')}),store_id.is.null`);
      }
    }

    // Aplicar filtros adicionales
    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true');
    }

    // Paginación
    const offset = (page - 1) * limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: coupons, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: coupons,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cupones',
      error: error.message
    });
  }
};

/**
 * Obtener un cupón por ID
 */
const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select(`
        *,
        stores:store_id(id, name),
        users:created_by(id, full_name)
      `)
      .eq('id', id)
      .single();

    if (error || !coupon) {
      return res.status(404).json({
        success: false,
        message: 'Cupón no encontrado'
      });
    }

    res.json({
      success: true,
      data: coupon
    });

  } catch (error) {
    console.error('Error fetching coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cupón',
      error: error.message
    });
  }
};

/**
 * Actualizar un cupón
 */
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const {
      description,
      discountType,
      discountValue,
      maxUses,
      validFrom,
      validUntil,
      minPurchaseAmount,
      isActive
    } = req.body;

    // Obtener cupón actual
    const { data: currentCoupon, error: fetchError } = await supabase
      .from('coupons')
      .select('*, stores:store_id(owner_id)')
      .eq('id', id)
      .single();

    if (fetchError || !currentCoupon) {
      return res.status(404).json({
        success: false,
        message: 'Cupón no encontrado'
      });
    }

    // Verificar permisos
    if (userRole !== 'super_admin') {
      if (currentCoupon.store_id && currentCoupon.stores?.owner_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para editar este cupón'
        });
      }
    }

    // Construir objeto de actualización
    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (discountType !== undefined) updateData.discount_type = discountType;
    if (discountValue !== undefined) updateData.discount_value = discountValue;
    if (maxUses !== undefined) updateData.max_uses = maxUses;
    if (validFrom !== undefined) updateData.valid_from = validFrom;
    if (validUntil !== undefined) updateData.valid_until = validUntil;
    if (minPurchaseAmount !== undefined) updateData.min_purchase_amount = minPurchaseAmount;
    if (isActive !== undefined) updateData.is_active = isActive;

    // Actualizar cupón
    const { data: updatedCoupon, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Cupón actualizado exitosamente',
      data: updatedCoupon
    });

  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cupón',
      error: error.message
    });
  }
};

/**
 * Eliminar un cupón
 */
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Obtener cupón actual
    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('*, stores:store_id(owner_id)')
      .eq('id', id)
      .single();

    if (fetchError || !coupon) {
      return res.status(404).json({
        success: false,
        message: 'Cupón no encontrado'
      });
    }

    // Verificar permisos
    if (userRole !== 'super_admin') {
      if (coupon.store_id && coupon.stores?.owner_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar este cupón'
        });
      }
    }

    // Eliminar cupón
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Cupón eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cupón',
      error: error.message
    });
  }
};

/**
 * Validar un cupón antes de aplicarlo
 */
const validateCoupon = async (req, res) => {
  try {
    const { code, storeId, amount } = req.body;

    if (!code || !storeId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: code, storeId, amount'
      });
    }

    // Usar la función SQL para validar
    const { data, error } = await supabase
      .rpc('is_coupon_valid', {
        p_code: code.toUpperCase(),
        p_store_id: storeId,
        p_amount: amount
      });

    if (error) throw error;

    const validation = data[0];

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: validation.message
      });
    }

    // Calcular el descuento
    let discountAmount = 0;
    if (validation.discount_type === 'percentage') {
      discountAmount = (amount * validation.discount_value) / 100;
    } else {
      discountAmount = validation.discount_value;
    }

    const finalAmount = Math.max(0, amount - discountAmount);

    res.json({
      success: true,
      valid: true,
      message: 'Cupón válido',
      data: {
        couponId: validation.coupon_id,
        discountType: validation.discount_type,
        discountValue: validation.discount_value,
        originalAmount: amount,
        discountAmount: discountAmount.toFixed(2),
        finalAmount: finalAmount.toFixed(2)
      }
    });

  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar cupón',
      error: error.message
    });
  }
};

/**
 * Aplicar un cupón a una transacción
 */
const applyCoupon = async (req, res) => {
  try {
    const { code, storeId, amount, notificationId } = req.body;
    const userId = req.user?.id || null;

    if (!code || !storeId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: code, storeId, amount'
      });
    }

    // Validar cupón primero
    const { data: validationData, error: validationError } = await supabase
      .rpc('is_coupon_valid', {
        p_code: code.toUpperCase(),
        p_store_id: storeId,
        p_amount: amount
      });

    if (validationError) throw validationError;

    const validation = validationData[0];

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // Calcular descuento
    let discountAmount = 0;
    if (validation.discount_type === 'percentage') {
      discountAmount = (amount * validation.discount_value) / 100;
    } else {
      discountAmount = validation.discount_value;
    }

    const finalAmount = Math.max(0, amount - discountAmount);

    // Registrar uso del cupón
    const { data: usage, error: usageError } = await supabase
      .from('coupon_usage')
      .insert([{
        coupon_id: validation.coupon_id,
        notification_id: notificationId || null,
        store_id: storeId,
        user_id: userId,
        original_amount: amount,
        discount_amount: discountAmount,
        final_amount: finalAmount
      }])
      .select()
      .single();

    if (usageError) throw usageError;

    // Incrementar contador de usos
    const { error: updateError } = await supabase
      .from('coupons')
      .update({ used_count: supabase.raw('used_count + 1') })
      .eq('id', validation.coupon_id);

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: 'Cupón aplicado exitosamente',
      data: {
        usageId: usage.id,
        couponId: validation.coupon_id,
        originalAmount: amount,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        finalAmount: parseFloat(finalAmount.toFixed(2)),
        discountType: validation.discount_type,
        discountValue: validation.discount_value
      }
    });

  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aplicar cupón',
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas de cupones
 */
const getCouponStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { storeId } = req.query;

    let query = supabase
      .from('coupon_stats')
      .select('*');

    // Filtrar por permisos
    if (userRole !== 'super_admin') {
      if (userRole === 'owner') {
        const { data: userStores } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', userId);

        const storeIds = userStores.map(s => s.id);
        query = query.or(`store_id.in.(${storeIds.join(',')}),store_id.is.null`);
      } else {
        const { data: workerStores } = await supabase
          .from('workers')
          .select('store_id')
          .eq('user_id', userId)
          .eq('is_active', true);

        const storeIds = workerStores.map(w => w.store_id);
        query = query.or(`store_id.in.(${storeIds.join(',')}),store_id.is.null`);
      }
    }

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data: stats, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching coupon stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

/**
 * Obtener historial de uso de un cupón
 */
const getCouponUsageHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const { data: history, error, count } = await supabase
      .from('coupon_usage')
      .select(`
        *,
        stores:store_id(id, name),
        users:user_id(id, full_name),
        notifications:notification_id(id, amount, sender_name)
      `, { count: 'exact' })
      .eq('coupon_id', id)
      .order('used_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: history,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching coupon usage history:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial',
      error: error.message
    });
  }
};

module.exports = {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon,
  getCouponStats,
  getCouponUsageHistory
};
