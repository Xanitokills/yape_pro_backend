# ✅ Fix: Owner ahora recibe notificaciones FCM

## 🎯 Problema Resuelto

**Antes:** Solo los **workers** (trabajadores) recibían notificaciones FCM cuando se simulaba una notificación.

**Ahora:** El **owner** (dueño) de la tienda **TAMBIÉN recibe las notificaciones FCM**.

## 📝 Cambios Realizados

### 1. `testController.js` - simulateNotification()

**Antes:**
```javascript
// Solo buscar tokens de workers
const workerIds = workers?.map(w => w.user_id) || [];
const { data: fcmTokens } = await supabase
  .from('fcm_tokens')
  .select('token, user_id')
  .in('user_id', workerIds)  // ❌ Solo workers
  .eq('is_active', true);
```

**Después:**
```javascript
// Agregar owner a la lista de usuarios a notificar
const workerIds = workers?.map(w => w.user_id) || [];
const userIdsToNotify = [...workerIds];
if (store.owner_id && !userIdsToNotify.includes(store.owner_id)) {
  userIdsToNotify.push(store.owner_id);
  console.log(`👤 Owner agregado a notificaciones: ${store.owner_id}`);
}

const { data: fcmTokens } = await supabase
  .from('fcm_tokens')
  .select('token, user_id')
  .in('user_id', userIdsToNotify)  // ✅ Workers + Owner
  .eq('is_active', true);
```

### 2. `notificationController.js` - createNotification()

**Antes:**
```javascript
// Solo buscar tokens de workers
const workerIds = workers?.map(w => w.user_id) || [];
const { data: fcmTokens } = await supabase
  .from('fcm_tokens')
  .select('token, user_id')
  .in('user_id', workerIds)  // ❌ Solo workers
  .eq('is_active', true);
```

**Después:**
```javascript
// Agregar owner a la lista de usuarios a notificar
const workerIds = workers?.map(w => w.user_id) || [];
const userIdsToNotify = [...workerIds];
if (store.owner_id && !userIdsToNotify.includes(store.owner_id)) {
  userIdsToNotify.push(store.owner_id);
}

const { data: fcmTokens } = await supabase
  .from('fcm_tokens')
  .select('token, user_id')
  .in('user_id', userIdsToNotify)  // ✅ Workers + Owner
  .eq('is_active', true);
```

## 🚀 Cómo Probar

### 1. Asegúrate de tener token FCM del owner

El owner debe haber iniciado sesión en la app Flutter y tener un token FCM registrado en la tabla `fcm_tokens`:

```sql
-- Verificar que el owner tiene token FCM
SELECT 
  u.email,
  u.role,
  ft.token,
  ft.is_active,
  ft.created_at
FROM fcm_tokens ft
JOIN users u ON ft.user_id = u.id
WHERE u.role = 'owner' 
AND u.email = 'owner@test.com'
AND ft.is_active = true;
```

Si no tiene token, debes:
1. Abrir la app Flutter
2. Iniciar sesión como owner
3. La app automáticamente registrará el token FCM

### 2. Ejecutar Migración de raw_data (si aún no lo hiciste)

```sql
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_notifications_raw_data_simulated 
ON notifications ((raw_data->>'simulated'));
```

### 3. Simular Notificación

**Opción A: Desde la Interfaz Web**

1. Abre: http://localhost:3002/test-ui/test-notifications.html
2. Login con `owner@test.com` / `password`
3. Cargar tiendas y seleccionar una
4. Simular notificación
5. **Revisa la app Flutter del owner** - Debería recibir la notificación FCM 🎉

**Opción B: Desde PowerShell**

```powershell
cd backend
.\test-endpoint.ps1
```

### 4. Verificar en Logs del Backend

Deberías ver:
```
👤 Owner agregado a notificaciones: [owner-uuid]
🔔 Tokens FCM encontrados: 1 (0 workers + owner)
✅ FCM enviado a 1 trabajadores
```

## 📱 Comportamiento en la App Flutter

Ahora cuando simules una notificación:

1. **El owner recibirá una notificación FCM** en su dispositivo
2. **La notificación aparecerá en el sistema Android/iOS**
3. **Al abrir la notificación**, debería llevarte a la pantalla de notificaciones
4. **La notificación se mostrará en la lista** de notificaciones de la tienda

## 🔍 Verificar Notificaciones en Base de Datos

```sql
-- Ver últimas notificaciones simuladas
SELECT 
  n.id,
  n.amount,
  n.sender_name,
  n.source,
  n.workers_notified,
  n.raw_data->>'simulated' as is_simulated,
  n.created_at,
  s.name as store_name,
  u.email as owner_email
FROM notifications n
JOIN stores s ON n.store_id = s.id
JOIN users u ON s.owner_id = u.id
WHERE n.raw_data->>'simulated' = 'true'
ORDER BY n.created_at DESC
LIMIT 10;
```

## 💡 Importante

- **El owner debe tener token FCM activo** en la tabla `fcm_tokens`
- Si no recibes notificaciones, verifica:
  1. Que la app Flutter esté abierta o en background
  2. Que el usuario esté logueado como owner
  3. Que el token FCM esté registrado en la BD
  4. Que Firebase esté correctamente configurado

## 🎯 Próximos Pasos

1. ✅ Ejecutar migración SQL de `raw_data` en Supabase
2. ✅ Abrir la app Flutter como owner
3. ✅ Simular notificación desde la interfaz web
4. ✅ Verificar que el owner recibe la notificación FCM
5. ✅ Verificar que la notificación aparece en la lista de la app

---

**¡Ahora el owner también recibe notificaciones! 🚀**
