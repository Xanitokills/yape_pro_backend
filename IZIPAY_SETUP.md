# 🚀 Guía de Integración Izipay

## 📋 Pasos para activar Izipay

### 1️⃣ Crear cuenta en Izipay

1. Ve a: https://secure.micuentaweb.pe/
2. Click en "Crear cuenta"
3. Completa el registro con tus datos:
   - RUC de tu empresa
   - Datos de contacto
   - Cuenta bancaria

### 2️⃣ Obtener credenciales

1. Inicia sesión en el panel de Izipay
2. Ve a **Configuración > Credenciales**
3. Copia estos datos:
   - **Shop ID**: Tu identificador de tienda
   - **API Key (privada)**: Clave secreta para backend
   - **Public Key**: Clave pública para frontend

### 3️⃣ Configurar credenciales en el backend

Edita el archivo `backend/.env`:

```env
IZIPAY_MODE=TEST
IZIPAY_SHOP_ID=12345678
IZIPAY_API_KEY=test_sk_1234567890abcdef
IZIPAY_PUBLIC_KEY=test_pk_1234567890abcdef
IZIPAY_API_URL=https://api.micuentaweb.pe/api-payment/V4
```

### 4️⃣ Crear tabla de pagos en Supabase

Ejecuta en **Supabase SQL Editor**:

```sql
-- Copia y pega el contenido de:
backend/migrations/create_payments_table.sql
```

### 5️⃣ Instalar dependencias

```bash
cd backend
npm install
```

### 6️⃣ Reiniciar backend

```bash
npm start
```

## 🧪 Probar la integración

### Test 1: Crear orden de pago (Yape/Plin)

```bash
curl -X POST http://localhost:3002/api/payments/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "pro",
    "amount": 30,
    "payment_method": "yape",
    "user_data": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "999999999"
    }
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Orden de pago creada",
  "data": {
    "reference": "YPPRO-...",
    "qr_url": "https://...",
    "amount": 30,
    "expires_at": "..."
  }
}
```

### Test 2: Verificar estado del pago

```bash
curl http://localhost:3002/api/payments/status/YPPRO-xxxxx
```

## 📱 Métodos de pago disponibles

### ✅ Yape (QR Code)
- Genera QR automático
- Usuario escanea con app Yape
- Confirmación instantánea

### ✅ Plin (QR Code)
- Genera QR automático
- Usuario escanea con app Plin
- Confirmación instantánea

### ✅ Tarjetas (Visa/Mastercard/Amex)
- Formulario seguro de Izipay
- 3D Secure incluido
- Confirmación instantánea

### ⚠️ Transferencia Bancaria
- Manual (sin Izipay)
- Verificación en 5-10 minutos

## 💡 Modo TEST vs PRODUCTION

### TEST (Desarrollo)
```env
IZIPAY_MODE=TEST
IZIPAY_SHOP_ID=test_12345678
IZIPAY_API_KEY=test_sk_...
```

- ✅ No cobra dinero real
- ✅ QR codes de prueba
- ✅ Tarjetas de prueba: `4970100000000001`

### PRODUCTION (Producción)
```env
IZIPAY_MODE=PRODUCTION
IZIPAY_SHOP_ID=prod_12345678
IZIPAY_API_KEY=prod_sk_...
```

- ⚠️ Cobra dinero real
- ⚠️ Requiere aprobación de Izipay
- ⚠️ Necesitas cuenta bancaria verificada

## 🔐 Seguridad

1. **Nunca expongas** las credenciales en el frontend
2. **Solo el backend** debe tener acceso a `IZIPAY_API_KEY`
3. **Valida webhooks** con la firma HMAC-SHA256
4. **Usa HTTPS** en producción

## 📊 Comisiones

- **Yape/Plin**: 3.5% + IGV
- **Tarjetas**: 3.5% + IGV
- **Sin mensualidad**
- **Sin costo de setup**

Ejemplo:
- Venta: S/.30
- Comisión: S/.1.05
- IGV (18%): S/.0.19
- **Total comisión: S/.1.24**
- **Recibes: S/.28.76**

## 🆘 Soporte

- Documentación: https://docs.izipay.pe/
- Soporte: soporte@izipay.pe
- WhatsApp: +51 999 999 999

## ✅ Checklist de activación

- [ ] Cuenta creada en Izipay
- [ ] Credenciales copiadas en `.env`
- [ ] Tabla `payments` creada en Supabase
- [ ] Dependencias instaladas (`npm install`)
- [ ] Backend reiniciado
- [ ] Test de orden de pago exitoso
- [ ] Test de verificación de estado exitoso
- [ ] Webhook configurado (producción)
