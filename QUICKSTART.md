# ✅ GUÍA RÁPIDA - Testing de Notificaciones

## 🚀 Instrucciones Paso a Paso

### **Paso 1: Abrir 2 Terminales PowerShell**

1. **Terminal 1 (Backend):**
   - Presiona `Win + X` → PowerShell
   - Ejecuta:
   ```powershell
   cd d:\Dobleteos\Yape_Smart\backend
   node server.js
   ```
   - **DEJAR ESTA VENTANA ABIERTA** (no cerrar)
   - Debe mostrar:
   ```
   ✅ Firebase Admin SDK inicializado correctamente
   🧪 Test endpoints habilitados en /api/test
   🚀 Server running on http://localhost:3002
   ```

2. **Terminal 2 (Testing):**
   - Presiona `Win + X` → PowerShell (otra ventana)
   - Ejecuta:
   ```powershell
   cd d:\Dobleteos\Yape_Smart\backend
   .\test-endpoint.ps1
   ```

### **Paso 2: Ver Resultados**

Si todo funciona correctamente, verás:
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
  ID: abc-123-def
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

## ❌ Solución de Problemas

### **Error: "No es posible conectar con el servidor remoto"**
- **Causa:** El backend no está corriendo
- **Solución:** 
  1. Verifica que la Terminal 1 tenga el backend corriendo
  2. Debe mostrar: `Server running on http://localhost:3002`
  3. Si no, ejecuta: `node server.js`

### **Error: "Login fallido"**
- **Causa:** No existe el usuario en la BD
- **Solución:** 
  1. Abre la app móvil
  2. Registra un propietario con:
     - Email: propietario@example.com
     - Password: password123
  3. O cambia el email/password en el script:
  ```powershell
  .\test-endpoint.ps1 -Email "tu@email.com" -Password "tupassword"
  ```

### **Error: "No hay tiendas disponibles"**
- **Causa:** El usuario no tiene tiendas
- **Solución:**
  1. Abre la app móvil
  2. Crea una tienda como propietario
  3. Vuelve a ejecutar el script

---

## 🔄 Otros Scripts Disponibles

### **test-menu.ps1** - Menú Interactivo
```powershell
.\test-menu.ps1
```
- Login manual
- Selección de tienda
- Múltiples opciones de simulación
- Batch testing

---

## 📊 Verificar en Base de Datos

### **Ver notificaciones simuladas:**
```sql
SELECT 
  id,
  amount,
  sender_name,
  source,
  message,
  workers_notified,
  created_at
FROM notifications
WHERE raw_data->>'simulated' = 'true'
ORDER BY created_at DESC
LIMIT 10;
```

### **Limpiar notificaciones de prueba:**
```sql
DELETE FROM notifications 
WHERE raw_data->>'simulated' = 'true';
```

---

## ✅ Checklist

Antes de ejecutar el script, asegúrate de:

- [ ] Backend corriendo en Terminal 1
- [ ] Puerto 3002 disponible
- [ ] Usuario `propietario@example.com` existe en BD
- [ ] Al menos 1 tienda creada
- [ ] Firebase configurado correctamente
- [ ] Supabase conectado

---

## 🎯 Lo que Hace el Script

1. **Autentica** con el usuario proporcionado
2. **Obtiene** la lista de tiendas disponibles
3. **Selecciona** la primera tienda
4. **Simula** una notificación de Yape de S/ 50.00
5. **Crea** registro en base de datos
6. **Envía** notificaciones FCM a trabajadores
7. **Muestra** resultados detallados

---

**¿Problemas?** Revisa los logs del backend en la Terminal 1.
