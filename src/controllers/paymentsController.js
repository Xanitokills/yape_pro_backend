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
 * Webhook específico de Izipay (IPN - Instant Payment Notification)
 * POST /api/payments/webhook/izipay
 */
exports.handleIzipayWebhook = async (req, res) => {
  try {
    console.log('📥 Izipay Webhook recibido:', JSON.stringify(req.body, null, 2));
    
    const { kr_answer, kr_hash, kr_hash_algorithm } = req.body;
    
    if (!kr_answer) {
      return res.status(400).json({
        success: false,
        message: 'Datos de webhook inválidos'
      });
    }

    // Parsear respuesta de Izipay
    const answerData = typeof kr_answer === 'string' 
      ? JSON.parse(kr_answer) 
      : kr_answer;

    console.log('📄 Datos del pago:', {
      orderId: answerData.orderDetails?.orderId,
      status: answerData.orderStatus,
      amount: answerData.orderDetails?.orderTotalAmount,
      transactionUuid: answerData.transactions?.[0]?.uuid
    });

    // Verificar si es pago exitoso
    if (answerData.orderStatus === 'PAID') {
      const orderId = answerData.orderDetails?.orderId;
      
      // Actualizar el pago en la base de datos
      await paymentService.markPaymentAsCompleted(orderId);
      
      console.log('✅ Pago completado:', orderId);
    }

    // Izipay requiere respuesta 200 para confirmar recepción
    res.status(200).send('OK');

  } catch (error) {
    console.error('❌ Error en handleIzipayWebhook:', error);
    // Siempre responder 200 a Izipay para evitar reenvíos
    res.status(200).send('OK');
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

/**
 * Crear orden de pago para upgrade (usuario autenticado)
 * POST /api/payments/create-upgrade-order
 */
exports.createUpgradeOrder = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Aceptar tanto planId como plan_id para compatibilidad
    const { planId, plan_id, amount, paymentMethod, payment_method } = req.body;
    const finalPlanId = planId || plan_id;
    const finalPaymentMethod = paymentMethod || payment_method;

    if (!finalPlanId || !amount || !finalPaymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: planId, amount, paymentMethod'
      });
    }

    const paymentOrder = await paymentService.createUpgradeOrder({
      userId,
      planId: finalPlanId,
      amount,
      paymentMethod: finalPaymentMethod
    });

    console.log('✅ Orden creada exitosamente:', {
      reference: paymentOrder.reference,
      amount: paymentOrder.amount,
      hasFormToken: !!paymentOrder.formToken
    });

    res.status(200).json({
      success: true,
      message: 'Orden de upgrade creada',
      data: paymentOrder
    });

  } catch (error) {
    console.error('❌ Error en createUpgradeOrder:', {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear orden de upgrade',
      error: error.message
    });
  }
};

/**
 * Verificar estado del pago de upgrade
 * GET /api/payments/upgrade-status/:reference
 */
exports.checkUpgradePaymentStatus = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Referencia de pago requerida'
      });
    }

    const status = await paymentService.checkUpgradeStatus(userId, reference);

    res.status(200).json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('❌ Error en checkUpgradePaymentStatus:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al verificar pago de upgrade'
    });
  }
};

/**
 * Completar pago de upgrade (llamado desde la app después del éxito en WebView)
 * POST /api/payments/complete-upgrade
 */
exports.completeUpgradePayment = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Referencia de pago requerida'
      });
    }

    console.log(`📥 Completando pago de upgrade: ${reference} para usuario: ${userId}`);

    const result = await paymentService.completeUpgradePayment(userId, reference);

    console.log(`✅ Pago completado exitosamente:`, {
      reference,
      userId,
      planId: result.plan_id,
      alreadyProcessed: result.alreadyProcessed
    });

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Error en completeUpgradePayment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al completar pago de upgrade'
    });
  }
};

