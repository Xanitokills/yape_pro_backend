# 🧪 Sistema de Pruebas de Notificaciones

## 📋 Descripción

Módulo integrado en el panel de administración que permite simular y verificar el funcionamiento del sistema de parseo de notificaciones por país y billetera.

## 🎯 Funcionalidades

### 1. **Prueba Individual**
- Selecciona un país y una billetera específica
- Genera una notificación simulada aleatoria
- Muestra:
  - Notificación original simulada
  - Datos parseados (monto, tipo, origen)
  - Estado de parseo (exitoso/fallido)
  - Cantidad de patrones activos

### 2. **Prueba por País**
- Ejecuta pruebas en todas las billeteras de un país
- Muestra estadísticas:
  - Total de pruebas ejecutadas
  - Pruebas exitosas
  - Pruebas fallidas
  - Porcentaje de éxito

### 3. **Prueba Completa del Sistema**
- Ejecuta pruebas en TODOS los países y billeteras configuradas
- Dashboard completo con:
  - Total de países probados
  - Total de pruebas ejecutadas
  - Pruebas exitosas/fallidas
  - Tasa de éxito general
  - Detalles por cada país

### 4. **Estado del Sistema**
- Vista general del estado de cada país
- Información por país:
  - Nombre y moneda
  - Cantidad de billeteras configuradas
  - Patrones activos vs totales
  - Disponibilidad de parser
  - Estado operacional (operacional/limitado)
  - Lista de billeteras soportadas

## 📁 Archivos Creados

### Backend
1. **`backend/src/services/testNotificationService.js`**
   - Servicio principal con la lógica de pruebas
   - Plantillas de notificaciones simuladas por país y billetera
   - Funciones de generación y validación

2. **`backend/src/controllers/adminController.js`** (modificado)
   - Nuevos controladores agregados:
     - `getTestOptions`: Lista de opciones disponibles
     - `generateTestNotification`: Generar prueba individual
     - `testCountryNotifications`: Probar país completo
     - `testAllNotifications`: Prueba completa del sistema
     - `getSystemStatus`: Estado del sistema

3. **`backend/src/routes/admin.js`** (modificado)
   - Nuevas rutas agregadas:
     - `GET /api/admin/test-notifications/options`
     - `GET /api/admin/test-notifications/status`
     - `POST /api/admin/test-notifications/generate`
     - `GET /api/admin/test-notifications/country/:country`
     - `GET /api/admin/test-notifications/all`

### Frontend
1. **`Front/src/app/admin/test-notifications/page.tsx`**
   - Componente principal de React/Next.js
   - Interface completa con tabs para cada tipo de prueba
   - Animaciones con Framer Motion
   - Diseño responsive y moderno

2. **`Front/src/lib/api.ts`** (modificado)
   - Nuevas interfaces TypeScript agregadas
   - Funciones de API para comunicación con backend:
     - `getTestNotificationOptions()`
     - `generateTestNotification()`
     - `testCountryNotifications()`
     - `testAllNotifications()`
     - `getSystemStatus()`

3. **`Front/src/app/admin/layout.tsx`** (modificado)
   - Nuevo menú "Pruebas" agregado
   - Ícono: TestTube

## 🌎 Países y Billeteras Soportadas

### Perú (PE)
- YAPE
- PLIN
- TUNKI
- INTERBANK
- BBVA
- BCP

### Bolivia (BO)
- TIGO_MONEY
- BANCO_UNION
- BNB

### Chile (CL)
- MACH
- MERCADO_PAGO

### Ecuador (EC)
- BANCO_PICHINCHA
- BANCO_GUAYAQUIL

### Colombia (CO)
- NEQUI
- DAVIPLATA
- BANCOLOMBIA

### México (MX)
- MERCADO_PAGO
- BBVA_MEXICO

### Argentina (AR)
- MERCADO_PAGO
- BRUBANK

## 🚀 Cómo Usar

1. **Acceder al Panel**
   ```
   http://localhost:3000/admin/test-notifications
   (Solo accesible para super_admin)
   ```

2. **Prueba Individual**
   - Selecciona país
   - Selecciona billetera
   - Click en "Generar Prueba"
   - Revisa los resultados del parseo

3. **Prueba por País**
   - Selecciona un país
   - Click en "Probar País Completo"
   - Revisa las estadísticas

4. **Prueba Completa**
   - Click en "Ejecutar Prueba Completa"
   - Espera mientras se ejecutan todas las pruebas
   - Revisa el dashboard completo de resultados

5. **Estado del Sistema**
   - Click en "Verificar Estado"
   - Revisa el estado de cada país y sus patrones

## 🔐 Seguridad

- ✅ Solo accesible por usuarios con rol `super_admin`
- ✅ Autenticación mediante JWT token
- ✅ Rate limiting aplicado mediante middleware
- ✅ No modifica datos reales, solo simula

## 📊 Casos de Uso

1. **Verificar Parsers**: Comprobar que los parsers funcionen correctamente
2. **Validar Patrones**: Verificar que los patrones de regex sean efectivos
3. **Detectar Problemas**: Identificar países o billeteras con problemas
4. **Monitoreo Proactivo**: Revisar el estado del sistema regularmente
5. **Después de Cambios**: Validar que las actualizaciones no rompan funcionalidad

## 🎨 Características de UI

- ✨ Diseño moderno con gradientes y sombras
- 📱 Completamente responsive
- 🎭 Animaciones fluidas con Framer Motion
- 🎨 Código de colores intuitivo:
  - Verde: Éxito/Operacional
  - Rojo: Error/Limitado
  - Azul: Información
  - Amarillo: Advertencia
- 🔄 Estados de carga con spinners
- 📊 Dashboards con métricas visuales

## 🔧 Mantenimiento

### Agregar Nuevas Notificaciones de Prueba
Edita `backend/src/services/testNotificationService.js`:

```javascript
const TEST_NOTIFICATIONS = {
  // Agregar nuevo país
  NuevoPais: {
    NUEVA_BILLETERA: [
      'Notificación de prueba 1',
      'Notificación de prueba 2'
    ]
  }
};
```

### Agregar Nuevo País al Sistema
1. Agregar en `backend/src/config/countries.js`
2. Agregar plantillas en `testNotificationService.js`
3. Crear patrones en la base de datos
4. Probar con este módulo

## 📝 Notas Importantes

- Las notificaciones son **simuladas**, no afectan datos reales
- Los resultados dependen de:
  - Patrones activos en la base de datos
  - Configuración del parser del país
  - Regex de los patrones configurados
- Se recomienda ejecutar pruebas después de:
  - Actualizar patrones
  - Modificar parsers
  - Agregar nuevos países
  - Cambios en el sistema de notificaciones

## 🐛 Troubleshooting

**Problema**: No aparecen opciones de prueba
- Solución: Verificar que el servicio esté corriendo y el usuario sea super_admin

**Problema**: Todas las pruebas fallan
- Solución: Verificar patrones activos en la base de datos

**Problema**: País sin patrones activos
- Solución: Crear patrones desde el módulo de Patrones del admin

## 📞 Soporte

Para preguntas o problemas:
1. Revisar los logs del backend
2. Verificar los patrones en la base de datos
3. Comprobar la configuración de países
4. Revisar la consola del navegador para errores de frontend

---

**Desarrollado para**: Yape Pro Admin Panel
**Versión**: 1.0.0
**Fecha**: Febrero 2026
