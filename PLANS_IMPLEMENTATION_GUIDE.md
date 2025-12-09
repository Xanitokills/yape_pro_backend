# 📋 Sistema de Planes y Límites - Guía de Implementación

## 🎯 Resumen

Se ha implementado un sistema completo de gestión de planes de suscripción con control de límites y tracking de uso.

## 📁 Archivos Creados/Modificados

### Backend

#### Nuevos Archivos:
1. **`migrations/add_subscription_plans.sql`** - Schema completo de planes
   - Tabla `subscription_plans` con 3 planes: Gratis, Profesional, Empresarial
   - Tabla `usage_tracking` para contadores mensuales
   - Tabla `subscription_history` para historial de cambios
   - Funciones SQL: `check_plan_limit()`, `increment_usage()`, `reset_monthly_counters()`
   - Vista `user_subscription_info` con información completa

2. **`src/services/subscriptionService.js`** - Lógica de negocio
   - `getAllPlans()` - Obtener planes disponibles
   - `getUserSubscription()` - Info de suscripción del usuario
   - `checkLimit()` - Verificar límites (stores, employees, transactions)
   - `incrementUsage()` - Incrementar contadores
   - `changePlan()` - Cambiar plan de usuario
   - `getUsageStats()` - Estadísticas de uso
   - `recordTransaction()` - Registrar y validar transacción

3. **`src/middleware/planLimits.js`** - Middleware de validación
   - `checkStoreLimit` - Verificar límite de tiendas
   - `checkEmployeeLimit` - Verificar límite de empleados
   - `checkTransactionLimit` - Verificar límite de transacciones
   - `requirePlanFeature` - Verificar características del plan

4. **`src/controllers/subscriptionController.js`** - Endpoints
   - GET `/api/subscriptions/plans` - Listar planes
   - GET `/api/subscriptions/my-subscription` - Suscripción actual
   - GET `/api/subscriptions/usage` - Estadísticas de uso
   - POST `/api/subscriptions/change-plan` - Cambiar plan
   - GET `/api/subscriptions/check-limit/:limitType` - Verificar límite

5. **`src/routes/subscriptions.js`** - Rutas de suscripciones

#### Archivos Modificados:
- **`src/app.js`** - Agregado `app.use('/api/subscriptions', subscriptionRoutes)`
- **`src/routes/stores.js`** - Agregado middleware `checkStoreLimit`
- **`src/routes/workers.js`** - Agregado middleware `checkEmployeeLimit`
- **`src/controllers/notificationController.js`** - Agregado validación de transacciones

### Mobile (Flutter)

#### Archivos Modificados:
- **`lib/services/api_service.dart`** - Agregados métodos:
  - `getPlans()` - Obtener planes
  - `getMySubscription()` - Suscripción actual
  - `getUsageStats()` - Estadísticas
  - `changePlan()` - Cambiar plan
  - `checkLimit()` - Verificar límite

- **`lib/screens/owner/owner_home.dart`** - Actualizado `PlansOnboardingScreen`:
  - Carga dinámica de planes desde el backend
  - Muestra plan actual del usuario
  - Interfaz adaptable según datos del backend
  - Manejo de estados de carga

## 🗄️ Estructura de Base de Datos

### Tabla `subscription_plans`
```sql
- id (PK): 'free', 'professional', 'enterprise'
- name: Nombre del plan
- price_monthly: Precio mensual
- max_stores: Límite de tiendas (NULL = ilimitado)
- max_employees: Límite de empleados (NULL = ilimitado)
- max_transactions_monthly: Límite de transacciones/mes (NULL = ilimitado)
- has_advanced_reports: Boolean
- has_priority_support: Boolean
- has_api_access: Boolean
- has_account_manager: Boolean
- has_white_label: Boolean
- has_sla: Boolean
- badge: 'Popular', 'Premium', etc.
- color: Color hex del plan
- icon: Nombre del icono
```

### Tabla `usage_tracking`
```sql
- user_id (FK)
- year, month: Período de tracking
- transactions_count: Contador de transacciones
- stores_count: Contador de tiendas activas
- employees_count: Contador de empleados activos
```

