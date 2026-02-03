# PROBLEMA: Worker iniciando sesión con usuario incorrecto

## 🔴 Diagnóstico del Problema

El worker está iniciando sesión con credenciales de un usuario **VIEJO** que:

- ❌ **Email incorrecto**: `worker976260401@yape.temp`
- ❌ **Teléfono sin código de país**: `976260401` 
- ❌ **NO está vinculado** a ningún worker en la tabla `workers`
- ❌ **Creado el**: 2026-01-28 (6 días ANTES del registro correcto)

### Usuario Correcto vs Usuario Incorrecto

| Campo | Usuario CORRECTO ✅ | Usuario INCORRECTO ❌ |
|-------|-------------------|---------------------|
| ID | `24e2a57b-e248-4099-a7a0-30ece048afe8` | `20ecd3ce-6ee4-49a7-a786-36080d27d55b` |
| Email | `worker+51976260401@yape.temp` | `worker976260401@yape.temp` |
| Phone | `+51976260401` | `976260401` |
| Full Name | `steven` | `Pepe` |
| Created | 2026-02-03 | 2026-01-28 |
| Vinculado a worker | ✅ SÍ | ❌ NO |

## 📋 Causa Raíz

1. **Enero 28**: Alguien se registró con el teléfono **sin código de país** `976260401`
2. **Febrero 3**: Se invitó al worker con el teléfono **completo** `+51976260401`
3. El worker completó el registro **correctamente** 
4. Pero en la app, el worker **sigue con la sesión antigua** del usuario viejo

## ✅ Solución

### Paso 1: Limpiar el usuario viejo de la base de datos

Ejecutar el script SQL `clean-old-worker-user.sql` en Supabase:

```bash
# El script elimina:
# - El usuario viejo (20ecd3ce-...)
# - Sus FCM tokens
# Y verifica que el usuario correcto (24e2a57b-...) permanece intacto
```

### Paso 2: Worker debe cerrar sesión y volver a iniciar

**En la app móvil**, el worker debe:

1. **Cerrar sesión** completamente
2. **Iniciar sesión** con las credenciales correctas:
   - Teléfono: `+51976260401`
   - Contraseña: la contraseña que usó al completar el registro

### Paso 3: Verificar la sesión

Después de iniciar sesión, verificar que:
- ✅ El email mostrado sea: `worker+51976260401@yape.temp`
- ✅ Las notificaciones se muestren correctamente
- ✅ Los datos de la tienda sean visibles

## 🔧 Solución Alternativa (Auto-Sync)

La solución de **auto-sync** agregada en `authController.js` (líneas 391-411) funciona como **parche temporal**, pero:

- ⚠️ Solo corrige el problema **después** de que el worker inicie sesión con usuario incorrecto
- ⚠️ No previene que vuelva a pasar si hay más usuarios duplicados
- ⚠️ Genera confusión porque el worker ve un email diferente al esperado

**Recomendación**: Eliminar el usuario viejo y que el worker cierre sesión es la solución **correcta y permanente**.

## 🛡️ Prevención Futura

Para evitar que esto vuelva a pasar:

1. **Validación en registro**: Asegurar que el teléfono siempre incluya código de país
2. **Bloqueo de duplicados**: La validación en `registerWorker()` ya existe, pero podría mejorar
3. **Formato consistente**: Usar siempre formato internacional E.164 (`+[código país][número]`)
4. **Limpieza periódica**: Revisar usuarios no vinculados a workers y eliminarlos

## 📊 Estado Actual

- ✅ Causa raíz identificada
- ✅ Usuario correcto verificado en base de datos
- ✅ Script de limpieza preparado
- ⏳ Pendiente: Ejecutar limpieza y que worker cierre sesión

---

**Conclusión**: El problema NO es del backend ni del flujo de registro. Es simplemente que el worker está usando credenciales de una cuenta vieja que se creó antes con formato incorrecto. La solución es cerrar sesión y volver a iniciar con las credenciales correctas.
