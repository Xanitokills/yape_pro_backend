# 🎨 Interfaz Web de Testing - Guía de Uso

## 📋 Descripción

Interfaz web HTML simple para simular notificaciones de Yape/Plin sin necesidad de usar PowerShell o scripts. Perfecta para testing rápido y visual.

## 🚀 Cómo Usar

### 1. Iniciar el Backend

```powershell
cd backend
node server.js
```

**Importante:** El backend debe estar en modo desarrollo (`NODE_ENV=development`) para que la interfaz esté disponible.

### 2. Abrir la Interfaz

Abre tu navegador y ve a:

```
http://localhost:3002/test-ui/test-notifications.html
```

### 3. Flujo de Uso

#### Paso 1: Autenticación
- **Email:** `owner@test.com` (ya está pre-rellenado)
- **Contraseña:** `password` (ya está pre-rellenado)
- Click en **"🔐 Iniciar Sesión"**
- Verás un mensaje verde: "✅ Login exitoso"

#### Paso 2: Seleccionar Tienda
- Click en **"🏪 Cargar Tiendas"**
- Se mostrarán todas las tiendas disponibles
- Click en cualquier tienda para seleccionarla
- La tienda seleccionada se marcará con fondo azul

#### Paso 3: Simular Notificación

**Configuración:**
- **Monto:** Cantidad en soles (ej: 50.00)
- **Nombre del Remitente:** Nombre de quien envía (ej: Juan Pérez)
- **Fuente:** Yape o Plin
- **Formato de Mensaje:** 4 opciones disponibles

**Vista Previa:**
- Al cambiar cualquier parámetro, verás una vista previa del mensaje que se generará
- Muestra cómo se verá la notificación con título, texto y bigText

**Opciones:**

1. **📱 Simular Notificación:** Crea 1 notificación con los datos ingresados
2. **📊 Simular 5 Notificaciones (Batch):** Crea 5 notificaciones aleatorias

## 🎯 Formatos de Mensaje Disponibles

### Formato 1: "Recibiste S/ XX.XX"
```
Título: Recibiste un Yape
Texto: Recibiste S/ 50.00
BigText: Juan te envió S/ 50.00 por Yape
```

### Formato 2: "S/ XX.XX de Nombre"
```
Título: Nuevo pago de Juan
Texto: S/ 50.00 de Juan
BigText: ¡Juan te yapeó S/ 50.00! 💰
```

### Formato 3: "Te yapeó S/ XX.XX"
```
Título: Juan Pérez
Texto: Te yapeó S/ 50.00
BigText: Juan Pérez te yapeó S/ 50.00. ¡Revisa tu saldo!
```

### Formato 4: Solo monto
```
Título: Yape
Texto: S/ 50.00
BigText: Recibiste S/ 50.00 de Juan
```

## 📊 Resultados

Después de simular una notificación, verás:

- **ID de Notificación:** Identificador único (primeros 12 caracteres)
- **Monto:** Cantidad simulada
- **De:** Nombre del remitente
- **Fuente:** Yape o Plin
- **Trabajadores Notificados:** Cuántos trabajadores recibieron FCM
- **Tokens FCM Disponibles:** Cuántos trabajadores tienen token FCM válido

## 🔍 Verificación en Base de Datos

Puedes verificar las notificaciones creadas en Supabase:

```sql
SELECT 
  id, 
  amount, 
  sender_name, 
  source, 
  message,
  raw_data->>'simulated' as is_simulated,
  created_at
FROM notifications
WHERE raw_data->>'simulated' = 'true'
ORDER BY created_at DESC
LIMIT 10;
```

## 🧹 Limpiar Datos de Prueba

Para eliminar todas las notificaciones simuladas:

```sql
DELETE FROM notifications 
WHERE raw_data->>'simulated' = 'true';
```

## 🎨 Características de la Interfaz

- ✅ **Diseño Moderno:** Gradiente púrpura-azul, Material Design
- ✅ **Responsive:** Funciona en desktop, tablet y móvil
- ✅ **Alertas Visuales:** Feedback inmediato de cada acción
- ✅ **Vista Previa en Tiempo Real:** Ve cómo quedará el mensaje antes de simular
- ✅ **Animaciones Suaves:** Transiciones y efectos visuales
- ✅ **Validaciones:** No permite simular sin autenticación o tienda

## 🚨 Troubleshooting

### Backend no responde
- Verifica que el backend esté corriendo: `node server.js`
- Verifica que el puerto sea 3002: `http://localhost:3002`
- Revisa la consola del navegador (F12) para ver errores

### No aparecen tiendas
- Verifica que existan tiendas en la base de datos
- Verifica que el usuario tenga tiendas asignadas
- Revisa que el token de autenticación sea válido

### FCM no se envía
- Verifica que los trabajadores tengan `fcm_token` en la base de datos
- Verifica que Firebase esté correctamente configurado
- Revisa los logs del backend para ver errores de Firebase

### Error CORS
- Verifica que `CORS_ORIGIN` en `.env` incluya `http://localhost:3002`
- O configúralo como `*` para desarrollo

## 📝 Notas

- **Solo en Desarrollo:** Esta interfaz solo está disponible cuando `NODE_ENV=development`
- **Credenciales por Defecto:** `owner@test.com` / `password` (usuario de prueba)
- **Puerto del Backend:** Asume que el backend corre en puerto 3002
- **Marca de Simulación:** Todas las notificaciones creadas incluyen `raw_data.simulated = true`

## 🔗 Endpoints Utilizados

La interfaz usa estos endpoints del backend:

1. `POST /api/auth/login` - Autenticación
2. `GET /api/test/stores` - Listar tiendas
3. `POST /api/test/simulate-notification` - Simular notificación
4. `POST /api/test/simulate-batch` - Simular batch

## 💡 Ventajas sobre PowerShell

- ✅ No necesitas aprender comandos de PowerShell
- ✅ Vista previa en tiempo real del mensaje
- ✅ Interfaz visual intuitiva
- ✅ Resultados inmediatos con detalles
- ✅ Funciona en cualquier sistema operativo (Windows, Mac, Linux)
- ✅ No necesitas instalar nada extra (solo navegador)

## 🎯 Próximos Pasos

Después de simular notificaciones:

1. **Verificar en App Móvil:** Los trabajadores deberían recibir notificaciones FCM
2. **Revisar Logs del Backend:** Ver detalles de la simulación en consola
3. **Consultar Base de Datos:** Verificar que las notificaciones se guardaron correctamente
4. **Probar Notificaciones Reales:** Usar la app para capturar notificaciones reales de Yape/Plin

---

**¡Disfruta probando el sistema de notificaciones! 🚀**
