# 🧪 Testing de Notificaciones Simuladas - Guía Rápida

## 📋 **Endpoints Disponibles**

### 1. **Listar Tiendas** (para obtener store_id)
```bash
GET http://localhost:3002/api/test/stores
Authorization: Bearer {token}
```

### 2. **Simular 1 Notificación**
```bash
POST http://localhost:3002/api/test/simulate-notification
Authorization: Bearer {token}
Content-Type: application/json

{
  "store_id": "uuid-de-la-tienda",
  "amount": 50.00,
  "sender_name": "Juan Pérez",
  "source": "yape",
  "format": 1
}
```

**Formatos disponibles:**
- `format: 1` → "Recibiste S/ XX.XX"
- `format: 2` → "S/ XX.XX de Nombre"
- `format: 3` → "Te yapeó/plineó S/ XX.XX"
- `format: 4` → Solo monto "S/ XX.XX"

**Sources disponibles:**
- `"yape"` → Simula notificación de Yape
- `"plin"` → Simula notificación de Plin

### 3. **Simular Batch (Múltiples Notificaciones)**
```bash
POST http://localhost:3002/api/test/simulate-batch
Authorization: Bearer {token}
Content-Type: application/json

{
  "store_id": "uuid-de-la-tienda",
  "count": 5,
  "min_amount": 10.00,
  "max_amount": 500.00,
  "sources": ["yape", "plin"],
  "delay_ms": 1000
}
```

---

## 🚀 **Uso con PowerShell (Recomendado)**

### **Opción 1: Script Interactivo**
```powershell
cd backend
.\test-notifications.ps1
```

Este script incluye un menú interactivo con opciones:
1. 🔐 Login y listar tiendas
2. 📱 Simular 1 notificación de Yape
3. 📱 Simular 1 notificación de Plin
4. 🎲 Simular notificación aleatoria
5. 📊 Simular 5 notificaciones (batch)
6. 💥 Simular 20 notificaciones (stress test)

### **Opción 2: Comandos Manuales**

**1. Login:**
```powershell
$body = @{
    email = "propietario@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3002/api/auth/login" `
    -Method POST -Body $body -ContentType "application/json"

$token = $response.data.token
```

**2. Obtener tiendas:**
```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$stores = Invoke-RestMethod -Uri "http://localhost:3002/api/test/stores" `
    -Method GET -Headers $headers

$storeId = $stores.data.stores[0].id
```

**3. Simular notificación:**
```powershell
$body = @{
    store_id = $storeId
    amount = 50.00
    sender_name = "Juan Pérez"
    source = "yape"
    format = 1
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "http://localhost:3002/api/test/simulate-notification" `
    -Method POST -Headers $headers -Body $body -ContentType "application/json"

Write-Host "✅ Notificación simulada: $($result.data.notification.id)"
```

---

## 🧪 **Ejemplos de Pruebas**

### **Ejemplo 1: Notificación simple de Yape**
```json
POST /api/test/simulate-notification
{
  "store_id": "123e4567-e89b-12d3-a456-426614174000",
  "amount": 50.00,
  "sender_name": "Juan Pérez",
  "source": "yape",
  "format": 1
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "🧪 Notificación simulada exitosamente",
  "data": {
    "notification": {
      "id": "abc-123",
      "amount": 50.00,
      "sender_name": "Juan Pérez",
      "source": "yape",
      "workers_notified": 2
    },
    "simulation": {
      "format_used": 1,
      "messages": {
        "title": "Recibiste un Yape",
        "text": "Recibiste S/ 50.00",
        "bigText": "Juan Pérez te envió S/ 50.00 por Yape"
      },
      "workers": {
        "total": 2,
        "notified": 2,
        "tokens_available": 2
      }
    }
  }
}
```

### **Ejemplo 2: Batch de notificaciones aleatorias**
```json
POST /api/test/simulate-batch
{
  "store_id": "123e4567-e89b-12d3-a456-426614174000",
  "count": 10,
  "min_amount": 20.00,
  "max_amount": 300.00,
  "sources": ["yape", "plin"],
  "delay_ms": 2000
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "🧪 Iniciando simulación de 10 notificaciones",
  "data": {
    "store_id": "123e4567-e89b-12d3-a456-426614174000",
    "store_name": "Bodega El Dorado",
    "count": 10,
    "estimated_duration_seconds": 20
  }
}
```

---

## 📊 **Verificación de Resultados**

### **1. En el Backend (consola):**
```
🧪 SIMULANDO NOTIFICACIÓN:
   💰 Monto: S/ 50.00
   👤 De: Juan Pérez
   📱 Fuente: yape
   📝 Formato: 1
   🏪 Tienda: Bodega El Dorado
