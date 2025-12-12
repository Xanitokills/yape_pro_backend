# 💳 Guía de Integración de Pagos para Suscripciones

## 🎯 Objetivo
Permitir a los usuarios comprar planes (Profesional, Empresarial) usando:
- 💳 Tarjetas de crédito/débito
- 💜 Yape
- 🟢 Plin
- 🏦 Banca online (BCP, BBVA, Interbank)

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Flutter   │ ────▶│   Backend    │ ────▶│   Izipay    │
│     App     │      │   Node.js    │      │     API     │
└─────────────┘      └──────────────┘      └─────────────┘
      │                     │                      │
      │                     ▼                      │
      │              ┌──────────────┐              │
      │              │   Supabase   │              │
      │              │   Database   │              │
      │              └──────────────┘              │
      │                                            │
      └────────────── Webhook ◀───────────────────┘
```

---

## 📊 Flujo de Pago

### 1. Usuario selecciona plan
```dart
// Flutter: plan_selection_screen.dart
_PlanCard(
  name: 'Profesional',
  price: 'S/.30',
  onSelect: () => _processPlanPurchase('professional')
)
```

### 2. Backend crea orden de pago
```javascript
// Backend: paymentController.js
POST /api/payments/create-order
{
  "planId": "professional",
  "paymentMethod": "yape" // o "card", "plin"
}

Response:
{
  "orderId": "ORD-123456",
  "paymentUrl": "https://secure.micuentaweb.pe/...",
  "qrCode": "data:image/png;base64..." // Para Yape/Plin
}
```

### 3. Usuario paga
- **Tarjeta**: Redirige a formulario Izipay
- **Yape/Plin**: Muestra QR code
- **Banca**: Redirige a portal del banco

### 4. Izipay notifica resultado
```javascript
// Backend: webhook
POST /api/payments/webhook
{
  "orderId": "ORD-123456",
  "status": "paid",
  "transactionId": "TXN-789"
}
```

### 5. Backend actualiza suscripción
```sql
-- Activar plan del usuario
UPDATE users 
SET subscription_plan_id = 'professional',
    subscription_status = 'active'
WHERE id = 'user-uuid';

-- Guardar registro de pago
INSERT INTO payments (order_id, amount, status) 
VALUES ('ORD-123456', 30.00, 'completed');
```

---

## 🔧 Implementación Paso a Paso

### PASO 1: Crear Controlador de Pagos

**Archivo**: `backend/src/controllers/paymentController.js`

```javascript
const { supabase } = require('../config/database');
const crypto = require('crypto');

/**
 * Crear orden de pago
 */
const createPaymentOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { planId } = req.body;

    // 1. Obtener información del plan
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }

    // 2. Generar ID único de orden
    const orderId = `ORD-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // 3. Crear registro en tabla payments
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        user_id: userId,
        plan_id: planId,
        amount: plan.price_monthly,
        currency: 'PEN',
        status: 'pending',
        payment_method: 'izipay'
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // 4. Crear orden en Izipay
    const izipayOrder = await createIzipayOrder({
      orderId,
      amount: plan.price_monthly * 100, // Centavos
      currency: 'PEN',
      customer: {
        email: req.user.email,
        userId: userId
      }
    });

    res.json({
      success: true,
      data: {
        orderId: orderId,
        paymentUrl: izipayOrder.formToken,
        amount: plan.price_monthly,
        planName: plan.name
      }
    });

  } catch (error) {
    console.error('Error creando orden de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear orden de pago'
    });
  }
};

/**
 * Webhook de Izipay (recibe confirmación de pago)
 */
const handleIzipayWebhook = async (req, res) => {
  try {
    const { orderId, status, transactionId } = req.body;

    // 1. Verificar firma del webhook
    const isValid = verifyIzipaySignature(req);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 2. Actualizar estado del pago
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // 3. Si el pago fue exitoso, activar suscripción
    if (status === 'PAID') {
      await supabase
        .from('payments')
        .update({
          status: 'completed',
          transaction_id: transactionId,
          paid_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      // Activar plan del usuario
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 mes

      await supabase
        .from('users')
        .update({
          subscription_plan_id: payment.plan_id,
          subscription_status: 'active',
          subscription_started_at: new Date().toISOString(),
          subscription_expires_at: expiresAt.toISOString()
        })
        .eq('id', payment.user_id);

      console.log(`✅ Suscripción activada para usuario ${payment.user_id}`);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Error en webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
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
          price_monthly
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
    console.error('Error obteniendo pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de pagos'
    });
  }
};

module.exports = {
  createPaymentOrder,
  handleIzipayWebhook,
  getUserPayments
};
```

