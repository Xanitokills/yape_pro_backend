// src/controllers/couponsController.js
const { supabase } = require('../config/database');

/**
 * Crear un nuevo cupón
 */
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      couponType,
      discountType,
      discountValue,
      transactionBonus,
      maxUses,
      storeId,
      validFrom,
      validUntil,
      minPurchaseAmount
    } = req.body;

    const userId = req.user.id;

    // Validaciones básicas
    if (!code || !couponType || !maxUses) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: code, couponType, maxUses'
      });
    }

    // Validar tipo de cupón
    if (!['discount', 'transactions'].includes(couponType)) {
      return res.status(400).json({
        success: false,
        message: 'couponType debe ser "discount" o "transactions"'
      });
    }

    // Validaciones específicas para cupones de descuento
    if (couponType === 'discount') {
      if (!discountType || !discountValue) {
        return res.status(400).json({
          success: false,
          message: 'Para cupones de descuento se requiere discountType y discountValue'
        });
      }

      if (!['percentage', 'fixed'].includes(discountType)) {
        return res.status(400).json({
          success: false,
          message: 'discountType debe ser "percentage" o "fixed"'
        });
      }

      if (discountValue <= 0) {
        return res.status(400).json({
          success: false,
          message: 'discountValue debe ser mayor a 0'
        });
      }

      if (discountType === 'percentage' && discountValue > 100) {
        return res.status(400).json({
          success: false,
          message: 'El porcentaje no puede ser mayor a 100'
        });
      }
    }

    // Validaciones específicas para cupones de transacciones
    if (couponType === 'transactions') {
      if (!transactionBonus || transactionBonus <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Para cupones de transacciones se requiere transactionBonus mayor a 0'
        });
      }
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
    const couponData = {
      code: code.toUpperCase(),
      description,
      coupon_type: couponType,
      max_uses: maxUses,
      store_id: storeId || null,
      valid_from: validFrom || new Date().toISOString(),
      valid_until: validUntil,
      min_purchase_amount: minPurchaseAmount || 0,
      created_by: userId
    };

    // Agregar campos específicos según el tipo de cupón
    if (couponType === 'discount') {
      couponData.discount_type = discountType;
      couponData.discount_value = discountValue;
    } else if (couponType === 'transactions') {
      couponData.transaction_bonus = transactionBonus;
    }

    const { data: newCoupon, error } = await supabase
      .from('coupons')
      .insert([couponData])
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
      data: coupons || [],
      pagination: {
        total: count || 0,
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
      couponType,
      discountType,
      discountValue,
      transactionBonus,
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
    if (couponType !== undefined) {
      updateData.coupon_type = couponType;
      
      // Limpiar campos según el tipo
      if (couponType === 'discount') {
        if (discountType !== undefined) updateData.discount_type = discountType;
        if (discountValue !== undefined) updateData.discount_value = discountValue;
        updateData.transaction_bonus = null;
      } else if (couponType === 'transactions') {
        if (transactionBonus !== undefined) updateData.transaction_bonus = transactionBonus;
        updateData.discount_type = null;
        updateData.discount_value = null;
        updateData.min_purchase_amount = 0;
      }
    } else {
      // Si no se cambia el tipo, actualizar campos individuales
      if (discountType !== undefined) updateData.discount_type = discountType;
      if (discountValue !== undefined) updateData.discount_value = discountValue;
      if (transactionBonus !== undefined) updateData.transaction_bonus = transactionBonus;
    }
    
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

    console.log('🎫 Validando cupón:', { code, storeId, amount });

    if (!code) {
      console.log('❌ Falta código de cupón');
      return res.status(400).json({
        success: false,
        message: 'El código del cupón es requerido'
      });
    }

    // Buscar el cupón
    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    console.log('📋 Cupón encontrado:', coupon ? 'SÍ' : 'NO', fetchError ? `Error: ${fetchError.message}` : '');

    console.log('📋 Cupón encontrado:', coupon ? 'SÍ' : 'NO', fetchError ? `Error: ${fetchError.message}` : '');

    if (fetchError || !coupon) {
      console.log('❌ Cupón no encontrado o inactivo');
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Cupón no encontrado o inactivo'
      });
    }

    console.log('📊 Datos del cupón:', {
      code: coupon.code,
      type: coupon.coupon_type,
      used: `${coupon.used_count}/${coupon.max_uses}`,
      validFrom: coupon.valid_from,
      validUntil: coupon.valid_until
    });

    // Validar fechas
    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

    if (now < validFrom) {
      console.log('❌ Cupón aún no es válido');
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Este cupón aún no es válido'
      });
    }

    if (validUntil && now > validUntil) {
      console.log('❌ Cupón expirado');
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Este cupón ha expirado'
      });
    }

    // Validar usos
    if (coupon.used_count >= coupon.max_uses) {
      console.log('❌ Cupón sin usos disponibles');
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Este cupón ha alcanzado su límite de usos'
      });
    }

    // Validar tienda específica si aplica
    if (storeId && coupon.store_id && coupon.store_id !== storeId) {
      console.log('❌ Cupón no válido para esta tienda');
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Este cupón no es válido para esta tienda'
      });
    }

    // Validar compra mínima para cupones de descuento
    if (coupon.coupon_type === 'discount' && amount && amount < coupon.min_purchase_amount) {
      console.log('❌ No cumple compra mínima');
      return res.status(400).json({
        success: false,
        valid: false,
        message: `Compra mínima requerida: S/ ${coupon.min_purchase_amount}`
      });
    }

    console.log('✅ Cupón válido');

    // Calcular descuento si se proporciona amount y es cupón de descuento
    let response = {
      success: true,
      valid: true,
      message: 'Cupón válido',
      data: {
        coupon: coupon
      }
    };

    if (coupon.coupon_type === 'discount' && amount) {
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (amount * coupon.discount_value) / 100;
      } else {
        discountAmount = coupon.discount_value;
      }

      const finalAmount = Math.max(0, amount - discountAmount);

      response.data.breakdown = {
        originalAmount: amount,
        discountAmount: discountAmount.toFixed(2),
        finalAmount: finalAmount.toFixed(2)
      };
    }

    res.json(response);

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

    // code y storeId son siempre requeridos
    if (!code || !storeId) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: code, storeId'
      });
    }

    console.log('🎫 Aplicando cupón:', { code, storeId, amount, userId });

    // Buscar el cupón
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (couponError || !coupon) {
      return res.status(404).json({
        success: false,
        message: 'Cupón no encontrado o inactivo'
      });
    }

    console.log('📋 Tipo de cupón:', coupon.coupon_type);

    // Validar fechas
    const now = new Date();
    if (now < new Date(coupon.valid_from)) {
      return res.status(400).json({ success: false, message: 'Este cupón aún no es válido' });
    }
    if (coupon.valid_until && now > new Date(coupon.valid_until)) {
      return res.status(400).json({ success: false, message: 'Este cupón ha expirado' });
    }

    // Validar usos
    if (coupon.used_count >= coupon.max_uses) {
      return res.status(400).json({ success: false, message: 'Este cupón ha alcanzado su límite de usos' });
    }

    // Validar tienda específica si aplica
    if (coupon.store_id && coupon.store_id !== storeId) {
      return res.status(400).json({ success: false, message: 'Este cupón no es válido para esta tienda' });
    }

    // Lógica específica según tipo de cupón
    if (coupon.coupon_type === 'transactions') {
      // Cupón de transacciones adicionales
      console.log('🔄 Aplicando cupón de transacciones:', coupon.transaction_bonus);

      // Registrar uso del cupón
      const { data: usage, error: usageError } = await supabase
        .from('coupon_usage')
        .insert([{
          coupon_id: coupon.id,
          notification_id: notificationId || null,
          store_id: storeId,
          user_id: userId,
          coupon_type: 'transactions',
          transactions_added: coupon.transaction_bonus
        }])
        .select()
        .single();

      if (usageError) throw usageError;

      // Incrementar contador de usos
      await supabase
        .from('coupons')
        .update({ used_count: coupon.used_count + 1 })
        .eq('id', coupon.id);

      // Actualizar transacciones de la tienda (agregar bonus)
      const { data: currentUsage } = await supabase
        .from('store_usage')
        .select('*')
        .eq('store_id', storeId)
        .single();

      if (currentUsage) {
        // Incrementar el bonus de transacciones
        await supabase
          .from('store_usage')
          .update({ 
            transaction_bonus: (currentUsage.transaction_bonus || 0) + coupon.transaction_bonus,
            updated_at: new Date().toISOString()
          })
          .eq('store_id', storeId);
      }

      console.log('✅ Cupón de transacciones aplicado');

      return res.json({
        success: true,
        message: `¡Cupón aplicado! +${coupon.transaction_bonus} transacciones adicionales`,
        data: {
          usageId: usage.id,
          couponId: coupon.id,
          couponType: 'transactions',
          transactionsAdded: coupon.transaction_bonus
        }
      });

    } else {
      // Cupón de descuento - requiere amount
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El monto es requerido para cupones de descuento'
        });
      }

      // Validar compra mínima
      if (amount < coupon.min_purchase_amount) {
        return res.status(400).json({
          success: false,
          message: `Compra mínima requerida: S/ ${coupon.min_purchase_amount}`
        });
      }

      // Calcular descuento
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (amount * coupon.discount_value) / 100;
      } else {
        discountAmount = coupon.discount_value;
      }

      const finalAmount = Math.max(0, amount - discountAmount);

      // Registrar uso del cupón
      const { data: usage, error: usageError } = await supabase
        .from('coupon_usage')
        .insert([{
          coupon_id: coupon.id,
          notification_id: notificationId || null,
          store_id: storeId,
          user_id: userId,
          coupon_type: 'discount',
          original_amount: amount,
          discount_amount: discountAmount,
          final_amount: finalAmount
        }])
        .select()
        .single();

      if (usageError) throw usageError;

      // Incrementar contador de usos
      await supabase
        .from('coupons')
        .update({ used_count: coupon.used_count + 1 })
        .eq('id', coupon.id);

      console.log('✅ Cupón de descuento aplicado');

      return res.json({
        success: true,
        message: 'Cupón aplicado exitosamente',
        data: {
          usageId: usage.id,
          couponId: coupon.id,
          couponType: 'discount',
          originalAmount: amount,
          discountAmount: parseFloat(discountAmount.toFixed(2)),
          finalAmount: parseFloat(finalAmount.toFixed(2)),
          discountType: coupon.discount_type,
          discountValue: coupon.discount_value
        }
      });
    }

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
