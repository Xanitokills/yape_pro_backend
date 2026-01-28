# 🔒 Guía de Seguridad - Yape Pro Backend

## ✅ Vulnerabilidades Corregidas

### 1. **CORS Inseguro** ✓
- **Antes**: `origin: '*'` - Permitía acceso desde cualquier dominio
- **Ahora**: Lista blanca de orígenes configurables en `.env`
- **Configuración**: Definir `CORS_ORIGIN` con dominios permitidos separados por coma

### 2. **Rutas de Testing en Producción** ✓
- **Antes**: Rutas `/api/test` y `/test-ui` habilitadas con solo `NODE_ENV`
- **Ahora**: Requieren flags explícitos adicionales
- **Configuración**: 
  - `ENABLE_TEST_ROUTES=true` (NUNCA en producción)
  - `ENABLE_TEST_UI=true` (NUNCA en producción)

### 3. **Contraseñas en Logs** ✓
- **Antes**: `console.log(req.body)` exponía contraseñas
- **Ahora**: Filtrado automático de campos sensibles
- **Campos protegidos**: password, token, secret, apiKey, authorization

### 4. **Exposición de Información** ✓
- **Antes**: Endpoint `/` mostraba toda la estructura del API
- **Ahora**: Respuesta minimalista sin detalles de implementación

### 5. **Validación de Variables de Entorno** ✓
- **Antes**: Variables opcionales sin validación
- **Ahora**: Validación estricta al iniciar
- **Validaciones**:
  - JWT_SECRET mínimo 32 caracteres
  - CORS_ORIGIN obligatorio en producción
  - Test routes bloqueadas en producción

### 6. **Rate Limiting** ✓
- **Implementado**: Protección contra abuso de API
- **General API**: 100 requests/15min
- **Login**: 5 intentos/15min
- **Registro**: 3 cuentas/hora por IP
- **SMS**: 3 códigos/hora por IP
- **Contacto**: 5 envíos/hora
- **Admin**: 30 requests/15min

---

## 🚨 Checklist de Seguridad para Producción

### Antes de Desplegar:

- [ ] **Variables de Entorno**
  - [ ] Copiar `.env.example` a `.env`
  - [ ] Configurar `NODE_ENV=production`
  - [ ] JWT_SECRET con al menos 64 caracteres aleatorios
  - [ ] CORS_ORIGIN con dominios específicos (sin `*`)
  - [ ] Credenciales de Supabase configuradas
  - [ ] Credenciales de Firebase configuradas
  - [ ] Credenciales de IZIPAY modo PRODUCTION

- [ ] **Rutas Peligrosas**
  - [ ] `ENABLE_TEST_ROUTES` NO configurada o en `false`
  - [ ] `ENABLE_TEST_UI` NO configurada o en `false`
  - [ ] Verificar que `/api/test` retorna 404

- [ ] **Archivos Sensibles**
  - [ ] `.env` en `.gitignore`
  - [ ] Firebase JSON en `.gitignore`
  - [ ] Sin credenciales en el código

- [ ] **Base de Datos**
  - [ ] RLS (Row Level Security) habilitado en Supabase
  - [ ] Políticas de seguridad configuradas
  - [ ] Service key solo en backend

- [ ] **Autenticación**
  - [ ] JWT con expiración corta (`JWT_EXPIRES_IN`)
  - [ ] Validación de roles en rutas admin
  - [ ] Rate limiting implementado

---

## 🔧 Generar Claves Seguras

### JWT_SECRET (64 caracteres):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### IZIPAY_HMAC_SHA256:
Proporcionado por IZIPAY en el panel de administración

---

## 🛡️ Recomendaciones Adicionales

### 1. **Rate Limiting**
Implementar límite de peticiones por IP:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de requests
});

app.use('/api/', limiter);
```

### 2. **Helmet.js**
Añadir headers de seguridad:
```bash
npm install helmet
```
```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 3. **HTTPS Obligatorio**
En producción, redirigir HTTP a HTTPS:
```javascript
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### 4. **Monitoreo**
- Logs centralizados (Winston, Loggly)
- Alertas de errores (Sentry)
- Métricas de rendimiento

### 5. **Backups**
- Backups automáticos de Supabase
- Versionado de migraciones
- Plan de recuperación ante desastres

---

## 📋 Auditoría de Seguridad

### Comandos Útiles:

```bash
# Verificar dependencias vulnerables
npm audit

# Actualizar dependencias
npm audit fix

# Escanear código
npm run lint
```

### Revisar Periódicamente:
- [ ] Dependencias actualizadas
- [ ] Logs de acceso sospechosos
- [ ] Intentos de autenticación fallidos
- [ ] Uso de rutas administrativas
- [ ] Patrones de tráfico anómalos

---

## 🚫 Nunca Hacer:

1. ❌ Commitear archivos `.env`
2. ❌ Loguear contraseñas o tokens
3. ❌ Usar `CORS: '*'` en producción
4. ❌ Exponer stack traces al cliente
5. ❌ Dejar rutas de testing activas
6. ❌ Usar credenciales hardcodeadas
7. ❌ Ejecutar con permisos de root
8. ❌ Deshabilitar validaciones en producción

---

## 📞 Contacto en Caso de Incidente

Si detectas una vulnerabilidad o brecha de seguridad:
1. NO la publiques públicamente
2. Contacta al equipo de desarrollo inmediatamente
3. Documenta los detalles técnicos
4. Preserva evidencia (logs, requests)

---

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Supabase Security](https://supabase.com/docs/guides/auth/security)

---

**Última actualización**: 28 de Enero, 2026
**Versión**: 1.0.0
