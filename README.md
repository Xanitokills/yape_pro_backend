# 🚀 YapePro Backend - API REST

Backend Node.js + Express para gestionar notificaciones de pagos de Yape/Plin.

---

## 📋 STACK TECNOLÓGICO

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** JWT
- **Notificaciones Push:** Firebase Cloud Messaging (FCM)
- **Deployment:** Heroku / Railway

---

## 🏗️ ARQUITECTURA

```
📱 Flutter App (Dueño)
    ↓
    📡 HTTP POST /api/notifications
    ↓
🖥️ Backend Node.js
    ├─ Guarda en Supabase (notifications table)
    ├─ Busca workers activos de esa tienda
    ├─ Obtiene FCM tokens
    └─ Envía notificación push via Firebase
    ↓
📱 Flutter Apps (Trabajadores)
```

---

## 🚀 INSTALACIÓN LOCAL

### 1. Clonar e Instalar Dependencias
```bash
cd backend
npm install
```

### 2. Configurar Variables de Entorno
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
# Supabase
SUPABASE_URL=https://tuproyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_KEY=tu_service_key

# JWT
JWT_SECRET=un_secreto_super_largo_minimo_32_caracteres

# Firebase (obtener de Firebase Console)
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_KEY_AQUI\n-----END PRIVATE KEY-----\n"
```

### 3. Crear Tablas en Supabase
```bash
# Ir a Supabase Dashboard > SQL Editor
# Copiar y ejecutar el contenido de: schema.sql
```

### 4. Ejecutar en Desarrollo
```bash
npm run dev
```

El servidor estará en: `http://localhost:3000`

---

## 📡 API ENDPOINTS

### **Auth**
```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
GET  /api/auth/me
```

### **Notifications**
```http
GET  /api/notifications?store_id=xxx&limit=50&offset=0
POST /api/notifications
POST /api/notifications/parse
GET  /api/notifications/stats?store_id=xxx&days=30
```

### **Stores**
```http
GET    /api/stores
POST   /api/stores
GET    /api/stores/:id
PUT    /api/stores/:id
DELETE /api/stores/:id
```

### **Workers**
```http
GET    /api/workers?store_id=xxx
POST   /api/workers
PUT    /api/workers/:id
DELETE /api/workers/:id
```

### **Health Check**
```http
GET /health
```

---

## 🔑 AUTENTICACIÓN

Todas las rutas (excepto `/health`, `/`, `/api/auth/login`, `/api/auth/register`) requieren token JWT.

### Obtener Token
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "owner@test.com",
  "password": "Owner123!"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "owner@test.com",
      "role": "owner"
    }
  }
}
```

### Usar Token
```bash
GET /api/notifications?store_id=xxx
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## 📱 INTEGRACIÓN CON FLUTTER

### 1. Crear Notificación desde Flutter

**Escenario:** La app del dueño captura una notificación de Yape y la envía al backend.

```dart
// Flutter (Dueño)
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<void> sendPaymentNotification({
  required String storeId,
  required double amount,
  required String senderName,
  required String source, // 'yape' o 'plin'
}) async {
  final url = Uri.parse('$API_URL/api/notifications');
  
  final response = await http.post(
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $userToken',
    },
    body: jsonEncode({
      'store_id': storeId,
      'amount': amount,
      'sender_name': senderName,
      'source': source,
      'notification_timestamp': DateTime.now().toIso8601String(),
    }),
  );
  
  if (response.statusCode == 201) {
    print('✅ Notificación enviada correctamente');
  } else {
    print('❌ Error: ${response.body}');
  }
}
```

### 2. Registrar Token FCM

**Escenario:** Trabajador abre la app y registra su token para recibir notificaciones.

```dart
// Flutter (Trabajador)
import 'package:firebase_messaging/firebase_messaging.dart';

Future<void> registerFCMToken() async {
  final fcmToken = await FirebaseMessaging.instance.getToken();
  
  if (fcmToken != null) {
    final url = Uri.parse('$API_URL/api/auth/register-fcm-token');
    
    await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $userToken',
      },
      body: jsonEncode({
        'token': fcmToken,
        'device_type': 'android',
      }),
    );
  }
}
```

### 3. Escuchar Notificaciones

```dart
// Flutter (Trabajador)
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  print('💰 Nuevo pago: ${message.notification?.title}');
  
  // Mostrar notificación local o actualizar UI
  if (message.data['type'] == 'payment_received') {
    final amount = message.data['amount'];
    final storeId = message.data['store_id'];
    
    // Actualizar lista de pagos
    // ...
  }
});
```

---

## 🚀 DEPLOYMENT

### **Heroku**

1. **Instalar Heroku CLI**
```bash
heroku login
```

2. **Crear App**
```bash
heroku create yapepro-backend
```

3. **Configurar Variables de Entorno**
```bash
heroku config:set NODE_ENV=production
heroku config:set SUPABASE_URL=https://...
heroku config:set SUPABASE_SERVICE_KEY=...
heroku config:set JWT_SECRET=...
heroku config:set FIREBASE_PROJECT_ID=...
heroku config:set FIREBASE_CLIENT_EMAIL=...
heroku config:set FIREBASE_PRIVATE_KEY="-----BEGIN..."
```

