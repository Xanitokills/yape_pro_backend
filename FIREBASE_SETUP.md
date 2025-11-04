# 🔥 Configuración de Firebase - Guía Completa

## ✅ Estado Actual

### Backend
- ✅ Firebase Admin SDK configurado correctamente
- ✅ Variables de entorno configuradas en `.env`
- ✅ Proyecto: `yapepro-f6e50`
- ✅ Service Account Email: `firebase-adminsdk-fbsvc@yapepro-f6e50.iam.gserviceaccount.com`
- ✅ Endpoint disponible: `POST /api/auth/fcm-token` (requiere autenticación)

### Flutter App
- ✅ `google-services.json` presente en `android/app/`
- ✅ Firebase configurado en `main.dart`
- ❌ **Token FCM NO se registra en la base de datos**
- ❌ **No se llama al endpoint `/api/auth/fcm-token` después del login**

## ❌ Problema Detectado

Cuando haces login en la app Flutter:
1. ✅ El usuario se autentica correctamente
2. ✅ Se obtiene el token JWT
3. ✅ Firebase obtiene el token FCM local
4. ❌ **NO se envía el token FCM al backend**
5. ❌ **NO se guarda en la tabla `fcm_tokens`**
6. ❌ Por eso cuando simulas notificaciones: **"🔔 Tokens FCM encontrados: 0"**

## 🔧 Solución Rápida

### Opción 1: Registrar Token Manualmente (Testing)

Puedes registrar el token manualmente en Supabase para probar:

1. **Obtener el token FCM desde los logs de Flutter:**
   - Abre la app Flutter
   - Busca en los logs: `🔑 FCM Token: xxxxxxxx`
   - Copia el token completo

2. **Insertar en Supabase:**
   ```sql
   -- Reemplaza los valores:
   -- [USER_ID] = El ID del usuario owner (puedes obtenerlo con: SELECT id FROM users WHERE email = 'owner@test.com')
   -- [FCM_TOKEN] = El token que copiaste de los logs
   
   INSERT INTO fcm_tokens (user_id, token, device_type, is_active)
   VALUES (
     'b040efc6-400c-4565-81bd-a57b61e1a585',  -- Tu owner_id
     'TU_TOKEN_FCM_AQUI',  -- Pegar el token completo
     'android',
     true
   )
   ON CONFLICT (user_id, token) 
   DO UPDATE SET is_active = true, updated_at = NOW();
   ```

3. **Verificar:**
   ```sql
   SELECT 
     u.email,
     u.role,
     ft.token,
     ft.is_active,
     ft.created_at
   FROM fcm_tokens ft
   JOIN users u ON ft.user_id = u.id
   WHERE u.email = 'owner@test.com';
   ```

4. **Simular notificación de nuevo:**
   - Ve a http://localhost:3002/test-ui/test-notifications.html
   - Simula una notificación
   - Ahora deberías ver: **"🔔 Tokens FCM encontrados: 1"**
   - **¡Deberías recibir la notificación en tu dispositivo! 🎉**

### Opción 2: Modificar Flutter para Registro Automático (Solución Permanente)

Necesitas modificar el login en Flutter para que registre el token automáticamente.

**Archivos a modificar:**

1. **`lib/screens/login_screen.dart`** o donde manejes el login
2. Después del login exitoso, agregar:

```dart
// Después de login exitoso y guardar token JWT
final fcmToken = await FirebaseMessaging.instance.getToken();
if (fcmToken != null) {
  await ApiService.registerFCMToken(
    fcmToken: fcmToken,
    deviceType: 'android',
  );
}
```

**El método `registerFCMToken` YA EXISTE en `api_service.dart`:**
```dart
static Future<ApiResponse> registerFCMToken({
  required String fcmToken,
  String deviceType = 'android',
}) async {
  // ... código ya existe
}
```

**Solo necesitas LLAMARLO después del login.**

## 📊 Verificación

### 1. Verificar Token FCM en Logs de Flutter

Abre la terminal de Flutter y busca:
```
🔑 FCM Token: fXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Si no aparece, verifica:
- ✅ Firebase está inicializado en `main.dart`
- ✅ `google-services.json` está en `android/app/`
- ✅ Permisos de notificaciones otorgados

### 2. Verificar en Base de Datos

```sql
-- Contar tokens FCM por rol
SELECT 
  u.role,
  COUNT(*) as token_count
FROM fcm_tokens ft
JOIN users u ON ft.user_id = u.id
WHERE ft.is_active = true
GROUP BY u.role;
```

Deberías ver algo como:
```
role    | token_count
--------|------------
owner   | 1
worker  | 0
```

### 3. Probar Notificaciones

1. Simula una notificación desde la interfaz web
2. Revisa los logs del backend:
   ```
   👤 Owner agregado a notificaciones: b040efc6-400c-4565-81bd-a57b61e1a585
   🔔 Tokens FCM encontrados: 1 (0 workers + owner)
   ✅ FCM enviado a 1 trabajadores
   ```
3. **Deberías recibir la notificación en tu dispositivo** 📱

## 🚨 Troubleshooting

### "Token FCM no aparece en logs"

**Solución:**
1. Verifica que Firebase esté inicializado en `main.dart`
2. Verifica permisos de notificaciones en Android
3. Intenta reinstalar la app

### "Error al registrar token FCM"

**Posibles causas:**
- Token JWT expirado o inválido
- Endpoint backend no responde
- Error de red

**Solución:**
```dart
try {
  await ApiService.registerFCMToken(fcmToken: token, deviceType: 'android');
  print('✅ Token FCM registrado en backend');
} catch (e) {
  print('❌ Error al registrar FCM: $e');
}
```

### "No recibo notificaciones"

**Checklist:**
1. ✅ Token FCM está en la tabla `fcm_tokens` con `is_active = true`
2. ✅ Firebase configurado correctamente en backend (`.env`)
3. ✅ App está en primer plano o background (no cerrada completamente)
4. ✅ Permisos de notificaciones otorgados en Android
5. ✅ `google-services.json` correcto y actualizado

## 📝 Resumen

**Para que las notificaciones funcionen:**

1. ✅ **Backend:** Firebase ya está configurado ✅
2. ✅ **Backend:** Endpoint `/api/auth/fcm-token` existe ✅
3. ❌ **Flutter:** Necesitas registrar el token FCM después del login
4. ❌ **Flutter:** O insertar manualmente en Supabase para testing

**Solución más rápida (Opción 1):**
- Copia el token FCM de los logs de Flutter
- Inserta en Supabase con el SQL de arriba
- Simula notificación
- ¡Deberías recibirla! 🎉

**Solución permanente (Opción 2):**
- Modificar Flutter para llamar `ApiService.registerFCMToken()` después del login
- Esto guardará el token automáticamente en cada login

---

**¿Qué prefieres hacer primero?**
1. Registrar el token manualmente para probar ahora ⚡
2. Modificar Flutter para registro automático 🔧

<function_calls>
<invoke name="read_file">
<parameter name="filePath">d:\Dobleteos\Yape_Smart\backend\src\routes\auth.js