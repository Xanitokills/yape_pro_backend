# 🔧 Solución: Error "raw_data column not found"

## ❌ Error Detectado

```
Could not find the 'raw_data' column of 'notifications' in the schema cache
```

## 🎯 Causa

La tabla `notifications` no tiene la columna `raw_data` que el código necesita para almacenar:
- Flag `simulated: true` (para notificaciones de prueba)
- Formato del mensaje (`format: 1-4`)
- Datos adicionales de la notificación

## ✅ Solución

### Paso 1: Ir a Supabase Dashboard

1. Abre tu navegador
2. Ve a: https://supabase.com/dashboard
3. Selecciona tu proyecto **Yape Pro**
4. Click en **SQL Editor** en el menú izquierdo

### Paso 2: Ejecutar Migración

Copia y pega el siguiente código en el SQL Editor:

```sql
-- Agregar columna raw_data a notifications
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}';

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_notifications_raw_data_simulated 
ON notifications ((raw_data->>'simulated'));

-- Verificar que se creó correctamente
SELECT 
    column_name, 
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'notifications' 
AND column_name = 'raw_data';
```

### Paso 3: Ejecutar

1. Click en el botón **"Run"** (▶️)
2. Verás el resultado: `raw_data | jsonb | '{}'::jsonb`
3. ✅ ¡Listo!

## 🧪 Probar de Nuevo

Una vez ejecutado el SQL en Supabase, vuelve a la interfaz web:

```
http://localhost:3002/test-ui/test-notifications.html
```

Y simula una notificación. Ahora debería funcionar correctamente.

## 📊 Verificar en Base de Datos

Puedes verificar que las notificaciones tienen `raw_data`:

```sql
SELECT 
  id, 
  amount, 
  sender_name, 
  source,
  raw_data
FROM notifications
ORDER BY created_at DESC
LIMIT 5;
```

Las notificaciones simuladas tendrán:
```json
{
  "simulated": true,
  "format": 3
}
```

## 🗑️ Limpiar Notificaciones de Prueba

Si quieres eliminar todas las notificaciones simuladas:

```sql
DELETE FROM notifications 
WHERE raw_data->>'simulated' = 'true';
```

## ℹ️ Notas

- La migración es segura, no afecta datos existentes
- Solo agrega una columna nueva con valor por defecto `{}`
- Las notificaciones existentes tendrán `raw_data = {}`
- Las nuevas notificaciones simuladas incluirán el flag `simulated: true`

---

**¡Ejecuta el SQL en Supabase y vuelve a probar! 🚀**
