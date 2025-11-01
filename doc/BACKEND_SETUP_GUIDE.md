# 🚀 Backend Yape Pro - Guía Técnica Completa
## Node.js + Express + Supabase + Firebase FCM

**Versión:** 1.0.0  
**Fecha:** Octubre 2025  
**Stack:** Node.js 18+ | Express 4.x | PostgreSQL (Supabase) | JWT Auth | Firebase FCM

---

## 📋 Decisión de Arquitectura

### ✅ Stack Seleccionado:

```javascript
const stack = {
  backend: "Node.js + Express",
  database: "Supabase (PostgreSQL)",
  auth: "JWT (manejo propio)",       // ⭐ TÚ controlas
  push: "Firebase FCM",               // Solo para notificaciones
  hosting: "Railway / Render"
};
```

### 🔐 Autenticación: JWT Propio (Recomendado)

**¿Por qué JWT en lugar de Firebase Auth?**

| Aspecto | JWT Propio | Firebase Auth |
|---------|------------|---------------|
| **Control** | Total | Limitado |
| **Costo** | Gratis | Gratis hasta 50k MAU, luego $$ |
| **Flexibilidad** | Alta | Media |
| **Complejidad** | Media | Baja |
| **Vendor Lock-in** | No | Sí (Google) |
| **Roles custom** | Fácil | Requiere Claims |

**Para Yape Pro:** JWT es mejor porque:
- ✅ Roles complejos (super_admin, owner, worker)
- ✅ Lógica de negocio personalizada
- ✅ No dependes de servicios externos
- ✅ Firebase SOLO para push notifications (gratis)

---

## 📂 Estructura del Proyecto

```
yape_pro_backend/
│
├── src/
│   ├── config/
│   │   ├── database.js           # Conexión Supabase
│   │   ├── firebase.js           # Firebase Admin SDK
│   │   └── env.js                # Configuración de entorno
│   │
│   ├── controllers/
│   │   ├── authController.js     # Login, Register
│   │   ├── notificationController.js
│   │   ├── storeController.js
│   │   └── workerController.js
│   │
│   ├── middleware/
│   │   ├── auth.js               # Verificar JWT
│   │   ├── validation.js
│   │   └── errorHandler.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── notifications.js
│   │   ├── stores.js
│   │   └── workers.js
│   │
│   ├── services/
│   │   ├── fcmService.js         # Enviar push
│   │   └── notificationParser.js
│   │
│   └── app.js
│
├── .env.example
├── package.json
└── server.js
```

---

## ⚙️ Paso 1: Inicializar Proyecto

```bash
# Crear carpeta fuera del proyecto Flutter
cd D:\Dobleteos\Yape_Smart
mkdir yape_pro_backend
cd yape_pro_backend

# Inicializar Node.js
npm init -y

# Instalar dependencias
npm install express cors dotenv bcrypt jsonwebtoken
npm install @supabase/supabase-js pg
npm install firebase-admin
npm install joi express-validator

# Desarrollo
npm install --save-dev nodemon
```

---

## 📦 package.json

```json
{
  "name": "yape-pro-backend",
  "version": "1.0.0",
  "description": "Backend API para Yape Pro",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.38.4",
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-validator": "^7.0.1",
    "firebase-admin": "^12.0.0",
    "joi": "^17.11.0",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## 🔧 Paso 2: Configurar Supabase

### 2.1 Crear cuenta en Supabase

1. Ir a https://supabase.com
2. Crear cuenta gratis
3. Click "New Project"
4. Copiar:
   - Project URL: `https://xxxxxxx.supabase.co`
   - Anon key: `eyJhbGciOi...`
   - Service key: `eyJhbGciOi...` (Settings → API)

### 2.2 Crear archivo .env

```bash
# .env

NODE_ENV=development
PORT=3000

# Supabase
SUPABASE_URL=https://tuproyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_KEY=tu_service_key

# JWT
JWT_SECRET=cambiar_por_algo_super_secreto_min_32_caracteres
JWT_EXPIRES_IN=7d

# Firebase (lo configuraremos después)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 2.3 Crear tablas en Supabase

1. Ir al panel de Supabase
2. Click en "SQL Editor"
3. Copiar y pegar este SQL:

```sql
-- Crear tabla de usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) CHECK (role IN ('super_admin', 'owner', 'worker')) DEFAULT 'worker',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Crear tabla de tiendas
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address VARCHAR(500),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de trabajadores (relación)
CREATE TABLE workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    position VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, user_id)
);

