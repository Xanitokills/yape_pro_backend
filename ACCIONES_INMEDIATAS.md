# 🚨 ALERTA DE SEGURIDAD - ACCIONES INMEDIATAS

## ⚠️ SITUACIÓN
Detectamos que usuarios no autorizados se registraron como **super_admin** explotando una vulnerabilidad crítica en el endpoint de registro.

## ✅ CORRECCIÓN APLICADA
El parche de seguridad ya está aplicado. Ahora es **IMPOSIBLE** auto-asignarse el rol de super_admin desde el registro público.

---

## 📋 ACCIONES REQUERIDAS (EN ORDEN)

### 1️⃣ CONFIGURAR CLAVE SECRETA (URGENTE)
Edita el archivo `.env` y cambia esta línea:

```env
SUPER_ADMIN_SECRET_KEY=cambiar_esto_por_algo_super_secreto_y_aleatorio_min_64_caracteres_9876
```

**Genera una clave fuerte aquí:** https://www.random.org/strings/

O usa este comando en PowerShell:
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

### 2️⃣ REINICIAR EL BACKEND
```bash
# Detener el servidor actual (Ctrl+C)
# Luego reiniciar:
npm start
```

### 3️⃣ ELIMINAR USUARIOS HACKERS

**Opción A: Script automático (Recomendado)**
```bash
node remove-hackers.js
```
O en Windows:
```bash
remove-hackers.bat
```

**Opción B: Manualmente en Supabase**
1. Ve a tu dashboard de Supabase
2. Abre el SQL Editor
3. Ejecuta:
```sql
-- Ver usuarios sospechosos
SELECT id, email, full_name, role, created_at
FROM users
WHERE email LIKE '%hacker%' 
   OR email LIKE '%ejemplo%'
   OR email = 'elcalvito7w@gmail.com';

-- Eliminarlos (descomenta si estás seguro)
-- DELETE FROM users 
-- WHERE email IN ('hacker1@ejemplo.com', 'hacker@ejemplo.com', 'elcalvito7w@gmail.com');
```

### 4️⃣ CREAR TU SUPER ADMIN LEGÍTIMO
Una vez configurado el `SUPER_ADMIN_SECRET_KEY`, usa este curl:

```bash
curl -X POST http://localhost:3002/api/auth/create-super-admin \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"tu_email@gmail.com\",
    \"password\": \"TuContraseñaSegura123!\",
    \"full_name\": \"Tu Nombre\",
    \"secret_key\": \"tu_clave_secreta_del_env\"
  }"
```

**O desde Postman/Insomnia:**
- URL: `POST http://localhost:3002/api/auth/create-super-admin`
- Body (JSON):
```json
{
  "email": "tu_email@gmail.com",
  "password": "TuContraseñaSegura123!",
  "full_name": "Tu Nombre",
  "secret_key": "tu_clave_secreta_del_env"
}
```

### 5️⃣ VERIFICAR QUE TODO FUNCIONE
```bash
# Ver todos los super_admin en la base de datos
# En Supabase SQL Editor:
SELECT id, email, full_name, role, created_at
FROM users
WHERE role = 'super_admin';
```

---

## 📚 DOCUMENTACIÓN
- **Detalles técnicos:** Ver `SECURITY_PATCH_2026_01_31.md`
- **Script de limpieza:** `remove-hackers.js` o `remove-hackers.bat`
- **SQL manual:** `remove_hackers.sql`

---

## ✅ CHECKLIST
- [ ] Configuré `SUPER_ADMIN_SECRET_KEY` con valor fuerte
- [ ] Reinicié el backend
- [ ] Eliminé usuarios hackers
- [ ] Creé mi super admin legítimo
- [ ] Verifiqué que solo existan super_admins autorizados

---

## 🆘 ¿NECESITAS AYUDA?
Si tienes problemas, revisa los logs del backend o consulta `SECURITY_PATCH_2026_01_31.md` para más detalles.

**Estado actual:** 🟢 Vulnerabilidad corregida, requiere acciones manuales
