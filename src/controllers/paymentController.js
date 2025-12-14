const { supabase } = require('../config/database');
const { createIzipayOrder, createQRPayment } = require('../services/izipayService');
const crypto = require('crypto');

/**
 * Crear orden de pago para suscripción
 */
const createPaymentOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { planId, paymentMethod = 'card' } = req.body;

    // Validar que el usuario existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Obtener información del plan
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }

    // Validar que el plan no sea gratuito
    if (plan.price_monthly <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El plan gratuito no requiere pago'
      });
    }

    // Generar ID único de orden
    const orderId = `ORD-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Crear registro en tabla payments
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        user_id: userId,
        plan_id: planId,
        amount: plan.price_monthly,
        currency: 'PEN',
        status: 'pending',
        payment_method: paymentMethod,
        metadata: {
          planName: plan.name,
          userEmail: user.email
        }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creando payment:', paymentError);
      throw paymentError;
    }

    // Crear orden en Izipay según método de pago
    let izipayResponse;

    if (paymentMethod === 'qr' || paymentMethod === 'yape' || paymentMethod === 'plin') {
      // Generar QR para Yape/Plin
      izipayResponse = await createQRPayment({
        orderId,
        amount: plan.price_monthly * 100, // Convertir a centavos
        currency: 'PEN',
        description: `Suscripción ${plan.name} - YapePro`
      });
    } else {
      // Pago con tarjeta o método tradicional
      izipayResponse = await createIzipayOrder({
        orderId,
        amount: plan.price_monthly * 100, // Convertir a centavos
        currency: 'PEN',
        customer: {
          email: user.email,
          userId: userId,
          name: user.full_name
        },
        description: `Suscripción ${plan.name} - YapePro`
      });
    }

    console.log(`✅ Orden de pago creada: ${orderId} - Plan: ${plan.name} - Usuario: ${user.email}`);

    res.json({
      success: true,
      data: {
        orderId: orderId,
        paymentUrl: izipayResponse.formToken || izipayResponse.paymentUrl,
        qrCode: izipayResponse.qrCode,
        qrUrl: izipayResponse.qrUrl,
        amount: plan.price_monthly,
        planName: plan.name,
        paymentMethod: paymentMethod
      }
    });

  } catch (error) {
    console.error('❌ Error creando orden de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear orden de pago',
      error: error.message
    });
  }
};

/**
 * Webhook de Izipay (recibe confirmación de pago)
 */
const handleIzipayWebhook = async (req, res) => {
  try {
    console.log('🔔 Webhook recibido de Izipay:', req.body);

    const { 
      kr_answer,
      kr_hash,
      kr_hash_algorithm 
    } = req.body;

    // Decodificar la respuesta de Izipay
    const answer = JSON.parse(kr_answer);
    const { 
      orderId,
      orderStatus,
      transactions 
    } = answer;

    const transaction = transactions?.[0];
    const transactionId = transaction?.uuid;
    const status = orderStatus;

    console.log(`📦 Procesando webhook - Order: ${orderId}, Status: ${status}`);

    // Buscar el pago
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (paymentError || !payment) {
      console.error('❌ Pago no encontrado:', orderId);
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Si el pago fue exitoso
    if (status === 'PAID') {
      console.log(`✅ Pago exitoso - Activando suscripción para usuario: ${payment.user_id}`);

      // Actualizar estado del pago
      await supabase
        .from('payments')
        .update({
          status: 'completed',
          transaction_id: transactionId,
          paid_at: new Date().toISOString(),
          metadata: {
            ...payment.metadata,
            izipayResponse: answer
          }
        })
        .eq('order_id', orderId);

      // Activar suscripción del usuario
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 mes de suscripción

      const { error: updateError } = await supabase
        .from('users')
        .update({
          subscription_plan_id: payment.plan_id,
          subscription_status: 'active',
          subscription_started_at: now.toISOString(),
          subscription_expires_at: expiresAt.toISOString()
        })
        .eq('id', payment.user_id);

      if (updateError) {
        console.error('❌ Error activando suscripción:', updateError);
      } else {
        console.log(`🎉 Suscripción activada exitosamente para usuario ${payment.user_id}`);
        
        // TODO: Enviar email de confirmación
        // TODO: Enviar notificación push
      }

    } else if (status === 'UNPAID' || status === 'CANCELLED') {
      // Pago fallido o cancelado
      console.log(`❌ Pago fallido/cancelado: ${orderId}`);
      
      await supabase
        .from('payments')
        .update({
          status: status === 'CANCELLED' ? 'cancelled' : 'failed',
          metadata: {
            ...payment.metadata,
            izipayResponse: answer
          }
        })
        .eq('order_id', orderId);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('❌ Error en webhook:', error);
    res.status(500).json({ 
      success: false,
      error: 'Webhook processing failed' 
    });
  }
};

/**
 * Obtener historial de pagos del usuario
 */
const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        subscription_plans (
          name,
          price_monthly,
          description
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error('❌ Error obteniendo historial de pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de pagos'
    });
  }
};

/**
 * Cancelar orden de pago pendiente
 */
const cancelPaymentOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const { data: payment, error } = await supabase
      .from('payments')
      .update({ status: 'cancelled' })
      .eq('order_id', orderId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error || !payment) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada o no se puede cancelar'
      });
    }

    res.json({
      success: true,
      message: 'Orden cancelada exitosamente'
    });

  } catch (error) {
    console.error('Error cancelando orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar orden'
    });
  }
};

/**
 * Crear orden de pago para upgrade (usuario autenticado)
 */
const createUpgradeOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { plan_id, amount, payment_method = 'card' } = req.body;

    // Validar que el usuario existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, full_name, subscription_plan_id, subscription_expires_at, subscription_status')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Obtener plan destino
    const { data: targetPlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !targetPlan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }

    // Determinar si es renovación o upgrade
    const isSamePlan = user.subscription_plan_id === plan_id;
    const isRenewal = isSamePlan && (
      user.subscription_status === 'expired' ||
      (user.subscription_expires_at && new Date(user.subscription_expires_at) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // Permite renovar si quedan 7 días o menos
    );

    // Solo bloquear si es el mismo plan Y no es una renovación válida
    if (isSamePlan && !isRenewal) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes este plan activo. Podrás renovar cuando queden 7 días o menos.'
      });
    }

    // Generar referencia única
    const reference = `UPG-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Crear registro en tabla payments
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: reference,
        user_id: userId,
        plan_id: plan_id,
        amount: amount,
        currency: 'PEN',
        status: 'pending',
        payment_method: payment_method,
        metadata: {
          planName: targetPlan.name,
          userEmail: user.email,
          previousPlan: user.subscription_plan_id,
          type: isRenewal ? 'renewal' : 'upgrade',
          isRenewal: isRenewal
        }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creando payment:', paymentError);
      throw paymentError;
    }

    // Crear orden en Izipay
    let izipayData = {};
    
    if (payment_method === 'card') {
      const izipayResponse = await createIzipayOrder({
        orderId: reference,
        amount: amount * 100, // Convertir a centavos
        currency: 'PEN',
        customer: {
          email: user.email,
          userId: userId,
          name: user.full_name
        },
        description: `Upgrade a ${targetPlan.name} - YapePro`
      });
      izipayData.formToken = izipayResponse.formToken;
    } else if (payment_method === 'yape' || payment_method === 'plin') {
      // Para QR (simulado en TEST)
      izipayData.qr_code = `QR_${reference}`;
      izipayData.qr_url = `https://test.izipay.com/qr/${reference}`;
    }

    console.log(`✅ Orden de upgrade creada: ${reference} - Plan: ${targetPlan.name}`);

    res.json({
      success: true,
      data: {
        reference: reference,
        formToken: izipayData.formToken,
        qr_code: izipayData.qr_code,
        qr_url: izipayData.qr_url,
        amount: amount,
        planName: targetPlan.name,
        payment_method: payment_method
      }
    });

  } catch (error) {
    console.error('❌ Error creando orden de upgrade:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear orden de upgrade',
      error: error.message
    });
  }
};

/**
 * Verificar estado del pago de upgrade
 */
const checkUpgradePaymentStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reference } = req.params;

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', reference)
      .eq('user_id', userId)
      .single();

    if (error || !payment) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        status: payment.status,
        paid_at: payment.paid_at,
        transaction_id: payment.transaction_id
      }
    });

  } catch (error) {
    console.error('❌ Error verificando pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar pago'
    });
  }
};

module.exports = {
  createPaymentOrder,
  handleIzipayWebhook,
  getUserPayments,
  cancelPaymentOrder,
  createUpgradeOrder,
  checkUpgradePaymentStatus
};
