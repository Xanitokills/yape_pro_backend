# 🚀 GUÍA RÁPIDA DE DESPLIEGUE - BACKEND

## ⚡ DEPLOY EN 5 MINUTOS

### **OPCIÓN 1: Render.com (100% Gratuito) 🌟**

**¡LA MEJOR OPCIÓN! No requiere tarjeta de crédito**

```bash
# 1. Ve a https://render.com
# 2. Conecta tu cuenta de GitHub
# 3. Selecciona "New +" > "Web Service"
# 4. Conecta tu repositorio: yapeproo
# 5. Configura:
#    - Name: yapepro-backend
#    - Environment: Node
#    - Build Command: npm install
#    - Start Command: npm start
#    - Plan: Free (0$/mes)
```

**Variables de entorno a configurar:**
```
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://tvgryyxppqllcuyxbzsq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z3J5eXhwcHFsbGN1eXhienNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMjY4NjAsImV4cCI6MjA3MjcwMjg2MH0.OSTiqct9cuJ9y-KyJmQC-rGOLLfLI3geIhyZ9eaNLWo
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z3J5eXhwcHFsbGN1eXhienNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEyNjg2MCwiZXhwIjoyMDcyNzAyODYwfQ.0vNLb4Q-0_ECqD-buHGFVpyibBmb8KVJZOXBtjOAPEk
JWT_SECRET=tu_jwt_secret_seguro_aqui
JWT_EXPIRES_IN=7d
FIREBASE_PROJECT_ID=yapepro-f6e50
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@yapepro-f6e50.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCrcxMQFAAHaRw6\nmnAc5IonAg5ceOJ7Tem1muodhanZkTzTsGX5CGQk0OOPIieXv4aus4sUW4GzIEum\nKn3XEMyC/TJsT96qEW2ZMEH+xgIAT9Q9Hu1QFiY1J7Veq06jB+6nMbVLDj2UpXRb\n/aB4D3Krjvi4j8p1JRH9D6vSPrjwqVsPOsYoKJgtgL60oz0rxv1YfdSOVM2M0rSg\nMYxWrksotbFPKsTFk+iyxUK+kiGQEIP6lCFEv4wWFWd6MTg7Geq4607crmNDXFzJ\na/2kcY41QQczt33ZJc4tleZHE9bklscfPiaCFo9y1SNH/9WHxAqa8gMRqIxpTysx\n0W7RF5AVAgMBAAECggEAUxl6kt9uyCi9IvZ6ArcO8ys+9Lku5R71eS117gs8MRUB\nS4WDV3omt+V7doPSdu3BBOpHLf3QVpb/s7GCvvwIdDDvAKqRvRKncYl/Y1Jr4+TN\ndTaJRbkGmdr+QL19Zu3QUb95JMDpPiQXywKahbbPGLI6gZJIShFGr8apvETkdNiE\nPy1Ubh4nMIJe8DTHSWIhtfoiGkhE9WM7k3KAx3Mg9wiTe93BHZg7PBCqgq1qTRDE\nR2qKXhBH1LkqskjkHoHCig85nBnWP+qMj4Lf++Neh09Z5cLYSBS06CYs953NSRDq\nym+i/YBlGf/k8jxgC1aO7XOcSpjPlJuMC5vIxQ3jfQKBgQDvd9/vzlLVt6OmyH19\nFDrxycdUhaVnfQg7FzxaMaFN856gvXOCl9tFezWK2M1vJvMvD+9brZXgtr3GQ4N4\np69ZrobgJ+IrNC1qQb/C1zDz7Y3N7Zp+l/sMU7hptOSdPTDXVjKs6LQWRHLxQJxN\n3tJgyrxT2YIrg6jKT7JNa9HrYwKBgQC3SRqDFn7tb0hn69wPruUpsJxvo2DR1wU+\nG/DJIkmErlP+/RIBTKIrgOaZiztorFoQHSTZowlq287xTVguQ/pVgDQQWtA2qLRU\nw0yWXTPhxIN+3TFcv/Amo+61SQJJuZgdQq28NQtyB43w7Pv7tunso9btN4tuYoB0\naNDt28C8JwKBgBDlVFeHJzENE+7glnoMw1vr8LR1+YWjvMDuksOKXOczGS4eL9g2\n/rGYT97MDTKafO4FIc5GIR0Jx7oFaXFJ44VgWwPVzI9fzxSALxeAN2P+jtLIwO3N\nq1jjT0+mA7tUZe3Llye8A3jOu41qEZ0s64sIwuDnp9eKIo6jsODlipohAoGAZuud\nAJlkQu3nabuvAfuC4Ysz/RhwKMUmQ38rEba4M9I0ho4TSzl+IxGp6/ScMqX9mOjU\npYWAp0mxBh0ZdDll3Bc2pSxpmRfY03QrkI/br15LPLT2oA+Dyh7pz1ClAUM/oMat\nim7681g8o1pgETPgXaqO6Pv0xtJ3MWceU0LAEqcCgYAbkrH7gAuBj72IqfnEvynv\najPyk4rQ8+KtrP25FtfoNzTTLrJteXYpLh215xe3wkhLe12O8Uhj3FSvq7C5Ep75\nltm+lFo/bonmYbsJF7aO0NU+XttbXSXLDTenapfgGRWbXSfuciZIs6FZx8M21vQZ\nGx5cTbymoRCGBb9Sbz0xeg==\n-----END PRIVATE KEY-----\n"
CORS_ORIGIN=*
```

