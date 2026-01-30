# Guía de Configuración de Recuperación de Contraseña

## 📋 Resumen
Se ha implementado la funcionalidad completa de recuperación de contraseña para **ambas plataformas**:
- ✅ App móvil Flutter
- ✅ Frontend web Next.js
- ✅ Backend Node.js + Supabase

## 🔧 Configuración del Backend

### 1. Instalar dependencias
```bash
cd backend
npm install nodemailer
```

### 2. Configurar variables de entorno

Agrega las siguientes variables en tu archivo `.env`:

```env
# Email Configuration (Gmail)
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-contraseña-de-aplicacion-gmail
```

#### Cómo obtener una contraseña de aplicación de Gmail:

1. Ve a tu cuenta de Google: https://myaccount.google.com/security
2. Habilita la verificación en 2 pasos
3. Ve a "Contraseñas de aplicaciones": https://myaccount.google.com/apppasswords
4. Selecciona "Correo" y "Windows Computer" (o tu dispositivo)
5. Google generará una contraseña de 16 caracteres
6. Copia esa contraseña y úsala como `EMAIL_PASSWORD`

**Nota:** Si no quieres usar Gmail, puedes usar otros servicios SMTP (SendGrid, Mailgun, AWS SES, etc.)

### 3. Ejecutar migración de base de datos

Ejecuta este SQL en Supabase SQL Editor:

```bash
psql -h [TU_SUPABASE_HOST] -U postgres -d postgres -f backend/migrations/create_password_reset_codes.sql
```

O ejecuta directamente en Supabase Dashboard → SQL Editor:

```sql
-- Ver archivo: backend/migrations/create_password_reset_codes.sql
```

### 4. Verificar configuración

Puedes usar este script de prueba:

```javascript
// test-email.js
require('dotenv').config();
const { verifyEmailConfig, sendPasswordResetEmail } = require('./src/services/emailService');

async function test() {
  console.log('Verificando configuración...');
  const isConfigured = await verifyEmailConfig();
  
  if (isConfigured) {
    console.log('Enviando email de prueba...');
    await sendPasswordResetEmail('test@example.com', '123456', 'Usuario Test');
    console.log('✅ Email enviado!');
  }
}

test();
```

Ejecutar:
```bash
node test-email.js
```

## 📱 App Móvil Flutter

### Archivos creados:
- `lib/screens/auth/forgot_password_screen.dart` - Pantalla para solicitar código
- `lib/screens/auth/reset_password_screen.dart` - Pantalla para cambiar contraseña
- Métodos añadidos en `lib/services/api_service.dart`:
  - `forgotPassword(email)`
  - `verifyResetCode(email, code)`
  - `resetPassword(email, code, newPassword)`

### Flujo de usuario:
1. Usuario hace clic en "¿Olvidaste tu contraseña?" en login
2. Ingresa su email → Recibe código de 6 dígitos
3. Ingresa código → Se verifica
4. Ingresa nueva contraseña → Contraseña actualizada
5. Redirige automáticamente al login

### Características:
- ✅ Completamente responsive (teléfonos y tablets)
- ✅ Validación de código de 6 dígitos
- ✅ Toggle para mostrar/ocultar contraseña
- ✅ Verificación de que las contraseñas coincidan
- ✅ Mensajes de error y éxito claros

## 🌐 Frontend Web Next.js

### Páginas creadas:
- `Front/src/app/forgot-password/page.tsx` - Solicitar código
- `Front/src/app/reset-password/page.tsx` - Cambiar contraseña

### Flujo de usuario:
1. Click en "¿Olvidaste tu contraseña?" en `/login`
2. Ingresa email → Código enviado
3. Ingresa código de 6 dígitos → Verifica
4. Ingresa nueva contraseña → Actualizada
5. Redirige a `/login` con mensaje de éxito

### Características:
- ✅ Diseño moderno con Tailwind CSS
- ✅ Animaciones y estados de carga
- ✅ Validación en tiempo real
- ✅ Compatible con tema claro/oscuro
- ✅ Responsive design

## 🔐 Backend API

### Endpoints creados:

#### 1. POST `/api/auth/forgot-password`
Envía código de recuperación por email.

**Request:**
```json
{
  "email": "usuario@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Si el email existe, recibirás un código de recuperación",
  "expiresIn": 15
}
```

#### 2. POST `/api/auth/verify-reset-code`
Verifica que el código sea válido.

**Request:**
```json
{
  "email": "usuario@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Código válido",
  "resetCodeId": 42
}
```