-- Crear tabla de notificaciones
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    sender_name VARCHAR(255),
    source VARCHAR(20) CHECK (source IN ('yape', 'plin', 'bcp', 'other')) NOT NULL,
    message TEXT,
    notification_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    processed BOOLEAN DEFAULT false,
    workers_notified INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de tokens FCM
CREATE TABLE fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    device_type VARCHAR(20) CHECK (device_type IN ('android', 'ios', 'web')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- Crear tabla de refresh tokens
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_stores_owner ON stores(owner_id);
CREATE INDEX idx_workers_store ON workers(store_id);
CREATE INDEX idx_notifications_store ON notifications(store_id);
CREATE INDEX idx_notifications_timestamp ON notifications(notification_timestamp DESC);
CREATE INDEX idx_fcm_tokens_user ON fcm_tokens(user_id);

-- Insertar usuario de prueba
-- Email: admin@yapepro.com
-- Password: Admin123!
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
    'admin@yapepro.com',
    '$2b$10$rN5W6V6qXxZqXqXqXqXqXeXqXqXqXqXqXqXqXqXqXqXqXqXqXqXq',
    'Super Admin',
    'super_admin'
);
```

4. Click "Run" para ejecutar

---

## 💻 Paso 3: Código del Backend

### server.js (Entry point)

```javascript
// server.js
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = server;
```

### src/config/database.js

```javascript
// src/config/database.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('⚠️ Faltan variables de entorno de Supabase');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test de conexión
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Supabase conectado correctamente');
  } catch (error) {
    console.error('❌ Error conectando a Supabase:', error.message);
  }
}

testConnection();

module.exports = { supabase };
```

### src/app.js

```javascript
// src/app.js
const express = require('express');
const cors = require('cors');

// Importar rutas
const authRoutes = require('./routes/auth');
const notificationRoutes = require('./routes/notifications');
const storeRoutes = require('./routes/stores');
const workerRoutes = require('./routes/workers');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*'
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Raíz del API
app.get('/', (req, res) => {
  res.json({
    name: 'Yape Pro API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      notifications: '/api/notifications',
      stores: '/api/stores',
      workers: '/api/workers'
    }
  });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/workers', workerRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `La ruta ${req.method} ${req.url} no existe`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.statusCode || 500).json({
    error: 'Error del servidor',
    message: err.message
  });
});

module.exports = app;
```

### src/middleware/auth.js

```javascript
// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');

/**
 * Middleware para verificar JWT
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Token no proporcionado'
      });
    }
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el usuario existe y está activo
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, is_active')
      .eq('id', decoded.userId)
      .single();
    
    if (error || !user || !user.is_active) {
      return res.status(403).json({
        error: 'Usuario inválido o inactivo'
      });
    }
    
    // Agregar usuario al request
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        error: 'Token expirado'
      });
    }
    
    res.status(403).json({
      error: 'Token inválido'
    });
  }
}

/**
 * Middleware para verificar roles
 */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: `Requiere rol: ${roles.join(', ')}`
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles
};
```

### src/controllers/authController.js

```javascript
// src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');

/**
 * Generar JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Registro
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { email, password, full_name, phone, role = 'worker' } = req.body;
    
    // Validaciones
    if (!email || !password || !full_name) {
      return res.status(400).json({
        error: 'Datos incompletos'
      });
    }
    
    if (password.length < 8) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 8 caracteres'
      });
    }
    
    // Verificar si existe
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existing) {
      return res.status(409).json({
        error: 'Email ya registrado'
      });
    }
    
    // Hashear contraseña
    const password_hash = await bcrypt.hash(password, 10);
    
    // Crear usuario
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash,
        full_name,
        phone,
        role
      })
      .select('id, email, full_name, role')
      .single();
    
    if (error) throw error;
    
    // Generar token
    const token = generateToken(user);
    
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user,
        token
      }
    });
    
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      error: 'Error al registrar usuario'
    });
  }
}

/**
 * Login
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña requeridos'
      });
    }
    
    // Buscar usuario
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, full_name, role, is_active')
      .eq('email', email)
      .single();
    
    if (error || !user) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }
    
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Cuenta desactivada'
      });
    }
    
    // Verificar contraseña
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }
    
    // Actualizar último login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);
    
    // Generar token
    const token = generateToken(user);
    
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        },
        token
      }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error al iniciar sesión'
    });
  }
}

/**
 * Obtener perfil
 * GET /api/auth/me
 */
async function getProfile(req, res) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, phone, role, created_at, last_login')
      .eq('id', req.user.userId)
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: { user }
    });
    
  } catch (error) {
    console.error('Error en getProfile:', error);
    res.status(500).json({
      error: 'Error al obtener perfil'
    });
  }
}

