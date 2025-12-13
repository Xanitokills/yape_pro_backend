// src/services/izipayService.js
const axios = require('axios');
const crypto = require('crypto');

/**
 * Configuración de Izipay
 * Obtén tus credenciales en: https://secure.micuentaweb.pe/
 */
const IZIPAY_CONFIG = {
  apiUrl: process.env.IZIPAY_API_URL || 'https://api.micuentaweb.pe/api-payment/V4',
  mode: process.env.IZIPAY_MODE || 'TEST', // TEST o PRODUCTION
  
  // Credenciales según el modo
  get shopId() {
    return process.env.IZIPAY_SHOP_ID;
  },
  get password() {
    return this.mode === 'TEST' 
      ? process.env.IZIPAY_PASSWORD_TEST 
      : process.env.IZIPAY_PASSWORD_PROD;
  },
  get publicKey() {
    return this.mode === 'TEST'
      ? process.env.IZIPAY_PUBLIC_KEY_TEST
      : process.env.IZIPAY_PUBLIC_KEY_PROD;
  },
  get hmacKey() {
    return this.mode === 'TEST'
      ? process.env.IZIPAY_HMAC_SHA256_TEST
      : process.env.IZIPAY_HMAC_SHA256_PROD;
  }
};

/**
 * Generar firma HMAC-SHA256 para autenticación
 */
function generateSignature(data) {
  const hmac = crypto.createHmac('sha256', IZIPAY_CONFIG.hmacKey);
  hmac.update(JSON.stringify(data));
  return hmac.digest('hex');
}

/**
 * Crear token de pago en Izipay
 */
exports.createPaymentToken = async ({ amount, orderId, currency = 'PEN', customer }) => {
  try {
    const paymentData = {
      amount: Math.round(amount * 100), // Convertir a centavos
      currency,
      orderId,
      customer: {
        email: customer.email,
        reference: customer.phone,
        billingDetails: {
          firstName: customer.name.split(' ')[0],
          lastName: customer.name.split(' ').slice(1).join(' ') || customer.name,
          phoneNumber: customer.phone,
          identityCode: customer.phone, // DNI o teléfono
        },
      },
    };

    const response = await axios.post(
      `${IZIPAY_CONFIG.apiUrl}/Charge/CreatePayment`,
      paymentData,
      {
        auth: {
          username: IZIPAY_CONFIG.shopId,
          password: IZIPAY_CONFIG.password,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status === 'SUCCESS') {
      return {
        success: true,
        formToken: response.data.answer.formToken,
        publicKey: IZIPAY_CONFIG.publicKey,
        checkoutUrl: `https://secure.micuentaweb.pe/static/js/krypton-client/V4.0/ext/minimal-payment-form-1.0.js`,
      };
    }

    throw new Error(response.data.answer?.errorMessage || 'Error al crear token de pago');

  } catch (error) {
    console.error('❌ Error en Izipay createPaymentToken:', error.response?.data || error.message);
    throw new Error('Error al generar token de pago con Izipay');
  }
};

/**
 * Crear pago con QR (Yape/Plin)
 */
exports.createQRPayment = async ({ amount, orderId, paymentMethod, customer }) => {
  try {
    const paymentData = {
      amount: Math.round(amount * 100),
      currency: 'PEN',
      orderId,
      paymentMethodType: paymentMethod === 'yape' ? 'QR_CODE' : 'QR_CODE', // Izipay unifica QR
      customer: {
        email: customer.email,
        reference: customer.phone,
      },
    };

    const response = await axios.post(
      `${IZIPAY_CONFIG.apiUrl}/Charge/CreatePayment`,
      paymentData,
      {
        auth: {
          username: IZIPAY_CONFIG.shopId,
          password: IZIPAY_CONFIG.password,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status === 'SUCCESS') {
      return {
        success: true,
        qrUrl: response.data.answer.qrCodeUrl,
        qrData: response.data.answer.qrCodeData,
        transactionId: response.data.answer.transactions[0].uuid,
      };
    }

    throw new Error(response.data.answer?.errorMessage || 'Error al crear QR');

  } catch (error) {
    console.error('❌ Error en Izipay createQRPayment:', error.response?.data || error.message);
    throw new Error('Error al generar código QR con Izipay');
  }
};

/**
 * Verificar estado de transacción
 */
exports.getTransactionStatus = async (transactionId) => {
  try {
    const response = await axios.post(
      `${IZIPAY_CONFIG.apiUrl}/Transaction/Get`,
      { uuid: transactionId },
      {
        auth: {
          username: IZIPAY_CONFIG.shopId,
          password: IZIPAY_CONFIG.password,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status === 'SUCCESS') {
      const transaction = response.data.answer.transactions[0];
      
      return {
        success: true,
        status: transaction.transactionStatusLabel,
        isPaid: transaction.transactionStatusLabel === 'CAPTURED',
        amount: transaction.amount / 100,
        paymentMethod: transaction.paymentMethodType,
        date: transaction.creationDate,
      };
    }

    throw new Error('Transacción no encontrada');

  } catch (error) {
    console.error('❌ Error en getTransactionStatus:', error.response?.data || error.message);
    throw new Error('Error al verificar estado de transacción');
  }
};

/**
 * Validar IPN (Instant Payment Notification) de Izipay
 */
exports.validateIPN = (ipnData, receivedSignature) => {
  try {
    const calculatedSignature = generateSignature(ipnData);
    return calculatedSignature === receivedSignature;
  } catch (error) {
    console.error('❌ Error validando IPN:', error);
    return false;
  }
};

/**
 * Procesar webhook de Izipay
 */
exports.processWebhook = async (webhookData) => {
  try {
    // Validar firma del webhook
    const signature = webhookData['kr-hash'];
    const data = webhookData['kr-answer'];

    if (!this.validateIPN(data, signature)) {
      throw new Error('Firma de webhook inválida');
    }

    const answer = JSON.parse(data);
    const transaction = answer.transactions[0];

    return {
      success: true,
      orderId: answer.orderDetails.orderId,
      transactionId: transaction.uuid,
      status: transaction.transactionStatusLabel,
      isPaid: transaction.transactionStatusLabel === 'CAPTURED',
      amount: transaction.amount / 100,
      paymentMethod: transaction.paymentMethodType,
    };

  } catch (error) {
    console.error('❌ Error procesando webhook Izipay:', error);
    throw new Error('Error al procesar webhook de Izipay');
  }
};
