# 🚀 Yape Pro Backend

Backend API para **Yape Pro** - Sistema de gestión de notificaciones de pagos para tiendas.

**Stack:** Node.js + Express + Supabase (PostgreSQL) + JWT + Firebase FCM

---

## 📋 Características

- ✅ **Autenticación JWT** (registro, login, perfil)
- ✅ **Gestión de tiendas** (CRUD completo)
- ✅ **Gestión de trabajadores** (asignar, listar, eliminar)
- ✅ **Notificaciones de pago** (crear, listar, estadísticas)
- ✅ **Notificaciones Push** con Firebase FCM
- ✅ **Parser inteligente** de notificaciones de Yape, Plin, BCP
- ✅ **Sistema de roles** (super_admin, owner, worker)
- ✅ **Validaciones** con express-validator y Joi
- ✅ **Manejo de errores** centralizado

---

## 🛠️ Requisitos Previos

- **Node.js** 18+ ([Descargar](https://nodejs.org/))
- **Cuenta en Supabase** ([Crear gratis](https://supabase.com))
- **Cuenta en Firebase** (opcional, para notificaciones push) ([Crear](https://console.firebase.google.com/))

---

## 🚀 Instalación Rápida

### 1. Clonar o crear el proyecto

```bash
cd D:\Dobleteos\Yape_Smart\backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
copy .env.example .env
```

Luego edita `.env` con tus credenciales:

```env
NODE_ENV=development
PORT=3000

# Supabase (obtener de https://supabase.com/dashboard)
SUPABASE_URL=https://tuproyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_KEY=tu_service_key_aqui

# JWT (generar uno aleatorio de 32+ caracteres)
JWT_SECRET=tu_secreto_super_seguro_de_32_caracteres_minimo
JWT_EXPIRES_IN=7d

# Firebase (opcional - para notificaciones push)
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_AQUI\n-----END PRIVATE KEY-----\n"

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 4. Configurar Base de Datos en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Click en **SQL Editor**
3. Copia y pega el contenido de `schema.sql`
4. Click en **Run** para ejecutar

### 5. Ejecutar el servidor

**Modo desarrollo** (con auto-reload):
```bash
npm run dev
```

**Modo producción**:
```bash
npm start
```

Deberías ver:
```
🚀 Server running on http://localhost:3000
🌍 Environment: development
✅ Supabase conectado correctamente
```

---

## 📚 Documentación de API

### Base URL
```
http://localhost:3000/api
```

### Endpoints Principales

#### 🔐 Autenticación (`/api/auth`)

**Registro**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "MiPassword123!",
  "full_name": "Juan Pérez",
  "phone": "+51987654321",
  "role": "owner"
}
```

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "MiPassword123!"
}
```

Respuesta:
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@ejemplo.com",
      "full_name": "Juan Pérez",
      "role": "owner"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Obtener perfil** (requiere autenticación)
```http
GET /api/auth/me
Authorization: Bearer TOKEN_AQUI
```

#### 🏪 Tiendas (`/api/stores`)

**Listar tiendas**
```http
GET /api/stores
Authorization: Bearer TOKEN
```

**Crear tienda** (solo owner/super_admin)
```http
POST /api/stores
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "Mi Bodega",
  "description": "Bodega del barrio",
  "address": "Av. Principal 123",
  "phone": "987654321"
}
```

**Obtener estadísticas**
```http
GET /api/stores/:id/stats
Authorization: Bearer TOKEN
```

#### 👥 Trabajadores (`/api/workers`)

**Listar trabajadores**
```http
GET /api/workers?store_id=UUID_TIENDA
Authorization: Bearer TOKEN
```

**Agregar trabajador**
```http
POST /api/workers
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "store_id": "uuid-tienda",
  "user_id": "uuid-usuario",
  "position": "Cajero"
}
```

**Buscar usuarios**
```http
GET /api/workers/search?email=juan@ejemplo.com
Authorization: Bearer TOKEN
```

#### 📱 Notificaciones (`/api/notifications`)

**Listar notificaciones**
```http
GET /api/notifications?store_id=UUID&limit=50&offset=0
Authorization: Bearer TOKEN
```

**Crear notificación**
```http
POST /api/notifications
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "store_id": "uuid-tienda",
  "amount": 50.00,
  "sender_name": "Juan Pérez",
  "source": "yape",
  "message": "Recibiste S/ 50.00 de Juan Pérez via Yape"
}
```

**Parsear notificación desde texto**
```http
POST /api/notifications/parse
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "text": "Recibiste S/ 50.00 de Juan Pérez via Yape",
  "store_id": "uuid-tienda"
}
```

**Estadísticas**
```http
GET /api/notifications/stats?store_id=UUID&days=30
Authorization: Bearer TOKEN
```

---

## 🧪 Probar con cURL (PowerShell)

```powershell
# 1. Registrar usuario
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@test.com\",\"password\":\"Test123!\",\"full_name\":\"Usuario Test\",\"role\":\"owner\"}'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@test.com\",\"password\":\"Test123!\"}'

# Copiar el token de la respuesta

# 3. Obtener perfil
curl http://localhost:3000/api/auth/me `
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## 🔥 Configurar Firebase (Opcional)

Para habilitar notificaciones push:

### 1. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Ve a **Project Settings** (ícono engranaje)
4. Pestaña **Service accounts**
5. Click **Generate new private key**
6. Se descargará un archivo JSON

### 2. Extraer credenciales

Del archivo JSON descargado, extrae:

```json
{
  "project_id": "tu-proyecto-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com"
}
```

### 3. Agregar a `.env`

```env
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE\n-----END PRIVATE KEY-----\n"
```

**Nota:** La clave privada debe mantener los `\n` para los saltos de línea.

---

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/           # Configuraciones
│   │   ├── database.js   # Conexión Supabase
│   │   ├── firebase.js   # Firebase Admin SDK
│   │   └── env.js        # Variables de entorno
│   │
│   ├── controllers/      # Lógica de negocio
│   │   ├── authController.js
│   │   ├── storeController.js
│   │   ├── workerController.js
│   │   └── notificationController.js
│   │
│   ├── middleware/       # Middleware personalizados
│   │   ├── auth.js       # Autenticación JWT
│   │   ├── validation.js # Validaciones
│   │   └── errorHandler.js
│   │
│   ├── routes/           # Definición de rutas
│   │   ├── auth.js
│   │   ├── stores.js
│   │   ├── workers.js
│   │   └── notifications.js
│   │
│   ├── services/         # Servicios externos
│   │   ├── fcmService.js # Firebase Cloud Messaging
│   │   └── notificationParser.js
│   │
│   └── app.js            # Configuración Express
│
├── .env                  # Variables de entorno (no subir a Git)
├── .env.example          # Plantilla de variables
├── .gitignore
├── package.json
├── schema.sql            # Schema de base de datos
├── server.js             # Entry point
└── README.md
```

---

## 🔒 Sistema de Roles

| Rol | Permisos |
|-----|----------|
| **super_admin** | Acceso total a todo |
| **owner** | Gestiona sus tiendas, trabajadores y notificaciones |
| **worker** | Solo ve notificaciones de las tiendas donde trabaja |

---

## 🐛 Solución de Problemas

### Error: "Faltan variables de entorno de Supabase"

✅ Verifica que `.env` tenga `SUPABASE_URL` y `SUPABASE_SERVICE_KEY`

### Error: "Firebase no configurado"

⚠️ Las notificaciones push no funcionarán, pero el resto del API sí. Configura Firebase siguiendo la sección anterior.

### Error al conectar a Supabase

1. Verifica que el proyecto de Supabase esté activo
2. Comprueba que las credenciales en `.env` sean correctas
3. Asegúrate de haber ejecutado `schema.sql`

### Puerto 3000 ocupado

Cambia el puerto en `.env`:
```env
PORT=8080
```

---

## 📦 Despliegue a Producción

### Opción 1: Railway

1. Ve a [Railway.app](https://railway.app/)
2. Conecta tu repositorio de GitHub
3. Agrega las variables de entorno
4. Deploy automático ✅

### Opción 2: Render

1. Ve a [Render.com](https://render.com/)
2. New Web Service
3. Conecta tu repo
4. Build command: `npm install`
5. Start command: `npm start`
6. Agrega variables de entorno

### Variables de entorno para producción

```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=tu_url
SUPABASE_SERVICE_KEY=tu_key
JWT_SECRET=secreto_seguro_32_caracteres
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
CORS_ORIGIN=https://tu-frontend.com
```

---

## 🧪 Testing

```bash
# Instalar dependencias de testing (futuro)
npm install --save-dev jest supertest

# Ejecutar tests
npm test
```

---

## 📄 Licencia

ISC

---

## 👨‍💻 Autor

Proyecto Yape Pro Backend - 2025

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📞 Soporte

Si tienes problemas:

1. Revisa la sección **Solución de Problemas**
2. Verifica que las variables de entorno estén correctas
3. Consulta los logs del servidor

---

**¡Disfruta construyendo con Yape Pro Backend! 🚀**