**URL resultante:** `https://yapepro-backend.onrender.com`

---

### **OPCIÓN 2: Railway (Recomendado) 🚂**

```bash
# 1. Instalar CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Ir a carpeta backend
cd backend

# 4. Inicializar proyecto
railway init

# 5. Agregar variables de entorno
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set SUPABASE_URL=https://tvgryyxppqllcuyxbzsq.supabase.co
railway variables set SUPABASE_ANON_KEY=tu_anon_key
railway variables set SUPABASE_SERVICE_KEY=tu_service_key
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set JWT_EXPIRES_IN=7d
railway variables set FIREBASE_PROJECT_ID=tu-proyecto-id
railway variables set FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
railway variables set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# 6. Deploy!
railway up

# 7. Obtener URL
railway open
```

**URL generada:** `https://yapepro-backend-production.up.railway.app`

---

### **OPCIÓN 2: Heroku 🟣**

```bash
# 1. Instalar Heroku CLI
# Windows: https://devcenter.heroku.com/articles/heroku-cli
# Mac: brew install heroku/brew/heroku
# Linux: curl https://cli-assets.heroku.com/install.sh | sh

# 2. Login
heroku login

# 3. Crear app
heroku create yapepro-backend

# 4. Configurar variables
heroku config:set NODE_ENV=production
heroku config:set SUPABASE_URL=https://tuproyecto.supabase.co
heroku config:set SUPABASE_ANON_KEY=tu_anon_key
heroku config:set SUPABASE_SERVICE_KEY=tu_service_key
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set JWT_EXPIRES_IN=7d
heroku config:set FIREBASE_PROJECT_ID=tu-proyecto-id
heroku config:set FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
heroku config:set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# 5. Deploy
git add .
git commit -m "Initial deploy"
git push heroku main

# 6. Abrir app
heroku open
```

**URL generada:** `https://yapepro-backend.herokuapp.com`

---

## 📋 VARIABLES DE ENTORNO COMPLETAS

### **Copiar y Pegar (reemplazar valores)**

```bash
# Node.js
NODE_ENV=production
PORT=3000

# Supabase (obtener de: Supabase Dashboard > Settings > API)
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT (generar con: openssl rand -base64 32)
JWT_SECRET=tu_secreto_super_largo_minimo_32_caracteres
JWT_EXPIRES_IN=7d

# Firebase (obtener de: Firebase Console > Project Settings > Service Accounts)
FIREBASE_PROJECT_ID=yapepro-12345
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@yapepro-12345.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# CORS (opcional)
CORS_ORIGIN=https://tu-app-flutter.com
```

---

## 🔑 CÓMO OBTENER CREDENCIALES

### **1. Supabase**

