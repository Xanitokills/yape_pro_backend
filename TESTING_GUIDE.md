# 🧪 Guía de Pruebas - Yape Pro Backend

Esta guía te ayudará a probar todos los endpoints del API usando **Postman** o **cURL**.

---

## 📋 Configuración Inicial

### 1. Importar Colección en Postman

Guarda este JSON como `Yape_Pro.postman_collection.json` e impórtalo en Postman:

```json
{
  "info": {
    "name": "Yape Pro API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000",
      "type": "string"
    },
    {
      "key": "token",
      "value": "",
      "type": "string"
    },
    {
      "key": "store_id",
      "value": "",
      "type": "string"
    },
    {
      "key": "user_id",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "🔐 Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"owner@test.com\",\n  \"password\": \"Owner123!\",\n  \"full_name\": \"Dueño Test\",\n  \"phone\": \"+51987654321\",\n  \"role\": \"owner\"\n}"
            },
            "url": "{{base_url}}/api/auth/register"
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"owner@test.com\",\n  \"password\": \"Owner123!\"\n}"
            },
            "url": "{{base_url}}/api/auth/login"
          }
        },
        {
          "name": "Get Profile",
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
            "url": "{{base_url}}/api/auth/me"
          }
        }
      ]
    },
    {
      "name": "🏪 Stores",
      "item": [
        {
          "name": "List Stores",
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
            "url": "{{base_url}}/api/stores"
          }
        },
        {
          "name": "Create Store",
          "request": {
            "method": "POST",
            "header": [
              {"key": "Content-Type", "value": "application/json"},
              {"key": "Authorization", "value": "Bearer {{token}}"}
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Mi Bodega\",\n  \"description\": \"Bodega del barrio\",\n  \"address\": \"Av. Principal 123\",\n  \"phone\": \"987654321\"\n}"
            },
            "url": "{{base_url}}/api/stores"
          }
        },
        {
          "name": "Get Store Stats",
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
            "url": "{{base_url}}/api/stores/{{store_id}}/stats"
          }
        }
      ]
    },
    {
      "name": "📱 Notifications",
      "item": [
        {
          "name": "List Notifications",
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
            "url": {
              "raw": "{{base_url}}/api/notifications?store_id={{store_id}}&limit=50",
              "query": [
                {"key": "store_id", "value": "{{store_id}}"},
                {"key": "limit", "value": "50"}
              ]
            }
          }
        },
        {
          "name": "Create Notification",
          "request": {
            "method": "POST",
            "header": [
              {"key": "Content-Type", "value": "application/json"},
              {"key": "Authorization", "value": "Bearer {{token}}"}
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"store_id\": \"{{store_id}}\",\n  \"amount\": 50.00,\n  \"sender_name\": \"Juan Pérez\",\n  \"source\": \"yape\",\n  \"message\": \"Recibiste S/ 50.00 de Juan Pérez via Yape\"\n}"
            },
            "url": "{{base_url}}/api/notifications"
          }
        },
        {
          "name": "Parse Notification",
          "request": {
            "method": "POST",
            "header": [
              {"key": "Content-Type", "value": "application/json"},
              {"key": "Authorization", "value": "Bearer {{token}}"}
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"text\": \"Recibiste S/ 50.00 de Juan Pérez via Yape\",\n  \"store_id\": \"{{store_id}}\"\n}"
            },
            "url": "{{base_url}}/api/notifications/parse"
          }
        }
      ]
    }
  ]
}
```

---

## 🚀 Flujo Completo de Pruebas

### Paso 1: Health Check

Verifica que el servidor esté corriendo:

```bash
curl http://localhost:3000/health
```

Respuesta esperada:
```json
{
  "status": "OK",
  "timestamp": "2025-10-31T...",
  "uptime": 123.456
}
```

---

### Paso 2: Registrar Usuario Owner

```bash
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "owner@test.com",
    "password": "Owner123!",
    "full_name": "Dueño Test",
    "phone": "+51987654321",
    "role": "owner"
  }'
```

**Guarda el `token` de la respuesta!**

---

### Paso 3: Login

```bash
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "owner@test.com",
    "password": "Owner123!"
  }'
```

---

### Paso 4: Crear Tienda

```bash
curl -X POST http://localhost:3000/api/stores `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer TU_TOKEN_AQUI" `
  -d '{
    "name": "Mi Bodega",
    "description": "Bodega del barrio",
    "address": "Av. Principal 123",
    "phone": "987654321"
  }'
```

**Guarda el `id` de la tienda!**

---

### Paso 5: Registrar Usuario Worker

```bash
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "worker@test.com",
    "password": "Worker123!",
    "full_name": "Trabajador Test",
    "role": "worker"
  }'
