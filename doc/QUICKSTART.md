# 🚀 INICIO RÁPIDO - Yape Pro Backend

## ⚡ 3 Pasos para Empezar

### 1️⃣ Configurar Supabase (5 minutos)

```
1. Ir a: https://supabase.com
2. Crear cuenta y proyecto
3. Ir a Settings → API
4. Copiar: Project URL y service_role key
5. Ir a SQL Editor
6. Pegar contenido de schema.sql y ejecutar
```

### 2️⃣ Configurar .env (2 minutos)

Editar archivo `.env` con tus datos de Supabase:

```env
SUPABASE_URL=https://tuproyecto.supabase.co
SUPABASE_SERVICE_KEY=tu_service_role_key_aqui
JWT_SECRET=genera_un_string_aleatorio_de_32_caracteres_minimo
```

### 3️⃣ Ejecutar (1 minuto)

```bash
npm run dev
```

**¡Listo!** El servidor estará en: `http://localhost:3001`

---

## 🧪 Probar Rápido

### Test 1: Health Check
```bash
curl http://localhost:3001/health
```

### Test 2: Registro
```powershell
curl -X POST http://localhost:3001/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@test.com\",\"password\":\"Test123!\",\"full_name\":\"Usuario Test\",\"role\":\"owner\"}'
```

### Test 3: Login
```powershell
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@test.com\",\"password\":\"Test123!\"}'
```

**Copia el `token` de la respuesta para las siguientes peticiones**

---

## 📱 Conectar con Flutter

En tu app Flutter, configura la URL base:

```dart
class ApiConfig {
  static const String baseUrl = 'http://localhost:3001/api';
  // Producción: 'https://tu-dominio.com/api'
}
```

Ejemplo de login:

```dart
Future<Map<String, dynamic>> login(String email, String password) async {
  final response = await http.post(
    Uri.parse('${ApiConfig.baseUrl}/auth/login'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'email': email,
      'password': password,
    }),
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    final token = data['data']['token'];
    // Guardar token para futuras peticiones
    return data;
  } else {
    throw Exception('Error en login');
  }
}
```

---

## 📚 Más Información

- **README.md** - Documentación completa
- **TESTING_GUIDE.md** - Guía de pruebas detallada
- **PROJECT_STATUS.md** - Estado del proyecto

---

## 🔥 Firebase (Opcional)

Si quieres notificaciones push:

1. Ir a: https://console.firebase.google.com/
2. Crear proyecto
3. Project Settings → Service Accounts
4. Generate new private key
5. Copiar credenciales a `.env`:

```env
FIREBASE_PROJECT_ID=tu-proyecto
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## 🐛 Problemas Comunes

**Puerto ocupado?**
→ Cambiar `PORT=3002` en `.env`

**Error de Supabase?**
→ Verificar credenciales en `.env`

**Token inválido?**
→ Usar formato: `Authorization: Bearer TOKEN`

---

## 🎯 Endpoints Principales

```
POST   /api/auth/register      - Registro
POST   /api/auth/login         - Login
GET    /api/auth/me            - Perfil (requiere auth)

GET    /api/stores             - Listar tiendas
POST   /api/stores             - Crear tienda (owner)
GET    /api/stores/:id/stats   - Estadísticas

GET    /api/workers?store_id=  - Listar trabajadores
POST   /api/workers            - Agregar trabajador (owner)

GET    /api/notifications?store_id=  - Listar notificaciones
POST   /api/notifications            - Crear notificación (owner)
POST   /api/notifications/parse      - Parsear texto
```

---

**¡Todo listo para empezar! 🚀**

Si tienes dudas, revisa los archivos de documentación.