### Tabla `subscription_history`
```sql
- user_id (FK)
- plan_id (FK)
- action: 'upgrade', 'downgrade', 'renew', 'cancel', 'expire'
- previous_plan_id: Plan anterior
- notes: Notas del cambio
```

## 📋 Planes Configurados

### Plan Gratis (free)
- **Precio**: S/.0/mes
- **Límites**:
  - 1 tienda
  - 2 empleados
  - 50 transacciones/mes
- **Características**:
  - Reportes básicos
  - App móvil

### Plan Profesional (professional)
- **Precio**: S/.30/mes
- **Límites**:
  - 3 tiendas
  - 10 empleados
  - Transacciones ilimitadas
- **Características**:
  - Reportes avanzados
  - Soporte prioritario
  - Integraciones API
  - App móvil

### Plan Empresarial (enterprise)
- **Precio**: S/.200/mes
- **Límites**:
  - Tiendas ilimitadas
  - Empleados ilimitados
  - Transacciones ilimitadas
- **Características**:
  - Todo de Profesional
  - Account manager
  - App white-label
  - SLA 99.9%
  - Onboarding dedicado

## 🚀 Pasos de Implementación

### 1. Ejecutar Migración SQL
```bash
# En Supabase Dashboard > SQL Editor
# Ejecutar el contenido de: backend/migrations/add_subscription_plans.sql
```

### 2. Reiniciar Backend
```bash
cd backend
npm install  # Si es necesario
npm start
```

### 3. Probar Endpoints

#### Obtener planes disponibles:
```bash
GET http://localhost:3002/api/subscriptions/plans
```

#### Obtener suscripción actual (requiere auth):
```bash
GET http://localhost:3002/api/subscriptions/my-subscription
Headers: Authorization: Bearer <token>
```

#### Verificar límite:
```bash
GET http://localhost:3002/api/subscriptions/check-limit/stores
Headers: Authorization: Bearer <token>
```

#### Cambiar plan:
```bash
POST http://localhost:3002/api/subscriptions/change-plan
Headers: Authorization: Bearer <token>
Body: {
  "planId": "professional",
  "notes": "Upgrade desde mobile"
}
```

### 4. Actualizar App Mobile

La app ya está configurada para:
- Cargar planes dinámicamente desde el backend
- Mostrar el plan actual del usuario
- Validar límites antes de crear tiendas/empleados
- Manejar errores de límite de transacciones

## 🔒 Control de Límites

### Al Crear Tienda
```javascript
// En routes/stores.js
router.post('/', checkStoreLimit, storeController.createStore);
```

Respuesta si excede límite:
```json
{
  "success": false,
  "message": "Has alcanzado el límite de tu plan",
  "error": "PLAN_LIMIT_REACHED",
  "details": {
    "limitType": "stores",
    "limit": 1,
    "current": 1,
    "remaining": 0
  }
}
```

### Al Agregar Empleado
```javascript
// En routes/workers.js
router.post('/', checkEmployeeLimit, workerController.addWorker);
```

### Al Crear Notificación (Transacción)
```javascript
// En controllers/notificationController.js
await subscriptionService.recordTransaction(store.owner_id);
```

Respuesta si excede límite:
```json
{
  "success": false,
  "error": "PLAN_LIMIT_REACHED",
  "message": "Límite de transacciones alcanzado. Límite: 50, Actual: 50",
  "upgradeRequired": true
}
```

## 📊 Flujo de Verificación de Límites

1. **Usuario intenta acción** (crear tienda, empleado, transacción)
2. **Middleware verifica límite** usando `subscriptionService.checkLimit()`
3. **Consulta SQL** obtiene:
   - Plan actual del usuario
   - Límite del plan para esa acción
   - Uso actual desde `usage_tracking` o conteo en tiempo real
4. **Devuelve resultado**:
   ```javascript
   {
     allowed: true/false,
     limit: 10,        // o "unlimited"
     current: 5,
     remaining: 5
   }
   ```
5. **Si no está permitido**: Responde con error `PLAN_LIMIT_REACHED`
6. **Si está permitido**: Continúa la acción y opcionalmente incrementa contador

## 🎨 UI Mobile - Pantalla de Planes