✅ Notificación creada con ID: abc-123
👷 Trabajadores activos: 2
🔔 Tokens FCM encontrados: 2
✅ FCM enviado a 2 trabajadores
```

### **2. En Supabase (base de datos):**
```sql
SELECT 
  id,
  amount,
  sender_name,
  source,
  message,
  notification_timestamp,
  workers_notified,
  raw_data
FROM notifications
WHERE raw_data->>'simulated' = 'true'
ORDER BY created_at DESC
LIMIT 10;
```

### **3. En la App (Flutter):**
Los trabajadores deberían recibir:
- 🔔 Push notification vía FCM
- 📱 Actualización en tiempo real en la lista de pagos
- 💰 Banner de "Nuevo pago recibido"

---

## 🎨 **Formatos de Mensaje Disponibles**

### **Formato 1: Estilo clásico**
```
Título: "Recibiste un Yape"
Texto: "Recibiste S/ 50.00"
BigText: "Juan Pérez te envió S/ 50.00 por Yape"
```

### **Formato 2: Con nombre destacado**
```
Título: "Nuevo pago de Juan Pérez"
Texto: "S/ 50.00 de Juan Pérez"
BigText: "¡Juan Pérez te yapeó S/ 50.00! 💰"
```

### **Formato 3: Casual**
```
Título: "Juan Pérez"
Texto: "Te yapeó S/ 50.00"
BigText: "Juan Pérez te yapeó S/ 50.00. ¡Revisa tu saldo!"
```

### **Formato 4: Minimalista**
```
Título: "Yape"
Texto: "S/ 50.00"
BigText: "Recibiste S/ 50.00 de Juan Pérez"
```

---

## ⚠️ **Notas Importantes**

1. **Los endpoints de test SOLO están disponibles en modo development**
   - Configurado en `backend/src/app.js`
   - No estarán disponibles en producción

2. **Requiere autenticación**
   - Necesitas hacer login primero
   - El token debe incluirse en el header `Authorization: Bearer {token}`

3. **Las notificaciones simuladas se marcan en la BD**
   - Campo `raw_data->>'simulated' = 'true'`
   - Esto permite identificarlas y limpiarlas después

4. **El batch es asíncrono**
   - El endpoint responde inmediatamente (202)
   - Las notificaciones se crean en background
   - Ver progreso en la consola del backend

---

## 🧹 **Limpiar Notificaciones de Prueba**

```sql
-- Ver cuántas notificaciones simuladas hay
SELECT COUNT(*) FROM notifications 
WHERE raw_data->>'simulated' = 'true';

-- Eliminar todas las notificaciones simuladas
DELETE FROM notifications 
WHERE raw_data->>'simulated' = 'true';
```

---

## 🚀 **Flujo de Testing Completo**

1. **Iniciar backend:**
```bash
cd backend
node server.js
```

2. **Ejecutar script de testing:**
```powershell
.\test-notifications.ps1
```

3. **Seleccionar opción 1** (Login y listar tiendas)

4. **Seleccionar opción 2-6** (Simular notificaciones)

5. **Verificar en la app** que las notificaciones lleguen

6. **Verificar en Supabase** que se guardaron correctamente

---

## 📱 **Testing desde la App**

Cuando recibas una notificación simulada, deberías ver:

1. **Push notification** en la barra de notificaciones
2. **Badge** en el ícono de la app
3. **Actualización en tiempo real** en la lista de pagos
4. **Sonido/vibración** (si está configurado)

---

## 🐛 **Troubleshooting**

### **Error: "store_id no encontrado"**
- Ejecuta `GET /api/test/stores` para obtener un store_id válido

### **Error: "No hay tokens FCM"**
- Los trabajadores deben haber abierto la app al menos una vez
- Verifica en tabla `fcm_tokens` que existan registros

### **No llegan push notifications**
- Verifica que Firebase esté configurado correctamente
- Revisa que `serviceAccountKey.json` esté en el backend
- Verifica logs del backend para errores de FCM

### **Notificaciones no se muestran en la app**
- Verifica que el NotificationService esté inicializado
- Revisa que el stream esté conectado
- Verifica logs de Flutter con `flutter logs`

---

## ✅ **Checklist de Testing**

- [ ] Backend corriendo en localhost:3002
- [ ] Login exitoso con usuario owner/worker
- [ ] Obtener store_id válido
- [ ] Simular 1 notificación (Yape formato 1)
- [ ] Verificar en Supabase que se creó
- [ ] Verificar que llegó push notification
- [ ] Simular 1 notificación (Plin formato 2)
- [ ] Simular batch de 5 notificaciones
- [ ] Verificar que todas se crearon
- [ ] Limpiar notificaciones de prueba
