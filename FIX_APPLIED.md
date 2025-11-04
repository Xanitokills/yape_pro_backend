# ✅ CORRECCIÓN APLICADA - Sistema de Testing Listo

## 🔧 Problema Corregido

**Error anterior:**
```
column users_1.name does not exist
```

**Causa:** Query JOIN de Supabase mal formado

**Solución:** Refactorizado `getTestStores()` para hacer queries separados en lugar de JOINs anidados.

---

## 🚀 CÓMO EJECUTAR (Paso a Paso)

### **IMPORTANTE: Necesitas 2 ventanas de PowerShell separadas**

### **Ventana 1 - Backend (NO CERRAR)**

```powershell
# 1. Abrir PowerShell
# Win + X → Windows PowerShell

# 2. Navegar a backend
cd d:\Dobleteos\Yape_Smart\backend

# 3. Iniciar servidor
node server.js

# Debe mostrar:
# ✅ Firebase Admin SDK inicializado correctamente
# 🧪 Test endpoints habilitados en /api/test
# 🚀 Server running on http://localhost:3002

# DEJAR ESTA VENTANA ABIERTA ← IMPORTANTE
```

### **Ventana 2 - Testing**

```powershell
# 1. Abrir OTRA ventana PowerShell
# Win + X → Windows PowerShell (nueva ventana)

# 2. Navegar a backend
cd d:\Dobleteos\Yape_Smart\backend

# 3. Ejecutar script
.\test-endpoint.ps1

# O con credenciales personalizadas:
.\test-endpoint.ps1 -Email "tu@email.com" -Password "tupassword"
```

---

## 📊 Salida Esperada

```
YAPE PRO - Testing de Notificaciones
=====================================

[1/3] Autenticando...
OK - Login exitoso

[2/3] Obteniendo tiendas...
OK - Tiendas encontradas: 1
  > Bodega El Dorado
    ID: 123e4567-e89b-12d3-a456-426614174000
    Trabajadores: 2

Usando tienda: Bodega El Dorado

[3/3] Simulando notificacion de Yape...
OK - Notificacion simulada exitosamente

RESULTADOS:
  ID: abc-def-ghi
  Monto: S/ 50.00
  De: Juan Perez
  Trabajadores notificados: 2

MENSAJES GENERADOS:
  Titulo: Recibiste un Yape
  Texto: Recibiste S/ 50.00
  BigText: Juan Perez te envio S/ 50.00 por Yape

====================================
PRUEBA COMPLETADA EXITOSAMENTE
====================================
```

---

## 🔍 Verificar en el Backend (Ventana 1)

Deberías ver logs como:
```
GET /api/auth/login {}
POST /api/test/stores {}
🧪 SIMULANDO NOTIFICACIÓN:
   💰 Monto: S/ 50.00
   👤 De: Juan Perez
   📱 Fuente: yape
   📝 Formato: 1
   🏪 Tienda: Bodega El Dorado
✅ Notificación creada con ID: abc-123
👷 Trabajadores activos: 2
🔔 Tokens FCM encontrados: 2
✅ FCM enviado a 2 trabajadores
```

---

## ❌ Si Algo Sale Mal

### **Error: "Login fallido"**
- Verifica que el usuario existe: `owner@test.com` / `password`
- O cambia las credenciales en el script:
```powershell
.\test-endpoint.ps1 -Email "propietario@example.com" -Password "password123"
```

### **Error: "No hay tiendas disponibles"**
- Crea una tienda desde la app móvil
- O inserta una en Supabase:
```sql
INSERT INTO stores (owner_id, name, address) 
VALUES ('tu-user-id', 'Tienda de Prueba', 'Av. Test 123');
```

### **Error: "No es posible conectar"**
- Verifica que la Ventana 1 tenga el backend corriendo
- Debe mostrar: `Server running on http://localhost:3002`
- Si no, ejecuta `node server.js` nuevamente

---

## 📝 Archivos Modificados

### **`src/controllers/testController.js`**
- ✅ Función `getTestStores()` refactorizada
- ✅ Ahora hace queries separados en lugar de JOINs
- ✅ Compatible con la estructura de Supabase

---

## 🎯 Próximos Pasos

Una vez que el script funcione:

1. **Ver notificaciones en Supabase:**
```sql
SELECT * FROM notifications 
WHERE raw_data->>'simulated' = 'true'
ORDER BY created_at DESC;
```

2. **Probar batch de notificaciones:**
```powershell
# Usa el script de menú
.\test-menu.ps1
# Opción 5: Simular 5 notificaciones (batch)
```

3. **Verificar FCM:**
- Abre la app móvil como trabajador
- Deberías recibir push notification

---

## ✅ Checklist Final

Antes de ejecutar:
- [ ] 2 ventanas PowerShell abiertas
- [ ] Ventana 1: Backend corriendo (`node server.js`)
- [ ] Ventana 2: Lista para ejecutar script
- [ ] Usuario existe en base de datos
- [ ] Al menos 1 tienda creada
- [ ] Puerto 3002 libre

---

**El error está corregido. Solo ejecuta el script en una ventana SEPARADA del backend.** 🚀
