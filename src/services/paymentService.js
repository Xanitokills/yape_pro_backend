// src/services/paymentService.js
const { supabase } = require('../config/database');
const crypto = require('crypto');
const izipayService = require('./izipayService');

/**
 * Generar referencia única de pago
 */
function generateReference() {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `YPPRO-${timestamp}-${random}`;
}

/**
 * Crear orden de pago
 */
exports.createOrder = async ({ planId, amount, paymentMethod, userData }) => {
  try {
    const reference = generateReference();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    // Insertar en tabla payments
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        reference,
        plan_id: planId,
        amount,
        payment_method: paymentMethod,
        user_email: userData.email,
        user_phone: userData.phone,
        user_name: userData.name,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Generar datos según método de pago con Izipay
    let paymentData = {
      reference,
      amount,
      expires_at: expiresAt.toISOString()
    };

    if (paymentMethod === 'yape' || paymentMethod === 'plin') {
      // Generar QR con Izipay
      try {
        const qrPayment = await izipayService.createQRPayment({
          amount,
          orderId: reference,
          paymentMethod,
          customer: {
            email: userData.email,
            phone: userData.phone,
            name: userData.name,
          },
        });

        // Guardar transaction_id en la base de datos
        await supabase
          .from('payments')
          .update({ transaction_id: qrPayment.transactionId })
          .eq('reference', reference);

        paymentData.qr_url = qrPayment.qrUrl;
        paymentData.qr_data = qrPayment.qrData;
        paymentData.transaction_id = qrPayment.transactionId;
        paymentData.instructions = [
          `Abre tu app de ${paymentMethod === 'yape' ? 'Yape' : 'Plin'}`,
          'Escanea el código QR',
          `Confirma el pago de S/.${amount.toFixed(2)}`,
          'La confirmación será automática'
        ];
      } catch (error) {
        console.error('Error generando QR con Izipay:', error);
        throw new Error('Error al generar código QR de pago');
      }
    } else if (paymentMethod === 'card') {
      // Generar token de pago con tarjeta
      try {
        const tokenData = await izipayService.createPaymentToken({
          amount,
          orderId: reference,
          customer: {
            email: userData.email,
            phone: userData.phone,
            name: userData.name,
          },
        });

        paymentData.form_token = tokenData.formToken;
        paymentData.public_key = tokenData.publicKey;
        paymentData.checkout_url = tokenData.checkoutUrl;
        paymentData.instructions = [
          'Ingresa los datos de tu tarjeta',
          'Confirma el pago de forma segura',
          'La confirmación será instantánea'
        ];
      } catch (error) {
        console.error('Error generando token con Izipay:', error);
        throw new Error('Error al iniciar pago con tarjeta');
      }
    } else if (paymentMethod === 'bank') {
      // Transferencia bancaria manual
      paymentData.bank_details = {
        bank: 'BCP',
        account_number: '19412345678901',
        account_type: 'Cuenta Corriente',
        holder: 'Yape Pro SAC',
        ruc: '20123456789',
        reference
      };
      paymentData.instructions = [
        'Realiza una transferencia bancaria',
        'Usa el número de referencia en el concepto',
        'El pago se verificará en 5-10 minutos',
        'Recibirás confirmación por correo'
      ];
    }

    console.log(`💳 Orden de pago creada: ${reference} - ${paymentMethod} - S/.${amount}`);

    return paymentData;

  } catch (error) {
    console.error('❌ Error al crear orden:', error);
    throw new Error('Error al generar orden de pago');
  }
};

/**
 * Verificar estado del pago
 */
exports.checkStatus = async (reference) => {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('reference', reference)
      .single();

    if (error || !payment) {
      return {
        status: 'not_found',
        paid: false,
        message: 'Pago no encontrado'
      };
    }

    // Si tiene transaction_id, verificar con Izipay
    if (payment.transaction_id && payment.status === 'pending') {
      try {
        const izipayStatus = await izipayService.getTransactionStatus(payment.transaction_id);
        
        if (izipayStatus.isPaid && payment.status !== 'completed') {
          // Actualizar estado si fue pagado
          await supabase
            .from('payments')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('reference', reference);

          // Activar plan del usuario
          await activateUserPlan(payment);

          payment.status = 'completed';
          payment.completed_at = new Date().toISOString();
        }
      } catch (izipayError) {
        console.error('Error consultando Izipay:', izipayError);
        // Continuar con el estado local si falla Izipay
      }
    }

    // Verificar si expiró
    if (payment.status === 'pending' && new Date(payment.expires_at) < new Date()) {
      await supabase
        .from('payments')
        .update({ status: 'expired' })
        .eq('reference', reference);

      return {
        status: 'expired',
        paid: false,
        message: 'El pago ha expirado'
      };
    }

    return {
      status: payment.status,
      paid: payment.status === 'completed',
      amount: payment.amount,
      payment_method: payment.payment_method,
      created_at: payment.created_at,
      expires_at: payment.expires_at
    };

  } catch (error) {
    console.error('❌ Error al verificar estado:', error);
    throw new Error('Error al verificar estado del pago');
  }
};

