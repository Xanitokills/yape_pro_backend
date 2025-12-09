// src/controllers/paymentsController.js
const paymentService = require('../services/paymentService');

/**
 * Crear orden de pago
 * POST /api/payments/create-order
 */
exports.createPaymentOrder = async (req, res) => {
  try {
    const { plan_id, amount, payment_method, user_data } = req.body;

    // Validaciones
    if (!plan_id || !amount || !payment_method || !user_data) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: plan_id, amount, payment_method, user_data'
      });
    }

    if (!['yape', 'plin', 'card', 'bank'].includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: 'Método de pago inválido'
      });
    }

    // Crear orden de pago
    const paymentOrder = await paymentService.createOrder({
      planId: plan_id,
      amount,
      paymentMethod: payment_method,
      userData: user_data
    });

    res.status(200).json({
      success: true,
      message: 'Orden de pago creada',
      data: paymentOrder
    });

  } catch (error) {
    console.error('❌ Error en createPaymentOrder:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear orden de pago'
    });
  }
};

/**
 * Verificar estado del pago
 * GET /api/payments/status/:reference
 */
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Referencia de pago requerida'
      });
    }

    const status = await paymentService.checkStatus(reference);

    res.status(200).json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('❌ Error en checkPaymentStatus:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al verificar pago'
    });
  }
};

/**
 * Webhook para confirmación de pago (desde Izipay/Niubiz)
 * POST /api/payments/webhook
 */
exports.handleWebhook = async (req, res) => {
  try {
    console.log('📥 Webhook recibido:', req.body);

    const result = await paymentService.processWebhook(req.body);

    res.status(200).json({
      success: true,
      message: 'Webhook procesado',
      data: result
    });

  } catch (error) {
    console.error('❌ Error en handleWebhook:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al procesar webhook'
    });
  }
};

/**
 * Listar todos los pagos (Admin)
 * GET /api/payments/list
 */
exports.listPayments = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    const payments = await paymentService.listPayments({
      status,
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error('❌ Error en listPayments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al listar pagos'
    });
  }
};