#### 3. POST `/api/auth/reset-password`
Restablece la contraseña.

**Request:**
```json
{
  "email": "usuario@example.com",
  "code": "123456",
  "newPassword": "nuevaContraseña123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contraseña actualizada correctamente"
}
```

## 🗃️ Base de Datos

### Nueva tabla: `password_reset_codes`

```sql
CREATE TABLE password_reset_codes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Características:
- Códigos de 6 dígitos
- Expiración de 15 minutos
- Se marcan como `used` después de usarse
- Cascada al eliminar usuario
- Índices para búsquedas rápidas

## 📧 Servicio de Email

### Archivo: `backend/src/services/emailService.js`

Funcionalidades:
- ✅ Envío de emails HTML con diseño profesional
- ✅ Compatible con Gmail (y otros SMTP)
- ✅ Template responsive para el email
- ✅ Advertencia de seguridad incluida
- ✅ Verificación de configuración

### Personalización del email:

Si quieres personalizar el diseño del email, edita el HTML en:
`backend/src/services/emailService.js` → función `sendPasswordResetEmail()`

## 🚀 Desplegar Cambios

### IMPORTANTE: Necesitas desplegar estos cambios a Railway

Como tu proyecto NO tiene Git configurado, tienes 3 opciones:

### Opción 1: Usar Railway CLI (Recomendado)
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Vincular proyecto
cd backend
railway link

# Desplegar
railway up
```

### Opción 2: Configurar Git y vincular con Railway
```bash
cd D:\Dobleteos\Yape_Smart

# Inicializar Git
git init

# Añadir archivos
git add .

# Primer commit
git commit -m "Add password recovery feature"

# Conectar con Railway (desde Railway Dashboard → Settings → Connect Repo)
```

### Opción 3: Subir archivos manualmente
1. Comprime la carpeta `backend` completa
2. Sube a un repositorio de GitHub
3. Conecta ese repo con Railway
4. Railway desplegará automáticamente

## ✅ Checklist de Implementación

### Backend
- [x] Instalar nodemailer
- [x] Crear emailService.js
- [x] Añadir endpoints forgot/verify/reset
- [x] Crear migración SQL
- [x] Añadir rutas en auth.js
- [ ] Configurar EMAIL_USER y EMAIL_PASSWORD en .env
- [ ] Ejecutar migración SQL en Supabase
- [ ] Verificar envío de emails
- [ ] Desplegar a Railway

### Frontend Flutter
- [x] Crear ForgotPasswordScreen
- [x] Crear ResetPasswordScreen
- [x] Añadir métodos en ApiService
- [x] Registrar rutas en main.dart
- [x] Añadir link en LoginScreen

### Frontend Web
- [x] Crear página forgot-password
- [x] Crear página reset-password
- [ ] Probar flujo completo

## 🧪 Pruebas

### Probar flujo completo:

1. **App móvil:**
   ```bash
   cd yape_pro
   flutter run
   ```
   - Ir a Login → "¿Olvidaste tu contraseña?"
   - Ingresar email registrado
   - Verificar que llegó el email
   - Ingresar código y nueva contraseña

2. **Frontend web:**
   ```bash
   cd Front
   npm run dev
   ```
   - Ir a http://localhost:3000/login
   - Click en "¿Olvidaste tu contraseña?"
   - Completar flujo

3. **Verificar email:**
   - Revisa bandeja de entrada
   - Revisa spam si no aparece
   - El código expira en 15 minutos

## 🔍 Troubleshooting

### El email no llega
- Verifica EMAIL_USER y EMAIL_PASSWORD en .env
- Verifica que Gmail tiene verificación en 2 pasos habilitada
- Verifica contraseña de aplicación
- Revisa logs del backend: `railway logs`
- Revisa carpeta de spam

### Error 404 en endpoints
- Backend NO está desplegado en Railway
- Sigue la guía de despliegue arriba

### Código inválido o expirado
- Los códigos expiran en 15 minutos
- Solo se pueden usar una vez
- Verifica que la hora del servidor es correcta

### Base de datos error
- Ejecuta la migración SQL en Supabase
- Verifica conexión a Supabase

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del backend
2. Verifica variables de entorno
3. Verifica que la migración SQL se ejecutó
4. Prueba el servicio de email con `test-email.js`

---

**¡Implementación completa!** 🎉

La funcionalidad de recuperación de contraseña está lista para ambas plataformas (Flutter y Next.js).
