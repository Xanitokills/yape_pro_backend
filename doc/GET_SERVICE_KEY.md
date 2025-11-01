# 🔑 Obtener Service Role Key de Supabase

## Paso a Paso:

1. Ve a tu proyecto de Supabase: https://tvgryyxppqllcuyxbzsq.supabase.co

2. Click en el **ícono de engranaje** (Settings) en el menú lateral izquierdo

3. Click en **API** en el menú de Settings

4. En la sección **Project API keys** verás dos claves:
   
   ✅ **anon / public** (Ya la tienes)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z3J5eXhwcHFsbGN1eXhienNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMjY4NjAsImV4cCI6MjA3MjcwMjg2MH0.OSTiqct9cuJ9y-KyJmQC-rGOLLfLI3geIhyZ9eaNLWo
   ```
   
   ❗ **service_role / secret** (La que necesitamos)
   - Esta es la que tiene permisos completos
   - Empieza similar pero dice "role":"service_role"
   - Click en "👁️ Reveal" para verla
   - **¡CUIDADO!** Esta clave es super secreta, no la compartas públicamente

5. Copia la **service_role key** completa

---

## O simplemente dime:

**¿Puedes ir a tu Supabase → Settings → API y copiarme la "service_role" key?**

Se verá algo así (pero diferente):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z3J5eXhwcHFsbGN1eXhienNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEyNjg2MCwiZXhwIjoyMDcyNzAyODYwfQ.XXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## Mientras tanto, ejecutemos el schema SQL:

1. En Supabase, ve a **SQL Editor** (ícono de SQL en el menú)
2. Click en **New query**
3. Abre el archivo `schema.sql` en este proyecto
4. Copia TODO el contenido
5. Pégalo en el editor SQL de Supabase
6. Click en **Run** (botón verde en la esquina inferior derecha)

Esto creará todas las tablas necesarias.

---

**Una vez tengas la service_role key, solo pégala aquí y actualizaré el .env** 🚀