4. **Deploy**
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

5. **Ver Logs**
```bash
heroku logs --tail
```

---

### **Railway**

1. **Instalar Railway CLI**
```bash
npm install -g @railway/cli
railway login
```

2. **Inicializar Proyecto**
```bash
railway init
```

3. **Agregar Variables de Entorno**
```bash
railway variables set NODE_ENV=production
railway variables set SUPABASE_URL=https://...
railway variables set JWT_SECRET=...
# ... etc
```

4. **Deploy**
```bash
railway up
```

---

## 🧪 TESTING

### Test Manual con cURL

**1. Health Check**
```bash
curl http://localhost:3000/health
```

**2. Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@test.com",
    "password": "Owner123!"
  }'
```

**3. Crear Notificación**
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "store_id": "STORE_UUID",
    "amount": 25.50,
    "sender_name": "Carlos Ruiz",
    "source": "yape"
  }'
```

**4. Parsear Texto**
```bash
curl -X POST http://localhost:3000/api/notifications/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "text": "Recibiste S/ 50.00 de Juan Perez via Yape"
  }'
```

---

## 📝 VARIABLES DE ENTORNO

| Variable | Descripción | Requerida | Default |
|----------|-------------|-----------|---------|
| `NODE_ENV` | Entorno (development/production) | No | development |
| `PORT` | Puerto del servidor | No | 3000 |
| `SUPABASE_URL` | URL de Supabase | **Sí** | - |
| `SUPABASE_ANON_KEY` | Anon key de Supabase | **Sí** | - |
| `SUPABASE_SERVICE_KEY` | Service key de Supabase | **Sí** | - |
| `JWT_SECRET` | Secreto para firmar JWT | **Sí** | - |
| `JWT_EXPIRES_IN` | Tiempo de expiración del JWT | No | 7d |
| `FIREBASE_PROJECT_ID` | ID del proyecto Firebase | **Sí** | - |
| `FIREBASE_CLIENT_EMAIL` | Email del service account | **Sí** | - |
| `FIREBASE_PRIVATE_KEY` | Private key de Firebase | **Sí** | - |
| `CORS_ORIGIN` | Orígenes permitidos para CORS | No | * |

---

## 🔒 SEGURIDAD

### Best Practices Implementadas:

✅ **JWT con expiración**  
✅ **Bcrypt para passwords** (10 rounds)  
✅ **CORS configurado**  
✅ **Validación de inputs** (express-validator)  
✅ **Rate limiting** (TODO)  
✅ **HTTPS en producción**  

### TODO:
- [ ] Implementar rate limiting
- [ ] Helmet.js para headers de seguridad
- [ ] Logging con Winston
- [ ] Monitoreo con Sentry

---

## 🐛 TROUBLESHOOTING

### Error: "Firebase no configurado"
```
⚠️ Variables de Firebase no configuradas
```
**Solución:** Verifica que estén configuradas `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.

---

### Error: "Connection refused" (Supabase)
```
❌ Error al conectar con Supabase
```
**Solución:** 
1. Verifica `SUPABASE_URL` y `SUPABASE_SERVICE_KEY`
2. Asegúrate que Supabase esté activo
3. Revisa que las tablas existan (ejecutar `schema.sql`)

---

### Error: "JWT malformed"
```
❌ jwt malformed
```
**Solución:**
1. Token expirado → Hacer login nuevamente
2. Token inválido → Verificar que el token esté completo
3. `JWT_SECRET` cambió → Invalidar todos los tokens y generar nuevos

---

## 📊 ESTRUCTURA DEL PROYECTO

```
backend/
├── src/
│   ├── app.js                    # Configuración Express
│   ├── config/
│   │   ├── database.js           # Supabase client
│   │   ├── firebase.js           # Firebase Admin SDK
│   │   └── env.js                # Validación de env vars
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── notificationController.js
│   │   ├── storeController.js
│   │   └── workerController.js
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   ├── errorHandler.js       # Error handler global
│   │   └── validation.js         # Express-validator schemas
│   ├── routes/
│   │   ├── auth.js
│   │   ├── notifications.js
│   │   ├── stores.js
│   │   └── workers.js
│   └── services/
│       ├── fcmService.js         # Firebase Cloud Messaging
│       └── notificationParser.js # Parser de Yape/Plin
├── .env                          # Variables de entorno (NO subir a git)
├── .env.example                  # Ejemplo de .env
├── .gitignore
├── package.json
├── Procfile                      # Para Heroku
├── README.md                     # Este archivo
├── schema.sql                    # Schema de Supabase
└── server.js                     # Entry point
```

---

## 📞 SOPORTE

**Documentación completa:** Ver `TESTING_GUIDE.md`  
**Issues:** [GitHub Issues](#)  
**Email:** support@yapepro.com

---

## 📄 LICENCIA

ISC

---

**Última actualización:** 31/10/2025  
**Versión:** 1.0.0