---

### PASO 2: Servicio de Izipay

**Archivo**: `backend/src/services/izipayService.js`

```javascript
const axios = require('axios');
const crypto = require('crypto');

const IZIPAY_CONFIG = {
  shopId: process.env.IZIPAY_SHOP_ID,
  apiKey: process.env.IZIPAY_API_KEY,
  publicKey: process.env.IZIPAY_PUBLIC_KEY,
  apiUrl: process.env.IZIPAY_API_URL || 'https://api.micuentaweb.pe/api-payment/V4',
  mode: process.env.IZIPAY_MODE || 'TEST'
};

/**
 * Crear orden de pago en Izipay
 */
async function createIzipayOrder({ orderId, amount, currency, customer }) {
  try {
    const auth = Buffer.from(`${IZIPAY_CONFIG.shopId}:${IZIPAY_CONFIG.apiKey}`).toString('base64');

    const response = await axios.post(
      `${IZIPAY_CONFIG.apiUrl}/Charge/CreatePayment`,
      {
        amount: amount, // En centavos
        currency: currency,
        orderId: orderId,
        customer: {
          email: customer.email,
          reference: customer.userId
        },
        // Habilitar métodos de pago
        paymentMethods: ['CARD', 'YAPE', 'PLIN', 'BANK_TRANSFER']
      },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      formToken: response.data.answer.formToken,
      orderId: orderId
    };

  } catch (error) {
    console.error('Error creando orden Izipay:', error.response?.data || error);
    throw error;
  }
}

/**
 * Verificar firma del webhook
 */
function verifyIzipaySignature(req) {
  const signature = req.headers['kr-hash-algorithm'];
  const receivedHash = req.headers['kr-hash'];
  
  if (signature !== 'sha256_hmac') {
    return false;
  }

  const body = JSON.stringify(req.body);
  const calculatedHash = crypto
    .createHmac('sha256', IZIPAY_CONFIG.apiKey)
    .update(body)
    .digest('hex');

  return calculatedHash === receivedHash;
}

/**
 * Crear QR para Yape/Plin
 */
async function createQRPayment({ orderId, amount, currency }) {
  try {
    const auth = Buffer.from(`${IZIPAY_CONFIG.shopId}:${IZIPAY_CONFIG.apiKey}`).toString('base64');

    const response = await axios.post(
      `${IZIPAY_CONFIG.apiUrl}/Charge/CreatePayment`,
      {
        amount: amount,
        currency: currency,
        orderId: orderId,
        paymentMethodType: 'QR_CODE' // Para Yape/Plin
      },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      qrCode: response.data.answer.qrCode,
      qrUrl: response.data.answer.qrUrl,
      orderId: orderId
    };

  } catch (error) {
    console.error('Error creando QR:', error);
    throw error;
  }
}

module.exports = {
  createIzipayOrder,
  verifyIzipaySignature,
  createQRPayment
};
```

---

### PASO 3: Rutas de Pagos

**Archivo**: `backend/src/routes/payments.js`

```javascript
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   POST /api/payments/create-order
 * @desc    Crear orden de pago
 * @access  Private
 */
router.post('/create-order', authenticate, paymentController.createPaymentOrder);

/**
 * @route   POST /api/payments/webhook
 * @desc    Webhook de Izipay
 * @access  Public (verificado por firma)
 */
router.post('/webhook', paymentController.handleIzipayWebhook);

/**
 * @route   GET /api/payments/my-payments
 * @desc    Obtener historial de pagos
 * @access  Private
 */
router.get('/my-payments', authenticate, paymentController.getUserPayments);

module.exports = router;
```

---

### PASO 4: Actualizar server.js

```javascript
// backend/server.js
const paymentRoutes = require('./src/routes/payments');

app.use('/api/payments', paymentRoutes);
```

---

### PASO 5: Migración de Base de Datos

**Archivo**: `backend/migrations/update_payments_table.sql`

```sql
-- Mejorar tabla de pagos
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS plan_id VARCHAR(50) REFERENCES subscription_plans(id),
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'izipay',
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
```

