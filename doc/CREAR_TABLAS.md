# ✅ SERVIDOR FUNCIONANDO - Ahora crear las tablas

## 🎉 ¡Excelente! Tu servidor está corriendo en: http://localhost:3001

Solo falta un paso: **Crear las tablas en Supabase**

---

## 📋 PASO A PASO para crear las tablas:

### 1. Abre tu proyecto de Supabase
👉 Ve a: https://supabase.com/dashboard/project/tvgryyxppqllcuyxbzsq

### 2. Ve al SQL Editor
- En el menú lateral izquierdo, busca el ícono **"SQL Editor"** (icono de </>) 
- Click en él

### 3. Crea una nueva query
- Click en el botón **"+ New query"** (arriba a la derecha)

### 4. Copia el contenido del archivo schema.sql
- Abre el archivo: `d:\Dobleteos\Yape_Smart\backend\schema.sql`
- Selecciona TODO el contenido (Ctrl+A)
- Copia (Ctrl+C)

### 5. Pega en el SQL Editor de Supabase
- Click en el editor SQL (área grande de texto)
- Pega el contenido (Ctrl+V)

### 6. Ejecuta el script
- Click en el botón **"RUN"** (esquina inferior derecha, botón verde)
- Espera unos segundos...

### 7. ¡Listo! Verás un mensaje de éxito
Deberías ver algo como:
```
Success. No rows returned
```

Y al final del script verás una tabla con:
```
table_name    | record_count
--------------+-------------
users         | 3
stores        | 0
workers       | 0
notifications | 0
fcm_tokens    | 0
```

---

## 🧪 Después de crear las tablas, prueba el API:

### Test 1: Health Check
Abre PowerShell y ejecuta:
```powershell
curl http://localhost:3001/health
```

### Test 2: Ver la raíz del API
```powershell
curl http://localhost:3001/
```

### Test 3: Login con usuario de prueba
```powershell
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@yapepro.com\",\"password\":\"Admin123!\"}'
```

Si funciona, verás un token JWT 🎉

---

## 📊 Usuarios de Prueba Incluidos

El script `schema.sql` crea 3 usuarios automáticamente:

| Email | Password | Rol |
|-------|----------|-----|
| admin@yapepro.com | Admin123! | super_admin |
| owner@test.com | Owner123! | owner |
| worker@test.com | Worker123! | worker |

**Nota:** Estos passwords son hasheados con bcrypt en el script.

---

## ❓ Si algo sale mal:

1. **Error "relation already exists"**
   → Las tablas ya existen, ¡perfecto! Ya puedes usar el API

2. **Error de permisos**
   → Verifica que copiaste el `service_role key` correcto

3. **Error de sintaxis**
   → Asegúrate de copiar TODO el contenido del `schema.sql`

---

## 🎯 Próximo Paso

Una vez ejecutado el SQL, el servidor detectará las tablas automáticamente.

Puedes verificar en la consola del servidor (donde está corriendo `npm run dev`), deberías ver:
```
✅ Supabase conectado correctamente
```

---

**¿Listo? Ve a Supabase y ejecuta el schema.sql!** 🚀

Si tienes algún problema, avísame y te ayudo.
