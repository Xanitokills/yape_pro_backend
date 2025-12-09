# 🔐 Panel de Administración Super Admin - Guía Rápida

## ✅ Sistema Implementado

Se ha creado un panel de administración completo para el Super Admin con las siguientes capacidades:

### 🎯 Funcionalidades

#### 1. **Dashboard Principal** (`/admin`)
- Resumen de métricas clave
- Total de usuarios y usuarios activos
- Revenue mensual estimado
- Transacciones del mes
- Distribución de usuarios por plan
- Actividad reciente (upgrades/downgrades)
- Alertas de usuarios cerca del límite

#### 2. **Gestión de Usuarios** (`/admin/users`)
- Ver todos los usuarios con información de suscripción
- Buscar por nombre o email
- Filtrar por plan (Gratis, Profesional, Empresarial)
- Filtrar por estado (activo, inactivo, expirado, trial)
- **Cambiar plan de cualquier usuario**
- Ver historial completo de cambios de plan
- Resetear límites de uso manualmente
- Paginación (20 usuarios por página)

#### 3. **Gestión de Planes** (`/admin/plans`)
- Ver todos los planes existentes
- **Crear nuevos planes**
- **Editar planes existentes**:
  - Nombre y precio
  - Límites (tiendas, empleados, transacciones/mes)
  - Características (reportes, soporte, API, etc.)
  - Badge y orden de visualización
- Desactivar planes (no se puede si hay usuarios usando el plan)
- Vista visual de características de cada plan

#### 4. **Estadísticas Detalladas** (`/admin/stats`)
- Métricas de revenue por plan
- Tasa de conversión (usuarios free vs. pagos)
- Actividad del último mes (upgrades/downgrades)
- Indicadores de salud del sistema
- Distribución visual de usuarios
- Alertas de usuarios cerca del límite

## 📋 Pasos para Activar el Panel

### 1. Ejecutar Migraciones SQL

**Primero**, ejecutar el sistema de planes:
```sql
-- En Supabase SQL Editor
-- Copiar y ejecutar: backend/migrations/add_subscription_plans.sql
```

**Segundo**, configurar el Super Admin:
```sql
-- En Supabase SQL Editor
-- Copiar y ejecutar: backend/migrations/configure_super_admin.sql
```

Esto hará:
- Crear las tablas de suscripciones
- Crear los 3 planes iniciales
- Asignar rol `super_admin` a sandrosaavedracastro@gmail.com
- Darle plan Enterprise
- Crear funciones auxiliares

### 2. Reiniciar Backend

```powershell
cd D:\Dobleteos\Yape_Smart\backend
npm start
```

Verificar que no haya errores en la consola.

### 3. Probar el Panel de Admin

1. **Iniciar el Front**:
   ```powershell
   cd D:\Dobleteos\Yape_Smart\Front
   npm run dev
   ```

2. **Iniciar sesión** con:
   - Email: `sandrosaavedracastro@gmail.com`
   - Password: [tu contraseña]

3. **Acceder al panel**: `http://localhost:3000/admin`

## 🎨 Rutas del Panel de Admin

| Ruta | Descripción |
|------|-------------|
| `/admin` | Dashboard principal con métricas |
| `/admin/users` | Gestión de usuarios y planes |
| `/admin/plans` | CRUD de planes de suscripción |
| `/admin/stats` | Estadísticas detalladas y gráficas |

## 🔒 Seguridad

### Backend
- Todas las rutas `/api/admin/*` requieren:
  1. Token JWT válido (`Authorization: Bearer TOKEN`)
  2. Rol `super_admin`
- Implementado en `src/routes/admin.js` con middleware `authorizeRoles('super_admin')`

### Frontend
- El layout `/admin/layout.tsx` verifica:
  1. Usuario autenticado
  2. Rol `super_admin`
- Redirige a `/dashboard` si no cumple los requisitos
- Badge visual "Super Admin" en la UI

## 📡 Endpoints API Disponibles

### Usuarios
```
GET    /api/admin/users                    - Listar usuarios (con filtros)
POST   /api/admin/users/:userId/change-plan - Cambiar plan
GET    /api/admin/users/:userId/history    - Ver historial
POST   /api/admin/users/:userId/reset-limits - Resetear límites
```

### Estadísticas
```
GET    /api/admin/stats                    - Estadísticas generales
```

### Planes
```
GET    /api/subscriptions/plans            - Listar planes (público)
POST   /api/admin/plans                    - Crear plan
PUT    /api/admin/plans/:planId            - Actualizar plan
DELETE /api/admin/plans/:planId            - Desactivar plan
```

