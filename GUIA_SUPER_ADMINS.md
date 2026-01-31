# 🔐 GUÍA DE GESTIÓN SEGURA DE SUPER ADMINS

## ✅ FORMA CORRECTA Y SEGURA

### Opción 1: Desde el Panel de Admin (RECOMENDADO)

Ya tienes un super_admin, úsalo para crear más:

```bash
# 1. Primero inicia sesión con tu super_admin
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "saavedracastrosandro@gmail.com",
    "password": "tu_contraseña"
  }'

# Esto te devolverá un TOKEN, cópialo
# Ejemplo: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 2. Usa ese token para crear otro super_admin
curl -X POST http://localhost:3002/api/admin/create-super-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "email": "nuevo_admin@gmail.com",
    "password": "ContraseñaSegura123!",
    "full_name": "Nuevo Administrador"
  }'
```

### Opción 2: Desde Postman/Insomnia (MÁS FÁCIL)

1. **Crear una colección con estos 2 requests:**

   **Request 1: Login Super Admin**
   ```
   POST http://localhost:3002/api/auth/login
   Body (JSON):
   {
     "email": "saavedracastrosandro@gmail.com",
     "password": "tu_contraseña"
   }
   ```
   → Copia el `token` de la respuesta

   **Request 2: Crear Super Admin**
   ```
   POST http://localhost:3002/api/admin/create-super-admin
   Headers:
     Authorization: Bearer {token_del_login}
   Body (JSON):
   {
     "email": "nuevo_admin@gmail.com",
     "password": "ContraseñaSegura123!",
     "full_name": "Nuevo Administrador"
   }
   ```

### Opción 3: Listar Super Admins actuales

```bash
curl -X GET http://localhost:3002/api/admin/super-admins \
  -H "Authorization: Bearer TU_TOKEN"
```

---

## ❌ FORMAS INSEGURAS (NO USAR EN PRODUCCIÓN)

### Método 1: Endpoint público con secret key
⚠️ **Solo disponible en desarrollo**

```bash
curl -X POST http://localhost:3002/api/auth/create-super-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "Password123!",
    "full_name": "Admin",
    "secret_key": "tu_clave_del_env"
  }'
```

**Problema:** Aunque tiene secret key, expone un endpoint público que puede ser atacado.

### Método 2: SQL directo en Supabase
⚠️ **Solo para emergencias**

```sql
-- Genera el hash de contraseña primero en Node.js:
-- const bcrypt = require('bcrypt');
-- const hash = await bcrypt.hash('MiContraseña123!', 10);

INSERT INTO users (email, password_hash, full_name, role, phone)
VALUES (
  'admin@gmail.com',
  '$2b$10$ABC123...', -- Hash generado arriba
  'Nuevo Admin',
  'super_admin',
  NULL
);
```

**Problema:** No hay validaciones, puedes meter datos mal formateados.

---

## 🎯 COMPARACIÓN DE MÉTODOS

| Método | Seguridad | Facilidad | Auditoría | Recomendado |
|--------|-----------|-----------|-----------|-------------|
| Panel Admin (Opción 1) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Sí | ✅ **SÍ** |
| Endpoint público | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⚠️ Parcial | ❌ Solo Dev |
| SQL directo | ⭐⭐⭐ | ⭐⭐ | ❌ No | ❌ Solo emergencia |

---

## 🔐 VENTAJAS DEL PANEL DE ADMIN PROTEGIDO

✅ **Seguridad:**
- Requiere autenticación JWT válida
- Solo super_admins pueden crear otros super_admins
- Rate limiting aplicado
- No expone secret keys en requests

✅ **Auditoría:**
- Logs automáticos de quién creó a quién
- Timestamp de cada creación
- Trazabilidad completa

✅ **Validaciones:**
- Validación de email único
- Validación de contraseña fuerte
- Manejo de errores consistente

---

## 📝 CONFIGURACIÓN EN PRODUCCIÓN

En tu archivo `.env` de producción:

```env
# Deshabilitar endpoint público
NODE_ENV=production
ENABLE_PUBLIC_SUPER_ADMIN=false

# Ya no necesitas SUPER_ADMIN_SECRET_KEY en producción
# Solo usar panel de admin protegido
```

---

## 🛡️ MEJORES PRÁCTICAS

1. **Siempre usa el panel de admin protegido** (`/api/admin/create-super-admin`)
2. **Nunca compartas tokens JWT** - son como contraseñas
3. **Rota tokens regularmente** - cierra sesión y vuelve a iniciar
4. **Limita super_admins** - solo los necesarios
5. **Documenta cada creación** - quién, cuándo y por qué
6. **Revisa periódicamente** - `GET /api/admin/super-admins`

---

## 🚀 SCRIPT DE PRUEBA RÁPIDA

Guarda este script como `create-admin.sh`:

```bash
#!/bin/bash

echo "🔐 Creando Super Admin de forma segura"
echo "======================================"

# 1. Login
echo "1. Iniciando sesión..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "saavedracastrosandro@gmail.com",
    "password": "TU_PASSWORD"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

if [ "$TOKEN" = "null" ]; then
  echo "❌ Error al iniciar sesión"
  exit 1
fi

echo "✅ Login exitoso"

# 2. Crear super admin
echo "2. Creando nuevo super admin..."
curl -X POST http://localhost:3002/api/admin/create-super-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "nuevo_admin@gmail.com",
    "password": "ContraseñaSegura123!",
    "full_name": "Nuevo Administrador"
  }'

echo ""
echo "✅ Proceso completado"
```

---

## 📞 SOPORTE

¿Problemas? Revisa:
- Token expirado → Vuelve a hacer login
- 403 Forbidden → Tu usuario no es super_admin
- 409 Conflict → El email ya existe

---

**Actualizado:** 31 de Enero, 2026