---

## 📱 Frontend Flutter

### PASO 6: Servicio de Pagos en Flutter

**Archivo**: `yape_pro/lib/services/payment_service.dart`

```dart
import 'api_service.dart';

class PaymentService {
  /// Crear orden de pago
  static Future<ApiResponse> createPaymentOrder(String planId) async {
    return await ApiService.post(
      endpoint: '/api/payments/create-order',
      body: {'planId': planId},
    );
  }

  /// Obtener historial de pagos
  static Future<ApiResponse> getMyPayments() async {
    return await ApiService.get(
      endpoint: '/api/payments/my-payments',
    );
  }
}
```

---

### PASO 7: Pantalla de Pago

**Archivo**: `yape_pro/lib/screens/payment/payment_screen.dart`

```dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../services/payment_service.dart';

class PaymentScreen extends StatefulWidget {
  final String planId;
  final String planName;
  final double amount;

  const PaymentScreen({
    super.key,
    required this.planId,
    required this.planName,
    required this.amount,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  bool _isLoading = true;
  String? _paymentUrl;

  @override
  void initState() {
    super.initState();
    _createPaymentOrder();
  }

  Future<void> _createPaymentOrder() async {
    try {
      final response = await PaymentService.createPaymentOrder(widget.planId);

      if (response.success && response.data != null) {
        setState(() {
          _paymentUrl = response.data['paymentUrl'];
          _isLoading = false;
        });
      } else {
        _showError(response.message ?? 'Error al crear orden');
      }
    } catch (e) {
      _showError('Error: $e');
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Procesando...')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Pagar ${widget.planName}'),
        backgroundColor: const Color(0xFF5B16D0),
      ),
      body: WebViewWidget(
        controller: WebViewController()
          ..setJavaScriptMode(JavaScriptMode.unrestricted)
          ..setNavigationDelegate(
            NavigationDelegate(
              onPageFinished: (url) {
                // Detectar si el pago fue exitoso
                if (url.contains('success')) {
                  Navigator.pop(context, true); // Pago exitoso
                } else if (url.contains('error')) {
                  Navigator.pop(context, false); // Pago fallido
                }
              },
            ),
          )
          ..loadRequest(Uri.parse(_paymentUrl!)),
      ),
    );
  }
}
```

---

### PASO 8: Actualizar plan_selection_screen.dart

```dart
// En _PlanCard, agregar onPressed:
ElevatedButton(
  onPressed: () async {
    if (planId == _currentPlanId) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ya tienes este plan activo')),
      );
      return;
    }

    // Mostrar pantalla de pago
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PaymentScreen(
          planId: planId,
          planName: name,
          amount: priceMonthly,
        ),
      ),
    );

    if (result == true) {
      // Pago exitoso
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('¡Plan activado exitosamente!'),
          backgroundColor: Colors.green,
        ),
      );
      
      // Invalidar caché y recargar
      await SubscriptionCacheService.invalidateSubscriptionCache();
      Navigator.pop(context); // Volver al home
    }
  },
  child: const Text('Seleccionar Plan'),
)
```

---

## 🔐 Seguridad

### Variables de Entorno (.env)
```env
# Producción
IZIPAY_MODE=PRODUCTION
IZIPAY_SHOP_ID=tu_shop_id_real
IZIPAY_API_KEY=tu_api_key_real
IZIPAY_PUBLIC_KEY=tu_public_key_real

# Test
IZIPAY_MODE=TEST
IZIPAY_SHOP_ID=12345678
IZIPAY_API_KEY=test_sk_...
```

---

## ✅ Checklist de Implementación

- [ ] Crear `paymentController.js`
- [ ] Crear `izipayService.js`
- [ ] Crear rutas en `payments.js`
- [ ] Actualizar `server.js`
- [ ] Ejecutar migración SQL
- [ ] Crear `payment_service.dart`
- [ ] Crear `payment_screen.dart`
- [ ] Agregar `webview_flutter` en `pubspec.yaml`
- [ ] Actualizar `plan_selection_screen.dart`
- [ ] Configurar webhook en panel Izipay
- [ ] Probar con tarjeta de prueba
- [ ] Probar con QR Yape/Plin

---

## 📞 Soporte

- Izipay Docs: https://secure.micuentaweb.pe/doc/
- Soporte: soporte@izipay.pe
- WhatsApp: +51 999 999 999