/**
 * Procesar webhook de Izipay
 */
exports.processWebhook = async (webhookData) => {
  try {
    // Procesar webhook de Izipay
    const webhookResult = await izipayService.processWebhook(webhookData);

    if (!webhookResult.success) {
      throw new Error('Webhook inválido');
    }

    const { orderId, isPaid, transactionId } = webhookResult;

    // Actualizar estado del pago en la base de datos
    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        status: isPaid ? 'completed' : 'failed',
        completed_at: isPaid ? new Date().toISOString() : null,
        transaction_id: transactionId
      })
      .eq('reference', orderId)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Pago ${orderId} actualizado a: ${payment.status}`);

    // Si el pago fue exitoso, activar plan del usuario
    if (isPaid) {
      await activateUserPlan(payment);
    }

    return {
      reference: orderId,
      status: payment.status
    };

  } catch (error) {
    console.error('❌ Error al procesar webhook:', error);
    throw new Error('Error al procesar webhook');
  }
};

/**
 * Activar plan del usuario después de pago exitoso
 */
async function activateUserPlan(payment) {
  try {
    // Actualizar plan del usuario en la tabla owners
    const { error } = await supabase
      .from('owners')
      .update({
        plan: payment.plan_id,
        plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
        updated_at: new Date().toISOString()
      })
      .eq('email', payment.user_email);

    if (error) throw error;

    console.log(`✅ Plan ${payment.plan_id} activado para ${payment.user_email}`);

    // TODO: Enviar email de confirmación
    // TODO: Enviar notificación push

  } catch (error) {
    console.error('❌ Error activando plan:', error);
    throw error;
  }
}

/**
 * Listar pagos (Admin)
 */
exports.listPayments = async ({ status, limit = 50 }) => {
  try {
    let query = supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: payments, error } = await query;

    if (error) throw error;

    return payments;

  } catch (error) {
    console.error('❌ Error al listar pagos:', error);
    throw new Error('Error al listar pagos');
  }
};

/**
 * Generar QR code (implementación simulada)
 * En producción debes usar una librería real como qrcode
 */
async function generateQRCode(reference, amount, method) {
  // Simulación - En producción usar:
  // - Para Yape: API de Yape o generar QR con datos del comercio
  // - Para Plin: API de Plin o generar QR con datos del comercio
  
  // Por ahora retornamos un placeholder que puedes reemplazar
  const qrData = `${method}://pago?ref=${reference}&amount=${amount}`;
  
  // URL simulado - reemplaza con generación real
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;
}

/**
 * Crear orden de pago para upgrade (usuario autenticado)
 */
exports.createUpgradeOrder = async ({ userId, planId, amount, paymentMethod }) => {
  try {
    const reference = generateReference();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    // Obtener datos del usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, full_name, phone, subscription_plan_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('Usuario no encontrado');
    }

    // Validar que no sea el plan actual
    if (user.subscription_plan_id === planId) {
      throw new Error('Ya tienes este plan activo');
    }

    // Insertar en tabla payments
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        order_id: reference,
        user_id: userId,
        plan_id: planId,
        amount,
        currency: 'PEN',
        payment_method: paymentMethod,
        status: 'pending',
        metadata: {
          type: 'upgrade',
          previousPlan: user.subscription_plan_id,
          userEmail: user.email
        },
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Generar datos según método de pago
    let paymentData = {
      reference,
      amount,
      expires_at: expiresAt.toISOString()
    };

    if (paymentMethod === 'card') {
      // Generar token de pago con Izipay
      try {
        const tokenData = await izipayService.createPaymentToken({
          amount,
          orderId: reference,
          customer: {
            email: user.email,
            phone: user.phone || '',
            name: user.full_name || 'Usuario',
          },
        });

        paymentData.formToken = tokenData.formToken;
        paymentData.publicKey = tokenData.publicKey;
      } catch (error) {
        console.error('Error generando token Izipay:', error);
        // En TEST mode, retornar token simulado
        paymentData.formToken = `TEST_TOKEN_${reference}`;
      }
    } else if (paymentMethod === 'yape' || paymentMethod === 'plin') {
      // Generar QR (simulado en TEST)
      paymentData.qr_code = `QR_${reference}`;
      paymentData.qr_url = await generateQRCode(reference, amount, paymentMethod);
    }

    console.log(`✅ Orden de upgrade creada: ${reference} para usuario ${userId}`);

    return paymentData;

  } catch (error) {
    console.error('❌ Error creando orden de upgrade:', error);
    throw error;
  }
};

/**
 * Verificar estado del pago de upgrade
 */
exports.checkUpgradeStatus = async (userId, reference) => {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', reference)
      .eq('user_id', userId)
      .single();

    if (error || !payment) {
      throw new Error('Pago no encontrado');
    }

    return {
      status: payment.status,
      paid_at: payment.paid_at,
      transaction_id: payment.transaction_id,
      amount: payment.amount,
      plan_id: payment.plan_id
    };

  } catch (error) {
    console.error('❌ Error verificando estado de upgrade:', error);
    throw error;
  }
};