module.exports = {
  register,
  login,
  getProfile
};
```

### src/routes/auth.js

```javascript
// src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rutas protegidas
router.get('/me', authenticateToken, authController.getProfile);

module.exports = router;
```

### src/routes/notifications.js (Placeholder)

```javascript
// src/routes/notifications.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// TODO: Implementar controllers
router.get('/', authenticateToken, (req, res) => {
  res.json({ message: 'Lista de notificaciones - Por implementar' });
});

router.post('/', authenticateToken, (req, res) => {
  res.json({ message: 'Crear notificación - Por implementar' });
});

module.exports = router;
```

### src/routes/stores.js (Placeholder)

```javascript
// src/routes/stores.js
const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res) => {
  res.json({ message: 'Lista de tiendas - Por implementar' });
});

router.post('/', authenticateToken, authorizeRoles('owner'), (req, res) => {
  res.json({ message: 'Crear tienda - Por implementar' });
});

module.exports = router;
```

### src/routes/workers.js (Placeholder)

```javascript
// src/routes/workers.js
const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res) => {
  res.json({ message: 'Lista de trabajadores - Por implementar' });
});

router.post('/', authenticateToken, authorizeRoles('owner'), (req, res) => {
  res.json({ message: 'Agregar trabajador - Por implementar' });
});

module.exports = router;
```

---

## 🚀 Paso 4: Ejecutar el Backend

```bash
# Asegúrate de estar en la carpeta del backend
cd D:\Dobleteos\Yape_Smart\yape_pro_backend

# Instalar dependencias (si no lo hiciste)
npm install

# Ejecutar en modo desarrollo
npm run dev

# Deberías ver:
# 🚀 Server running on http://localhost:3000
# ✅ Supabase conectado correctamente
```

---

## 🧪 Paso 5: Probar el API

### Opción 1: Con curl (PowerShell)

```powershell
# 1. Registrar usuario
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"dueño@test.com\",\"password\":\"password123\",\"full_name\":\"Juan Pérez\",\"role\":\"owner\"}'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"dueño@test.com\",\"password\":\"password123\"}'

# Copiar el "token" de la respuesta

# 3. Obtener perfil (reemplaza TU_TOKEN)
curl http://localhost:3000/api/auth/me `
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### Opción 2: Con Postman / Insomnia

1. Descargar Postman: https://www.postman.com/downloads/
2. Importar colección:

```json
{
  "info": {
    "name": "Yape Pro API",
    "_postman_id": "yape-pro-api",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@test.com\",\n  \"password\": \"password123\",\n  \"full_name\": \"Test User\",\n  \"role\": \"owner\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "http://localhost:3000/api/auth/register",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3000",
              "path": ["api", "auth", "register"]
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@test.com\",\n  \"password\": \"password123\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "http://localhost:3000/api/auth/login",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3000",
              "path": ["api", "auth", "login"]
            }
          }
        },
        {
          "name": "Get Profile",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}",
                "type": "text"
              }
            ],
            "url": {
              "raw": "http://localhost:3000/api/auth/me",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3000",
              "path": ["api", "auth", "me"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## 📝 Resumen de lo Implementado

### ✅ Completado:

1. **Estructura de carpetas** organizada
2. **Base de datos** en Supabase con todas las tablas
3. **Autenticación JWT** (register, login, perfil)
4. **Middleware** de autenticación y roles
5. **Configuración** de Supabase
6. **Server** funcionando en localhost:3000

### 🚧 Por Implementar (siguiente fase):

1. **Controllers**:
   - `notificationController.js` - Crear, listar, enviar notificaciones
   - `storeController.js` - CRUD tiendas
   - `workerController.js` - CRUD trabajadores

2. **Services**:
   - `fcmService.js` - Enviar notificaciones push con Firebase
   - `notificationParser.js` - Parsear notificaciones de Yape/Plin

3. **Firebase FCM** - Configurar para push notifications

---

## 🔥 Próximos Pasos

1. **Probar el backend** con Postman
2. **Implementar notificationController** (siguiente)
3. **Configurar Firebase** para push
4. **Conectar con Flutter app**

¿Quieres que continúe con:
- A) notificationController completo
- B) Firebase FCM setup
- C) Conectar Flutter con este backend

---

**Fecha:** Octubre 31, 2025  
**Autor:** Documentación técnica para Yape Pro Backend  
**Stack:** Node.js + Express + Supabase + JWT