```
1. Ir a: https://supabase.com
2. Crear proyecto (gratis)
3. Dashboard > Settings > API
4. Copiar:
   - Project URL → SUPABASE_URL
   - anon/public key → SUPABASE_ANON_KEY
   - service_role key → SUPABASE_SERVICE_KEY

5. Dashboard > SQL Editor
6. Pegar y ejecutar: backend/schema.sql
```

### **2. Firebase**

```
1. Ir a: https://console.firebase.google.com
2. Crear proyecto
3. Project Settings > Service Accounts
4. Generate new private key
5. Descargar JSON
6. Extraer:
   - project_id → FIREBASE_PROJECT_ID
   - client_email → FIREBASE_CLIENT_EMAIL
   - private_key → FIREBASE_PRIVATE_KEY
```

### **3. JWT Secret**

```bash
# Generar secreto aleatorio
openssl rand -base64 32

# O usar generador online (seguro):
# https://generate-random.org/api-token-generator
```

---

## ✅ VERIFICAR DESPLIEGUE

### **1. Health Check**

```bash
curl https://tu-backend.up.railway.app/health
```

Respuesta esperada:
```json
{
  "status": "OK",
  "timestamp": "2025-10-31T12:00:00.000Z",
  "uptime": 123
}
```

### **2. Test de Login**

```bash
curl -X POST https://tu-backend.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yapepro.com",
    "password": "Admin123!"
  }'
```

Respuesta esperada:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "admin@yapepro.com",
      "role": "super_admin"
    }
  }
}
```

---

## 🐛 TROUBLESHOOTING

### **Error: "Application error"**

```bash
# Ver logs
railway logs --tail  # o heroku logs --tail

# Verificar variables de entorno
railway variables      # o heroku config
```

### **Error: "Cannot connect to Supabase"**

1. Verificar SUPABASE_URL y SUPABASE_SERVICE_KEY
2. Ir a Supabase Dashboard
3. Verificar que el proyecto esté activo
4. Verificar que las tablas existan (ejecutar schema.sql)

### **Error: "Firebase not configured"**

```bash
# Verificar que estén configuradas
railway variables | grep FIREBASE

# Si faltan, agregarlas:
railway variables set FIREBASE_PROJECT_ID=...
railway variables set FIREBASE_CLIENT_EMAIL=...
railway variables set FIREBASE_PRIVATE_KEY="..."
```

---

## 📊 MONITOREO

### **Railway**

```bash
# Ver métricas
railway status

# Ver logs en tiempo real
railway logs --tail

# Ver uso de recursos
railway usage
```

### **Heroku**

```bash
# Ver métricas
heroku ps

# Ver logs
heroku logs --tail

# Ver métricas web
heroku open --app
```

---

## 🔄 ACTUALIZAR BACKEND

```bash
# 1. Hacer cambios en código
# 2. Commit
git add .
git commit -m "Update backend"

# 3. Deploy
railway up  # o git push heroku main

# 4. Verificar
railway logs --tail
```

---

## 💰 COSTOS

### **Railway**
- Plan gratuito: 500 horas/mes
- Suficiente para desarrollo y testing
- Producción: ~$5/mes

### **Heroku**
- Hobby tier: $7/mes
- Suficiente para 500-1000 usuarios
- Profesional: $25/mes

### **Supabase**
- Plan gratuito: 500 MB DB, 2 GB bandwidth
- Suficiente para MVP
- Producción: $25/mes

### **Total MVP: $0-15/mes**

---

## 🚀 SIGUIENTE PASO

Una vez desplegado el backend, actualiza Flutter:

```dart
// lib/config/constants.dart
class AppConstants {
  static const String apiUrl = 'https://yapepro-backend.up.railway.app';
}
```

Y prueba la conexión:
```dart
final response = await ApiService.healthCheck();
print('Backend status: ${response.data['status']}');
```

---

## 📞 SOPORTE

**Railway:** https://railway.app/help  
**Heroku:** https://help.heroku.com  
**Supabase:** https://supabase.com/support  
**Firebase:** https://firebase.google.com/support

---

**Última actualización:** 31/10/2025  
**Tiempo estimado de setup:** 5-10 minutos