## 🧪 Testing Rápido

### 1. Verificar Acceso
```bash
# Verificar que el usuario sea super_admin
curl http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Ver Usuarios
```bash
curl http://localhost:3000/api/admin/users?limit=5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Cambiar Plan de Usuario
```bash
curl -X POST http://localhost:3000/api/admin/users/USER_ID/change-plan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId": "professional", "notes": "Upgrade manual"}'
```

## 🎯 Acciones Comunes

### Cambiar Plan de un Usuario
1. Ir a `/admin/users`
2. Buscar el usuario
3. Click en el ícono de editar (✏️)
4. Seleccionar nuevo plan
5. Agregar notas (opcional)
6. Click "Cambiar Plan"

### Crear un Nuevo Plan
1. Ir a `/admin/plans`
2. Click "Nuevo Plan"
3. Llenar el formulario:
   - Nombre y precio
   - Límites (vacío = ilimitado)
   - Marcar características incluidas
4. Click "Guardar Plan"

### Ver Historial de un Usuario
1. Ir a `/admin/users`
2. Click en el ícono de historial (📋)
3. Ver todos los cambios de plan

### Resetear Límites Manualmente
1. Ir a `/admin/users`
2. Click en el ícono de resetear (🔄)
3. Confirmar acción
4. Los contadores de transacciones se resetean a 0

## 📊 Métricas Disponibles

### Dashboard Principal
- Total de usuarios
- Usuarios activos
- Revenue mensual (calculado según planes)
- Transacciones procesadas
- Distribución por plan (gráfica circular)
- Upgrades vs. Downgrades del mes

### Página de Estadísticas
- Revenue por plan
- Tasa de conversión (free → paid)
- Indicadores de salud:
  - Tasa de actividad
  - Conversión a pago
- Usuarios cerca del límite (>80%)
- Balance neto de cambios

## 🚨 Alertas

El sistema alerta automáticamente sobre:
- Usuarios que han usado >80% de su plan
- Número de upgrades y downgrades
- Balance neto negativo (más downgrades que upgrades)

## 💡 Tips de Uso

1. **Filtros en Usuarios**: Usa los filtros para encontrar usuarios específicos:
   - Por plan (free, professional, enterprise)
   - Por estado (active, inactive, expired, trial)
   - Por búsqueda (nombre o email)

2. **Límites Ilimitados**: Al editar planes, deja los campos vacíos para indicar "ilimitado"

3. **Notas en Cambios**: Siempre agrega notas al cambiar planes para mantener historial

4. **Desactivar vs. Eliminar**: Los planes se desactivan, no se eliminan, para mantener integridad

5. **Protección**: No se puede desactivar un plan si hay usuarios usándolo

## 🔧 Troubleshooting

### Error: "No autorizado"
- Verificar que el usuario tenga rol `super_admin` en la BD
- Ejecutar: `SELECT role FROM users WHERE email = 'sandrosaavedracastro@gmail.com'`

### Error: "get_users_near_limit does not exist"
- Ejecutar el script `configure_super_admin.sql` completo

### Panel no se ve
- Verificar que estés logueado con el usuario correcto
- Verificar en la consola del navegador si hay errores
- Verificar que el backend esté ejecutándose

### Botones no funcionan
- Verificar que el backend tenga las rutas de admin
- Verificar en la consola del navegador la respuesta del API
- Verificar el token JWT en localStorage

## 📝 Archivos Creados

### Backend
- `src/controllers/adminController.js` - Lógica de admin
- `src/routes/admin.js` - Rutas de admin
- `src/app.js` - Actualizado con rutas admin
- `migrations/configure_super_admin.sql` - SQL de configuración

### Frontend
- `src/app/admin/layout.tsx` - Layout protegido
- `src/app/admin/page.tsx` - Dashboard principal
- `src/app/admin/users/page.tsx` - Gestión de usuarios
- `src/app/admin/plans/page.tsx` - Gestión de planes
- `src/app/admin/stats/page.tsx` - Estadísticas
- `src/lib/api.ts` - Actualizado con funciones admin

## 🎉 ¡Listo!

El panel de administración está completo y funcional. El Super Admin puede:
- ✅ Ver todos los usuarios y sus planes
- ✅ Cambiar planes de usuarios
- ✅ Crear y editar planes
- ✅ Ver estadísticas detalladas
- ✅ Resetear límites manualmente
- ✅ Ver historial de cambios

Para cualquier duda, revisar los comentarios en los archivos de código.
