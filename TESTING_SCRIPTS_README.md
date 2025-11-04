# 🧪 Scripts de Testing - Guía de Uso

## 📋 Descripción

Se crearon 3 scripts PowerShell para probar el sistema de notificaciones simuladas:

1. **`test-notifications-simple.ps1`** - Script automático simple
2. **`test-menu.ps1`** - Script interactivo con menú
3. **`test-notifications.ps1`** - Script completo (tiene errores de sintaxis)

## 🚀 Uso Rápido

### **Paso 1: Iniciar Backend** (Terminal separada)

```powershell
# Terminal 1 - Backend
cd backend
node server.js
```

**Debe mostrar:**
```
✅ Firebase Admin SDK inicializado correctamente
🧪 Test endpoints habilitados en /api/test
🚀 Server running on http://localhost:3002
```

### **Paso 2: Ejecutar Script de Testing**

#### **Opción A: Script Simple (Automático)**
```powershell
# Terminal 2 - Testing
cd backend
.\test-notifications-simple.ps1
```

**Esto hará:**
1. Login automático
2. Listar tiendas
3. Simular 1 notificación de Yape
4. Mostrar resultados

#### **Opción B: Script Interactivo (Menú)**
```powershell
# Terminal 2 - Testing
cd backend
.\test-menu.ps1
```

**Menú interactivo:**
```
🧪 YAPE PRO - Testing de Notificaciones
========================================

OPCIONES:
1. 🔐 Login
2. 🏪 Listar tiendas
3. 📱 Simular 1 notificación Yape
4. 📱 Simular 1 notificación Plin
5. 📊 Simular 5 notificaciones (batch)
6. 🚪 Salir
```

**Flujo recomendado:**
1. Seleccionar opción **1** (Login)
2. Seleccionar opción **2** (Listar tiendas)
3. Seleccionar opción **3, 4 o 5** (Simular notificaciones)

## 🔧 Testing Manual con PowerShell

Si prefieres usar comandos directos:

```powershell
# 1. Login
$body = @{
    email = "propietario@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3002/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

$token = $response.data.token
Write-Host "Token: $token"

# 2. Obtener tiendas
$headers = @{ "Authorization" = "Bearer $token" }
$stores = Invoke-RestMethod -Uri "http://localhost:3002/api/test/stores" `
    -Method GET `
    -Headers $headers

$storeId = $stores.data.stores[0].id
Write-Host "Store ID: $storeId"

# 3. Simular notificación
$notifBody = @{
    store_id = $storeId
    amount = 50.00
    sender_name = "Juan Pérez"
    source = "yape"
    format = 1
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "http://localhost:3002/api/test/simulate-notification" `
    -Method POST `
    -Headers $headers `
    -Body $notifBody `
    -ContentType "application/json"

Write-Host "✅ Notificación ID: $($result.data.notification.id)"
Write-Host "📱 Trabajadores notificados: $($result.data.notification.workers_notified)"
```

## 📊 Verificar Resultados

### **1. En la consola del backend:**
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

### **2. En Supabase:**
```sql
SELECT * FROM notifications 
WHERE raw_data->>'simulated' = 'true'
ORDER BY created_at DESC
LIMIT 5;
```

### **3. En la App (si está abierta):**
- Los trabajadores deben recibir push notification
- La notificación debe aparecer en la lista de pagos

## 🐛 Troubleshooting

### **Error: "No se puede conectar"**
- Verifica que el backend esté corriendo en `http://localhost:3002`
- Ejecuta: `curl http://localhost:3002/health`

### **Error: "Login failed"**
- Verifica que exista el usuario en Supabase:
  ```sql
  SELECT * FROM users WHERE email = 'propietario@example.com';
  ```
- Si no existe, créalo primero desde la app

### **Error: "No hay tiendas"**
- Crea una tienda desde la app
- O inserta una en Supabase:
  ```sql
  INSERT INTO stores (owner_id, name, address) 
  VALUES ('user-id', 'Tienda de Prueba', 'Av. Test 123');
  ```

### **No llegan notificaciones FCM**
- Verifica que los trabajadores tengan tokens FCM en la tabla `fcm_tokens`
- Verifica que Firebase esté configurado correctamente
- Revisa el archivo `serviceAccountKey.json`

## 📝 Notas

- Los endpoints de testing **solo están disponibles en development**
- Las notificaciones simuladas se marcan con `raw_data.simulated = true`
- Puedes limpiarlas con: `DELETE FROM notifications WHERE raw_data->>'simulated' = 'true';`

## ✅ Checklist Rápido

- [ ] Backend corriendo (`node server.js`)
- [ ] Mensaje "🧪 Test endpoints habilitados" visible
- [ ] Usuario creado en BD
- [ ] Al menos 1 tienda existe
- [ ] Script ejecutado exitosamente
- [ ] Notificación creada en BD
- [ ] Push notifications enviadas

---

**¿Problemas?** Revisa el archivo `TEST_NOTIFICATIONS_GUIDE.md` para más detalles.