/**
 * Renderizar formulario de pago Izipay (para WebView)
 * GET /api/payments/izipay-form
 */
exports.renderIzipayForm = async (req, res) => {
  try {
    const { formToken, amount, reference } = req.query;

    if (!formToken) {
      return res.status(400).send('Parámetro requerido: formToken');
    }

    // Usar la clave pública del servidor, no de la URL
    const publicKey = process.env.IZIPAY_MODE === 'PRODUCTION' 
      ? process.env.IZIPAY_PUBLIC_KEY_PROD 
      : process.env.IZIPAY_PUBLIC_KEY_TEST;

    if (!publicKey) {
      console.error('❌ IZIPAY_PUBLIC_KEY no configurada');
      return res.status(500).send('Error de configuración del servidor');
    }

    console.log('📄 Renderizando formulario Izipay con publicKey:', publicKey.substring(0, 25) + '...');

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Pago Seguro</title>
    <link rel="stylesheet" href="https://static.micuentaweb.pe/static/js/krypton-client/V4.0/ext/classic-reset.css">
    <script src="https://static.micuentaweb.pe/static/js/krypton-client/V4.0/stable/kr-payment-form.min.js" 
            kr-public-key="${publicKey}"
            kr-post-url-success="https://yapeprobackend-production.up.railway.app/api/payments/izipay-success"
            kr-post-url-refused="https://yapeprobackend-production.up.railway.app/api/payments/izipay-refused"></script>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 16px;
            background: #f5f5f5;
        }
        .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h2 { margin: 0 0 8px 0; font-size: 18px; }
        .amount {
            font-size: 28px;
            font-weight: bold;
            color: #5B16D0;
        }
        .reference {
            font-size: 11px;
            color: #888;
            margin-top: 4px;
        }
        .kr-embedded {
            padding: 12px;
        }
        .loading {
            text-align: center;
            padding: 30px;
            color: #666;
        }
        .loading.hidden { display: none; }
        #kr-smart-form { min-height: 200px; }
        .error-msg {
            background: #fee;
            color: #c00;
            padding: 10px;
            border-radius: 6px;
            margin: 10px 0;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Pago Seguro</h2>
            <div class="amount">S/. ${amount || '0.00'}</div>
            <div class="reference">Ref: ${reference || 'N/A'}</div>
        </div>
        
        <div id="loading" class="loading">
            ⏳ Cargando formulario de pago...
        </div>
        
        <div id="error-msg" class="error-msg"></div>
        
        <div class="kr-embedded" kr-form-token="${formToken}"></div>
    </div>

    <script>
        // Esperar a que KR esté disponible
        function waitForKR(callback, maxAttempts) {
            maxAttempts = maxAttempts || 50;
            var attempts = 0;
            var interval = setInterval(function() {
                attempts++;
                if (typeof KR !== 'undefined') {
                    clearInterval(interval);
                    callback();
                } else if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    document.getElementById('error-msg').textContent = 'Error: No se pudo cargar el formulario de pago';
                    document.getElementById('error-msg').style.display = 'block';
                    document.getElementById('loading').style.display = 'none';
                }
            }, 200);
        }

        waitForKR(function() {
            document.getElementById('loading').classList.add('hidden');
            
            KR.onError(function(event) {
                var msg = event.errorMessage || 'Error en el pago';
                document.getElementById('error-msg').textContent = msg;
                document.getElementById('error-msg').style.display = 'block';
            });
            
            KR.onSubmit(function(event) {
                if (event.clientAnswer && event.clientAnswer.orderStatus === 'PAID') {
                    // Redirigir a éxito
                    window.location.href = 'izipay://success?orderId=' + 
                        (event.clientAnswer.orderDetails ? event.clientAnswer.orderDetails.orderId : '');
                }
                return true;
            });
        });
    </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('❌ Error en renderIzipayForm:', error);
    res.status(500).send('Error al generar formulario de pago');
  }
};