```

**Guarda el `id` del usuario worker!**

---

### Paso 6: Agregar Worker a Tienda

```bash
curl -X POST http://localhost:3000/api/workers `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer TOKEN_OWNER" `
  -d '{
    "store_id": "UUID_TIENDA",
    "user_id": "UUID_WORKER",
    "position": "Cajero"
  }'
```

---

### Paso 7: Crear Notificación

```bash
curl -X POST http://localhost:3000/api/notifications `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer TOKEN_OWNER" `
  -d '{
    "store_id": "UUID_TIENDA",
    "amount": 50.00,
    "sender_name": "Juan Pérez",
    "source": "yape",
    "message": "Recibiste S/ 50.00 de Juan Pérez via Yape"
  }'
```

---

### Paso 8: Parsear Notificación

```bash
curl -X POST http://localhost:3000/api/notifications/parse `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer TOKEN_OWNER" `
  -d '{
    "text": "Recibiste S/ 50.00 de Maria Lopez via Yape",
    "store_id": "UUID_TIENDA"
  }'
```

---

### Paso 9: Ver Notificaciones

```bash
curl "http://localhost:3000/api/notifications?store_id=UUID_TIENDA&limit=50" `
  -H "Authorization: Bearer TOKEN_OWNER"
```

---

### Paso 10: Ver Estadísticas

```bash
curl "http://localhost:3000/api/notifications/stats?store_id=UUID_TIENDA&days=30" `
  -H "Authorization: Bearer TOKEN_OWNER"
```

---

## 📊 Ejemplos de Parseo de Notificaciones

### Yape

**Input:**
```
Recibiste S/ 50.00 de Juan Perez via Yape
```

**Output:**
```json
{
  "amount": 50.00,
  "sender": "Juan Perez",
  "source": "yape"
}
```

### Plin

**Input:**
```
Recibiste S/ 30.50 de Maria Lopez con Plin
```

**Output:**
```json
{
  "amount": 30.50,
  "sender": "Maria Lopez",
  "source": "plin"
}
```

### BCP

**Input:**
```
BCP: Abono de S/ 100.00 de cuenta ****1234
```

**Output:**
```json
{
  "amount": 100.00,
  "sender": "cuenta ****1234",
  "source": "bcp"
}
```

---

## 🔒 Códigos de Estado HTTP

| Código | Significado | Cuándo Ocurre |
|--------|-------------|---------------|
| **200** | OK | Operación exitosa |
| **201** | Created | Recurso creado exitosamente |
| **400** | Bad Request | Datos inválidos o faltantes |
| **401** | Unauthorized | Token no proporcionado |
| **403** | Forbidden | Token inválido/expirado o sin permisos |
| **404** | Not Found | Recurso no encontrado |
| **409** | Conflict | Recurso duplicado (email ya existe) |
| **500** | Server Error | Error interno del servidor |

---

## 🎯 Variables de Postman

Configurar estas variables en Postman para facilitar las pruebas:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `base_url` | URL base del API | `http://localhost:3000` |
| `token` | JWT token (actualizar después de login) | `eyJhbGc...` |
| `store_id` | UUID de tienda de prueba | `uuid-aqui` |
| `user_id` | UUID de usuario worker | `uuid-aqui` |

---

## 🧪 Tests Automatizados con Postman

Agregar estos scripts a las peticiones de Postman:

### Test: Register/Login

```javascript
// En la pestaña Tests
pm.test("Status code is 201 or 200", function () {
    pm.expect([200, 201]).to.include(pm.response.code);
});

pm.test("Response has token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.token).to.be.a('string');
    
    // Guardar token en variable
    pm.environment.set("token", jsonData.data.token);
});
```

### Test: Create Store

```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Store created", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.store.id).to.be.a('string');
    
    // Guardar store_id
    pm.environment.set("store_id", jsonData.data.store.id);
});
```

---

## 🐛 Problemas Comunes

### Error: "Token inválido"

✅ Verifica que el header sea: `Authorization: Bearer TOKEN` (con espacio)

### Error: "Acceso denegado"

✅ Verifica que el rol del usuario tenga permisos para esa acción

### Error: "store_id requerido"

✅ Asegúrate de pasar el parámetro en la URL o body según el endpoint

### Error 500: "Error interno"

✅ Revisa los logs del servidor para ver el error específico

---

## 📝 Notas Importantes

1. **Todos los endpoints (excepto register/login) requieren autenticación**
2. **El token expira según `JWT_EXPIRES_IN` (default: 7 días)**
3. **Los UUIDs deben ser válidos (formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)**
4. **Los montos deben ser números positivos con máximo 2 decimales**
5. **Las fuentes válidas son: `yape`, `plin`, `bcp`, `other`**

---

**¡Listo para probar! 🚀**