### Características:
- **Onboarding fullscreen** con PageView horizontal
- **Carga dinámica** de planes desde backend
- **Indicadores de página** animados
- **Color dinámico** según plan activo
- **Badge "PLAN ACTUAL"** en plan del usuario
- **Badges personalizados** (Popular, Premium)
- **Características adaptables** según datos del backend
- **Loading state** mientras carga datos

### Adaptación Automática:
- Convierte colores hex a Color de Flutter
- Mapea iconos (bolt, star, workspace_premium)
- Construye lista de features desde:
  - `max_stores`, `max_employees`, `max_transactions_monthly`
  - `has_advanced_reports`, `has_priority_support`, etc.
- Detecta plan actual desde `subscription_plan_id`

## 🔄 Reset de Contadores Mensuales

Los contadores de transacciones se resetean mensualmente. Opciones:

### Opción 1: Cron Job Manual
```sql
SELECT reset_monthly_counters();
```

### Opción 2: Cron Job Automático (Node-cron)
```javascript
// En backend
const cron = require('node-cron');

// Ejecutar el día 1 de cada mes a las 00:00
cron.schedule('0 0 1 * *', async () => {
  await supabase.rpc('reset_monthly_counters');
  console.log('✅ Contadores mensuales reseteados');
});
```

### Opción 3: pg_cron en Supabase (Pro plan)
```sql
SELECT cron.schedule(
  'reset-monthly-counters',
  '0 0 1 * *',
  $$SELECT reset_monthly_counters()$$
);
```

## 🧪 Testing

### Test Manual de Límites:

1. **Crear usuario en plan free**
2. **Intentar crear 2 tiendas** → Segunda debe fallar
3. **Intentar agregar 3 empleados** → Tercero debe fallar
4. **Crear 51 transacciones** → Transacción 51 debe fallar
5. **Cambiar a plan professional**:
   ```bash
   POST /api/subscriptions/change-plan
   Body: { "planId": "professional" }
   ```
6. **Intentar crear 4 tiendas** → Ahora debe permitir hasta 3
7. **Crear transacciones ilimitadas** → Todas deben pasar

## 🎯 Próximos Pasos Recomendados

1. **Integración de Pagos**:
   - Conectar con pasarela de pago (Culqi, Niubiz, Stripe)
   - Actualizar `subscription_status` según pagos
   - Manejar expiración de planes

2. **Notificaciones de Límites**:
   - Avisar cuando esté cerca del límite (80%, 90%)
   - Email/push cuando alcance el límite
   - Sugerencia de upgrade

3. **Analytics de Planes**:
   - Dashboard admin para ver distribución de planes
   - Métricas de conversión free → paid
   - Tracking de churns y upgrades

4. **Características Adicionales**:
   - Períodos de prueba (trial)
   - Descuentos por pago anual
   - Cupones de descuento
   - Planes personalizados

5. **Optimizaciones**:
   - Cache de límites en Redis
   - Batch processing para incrementos
   - Índices adicionales en BD

## 📝 Notas Importantes

- **Usuarios existentes**: Automáticamente asignados al plan 'free'
- **Transacciones**: Contador se resetea cada mes
- **Tiendas/Empleados**: Contador se actualiza en tiempo real
- **NULL en límites**: Significa ilimitado
- **Soft limits**: Los límites son preventivos, no eliminan datos existentes
- **Historial**: Todos los cambios de plan quedan registrados

## 🐛 Troubleshooting

### Error: "check_plan_limit function does not exist"
Ejecutar la migración SQL completa.

### Error: "subscription_plan_id violates foreign key"
Verificar que los planes están insertados en `subscription_plans`.

### Planes no aparecen en mobile
1. Verificar que el backend esté ejecutándose
2. Revisar la URL en `AppConfig` del mobile
3. Ver logs de consola para errores de conexión

### Límites no se aplican
1. Verificar que el middleware esté agregado a las rutas
2. Revisar que el `user_id` correcto se pasa en las funciones
3. Ver logs del backend para errores

## 📚 Referencias

- Documentación Supabase Functions: https://supabase.com/docs/guides/database/functions
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices
- Flutter State Management: https://docs.flutter.dev/development/data-and-backend/state-mgmt
