# 🚀 Configuración de Variables de Entorno en Vercel

## 📋 Variables Requeridas

Ve a: **Vercel Dashboard → Tu Proyecto → Settings → Environment Variables**

Agrega las siguientes **4 variables**:

### 1. Variables Client-Side (con prefijo NEXT_PUBLIC_)

Estas variables son accesibles en el navegador del usuario:

```
Name: NEXT_PUBLIC_API_URL
Value: https://recharge-api.akeela.co
Environment: Production
```

```
Name: NEXT_PUBLIC_AUTH_API_URL
Value: https://recharge-api.akeela.co/api/auth
Environment: Production
```

### 2. Variables Server-Side (sin prefijo NEXT_PUBLIC_)

Estas variables SOLO son accesibles en API Routes (server-side):

```
Name: API_URL
Value: https://recharge-api.akeela.co
Environment: Production
```

```
Name: AUTH_API_URL
Value: https://recharge-api.akeela.co/api/auth
Environment: Production
```

---

## 🧠 ¿Por Qué Necesitamos Ambas?

### Variables NEXT_PUBLIC_* (Client-Side)
- Se usan en componentes React que corren en el navegador
- Ejemplos: `lib/api.ts`, `lib/authService.ts`, `components/rfx-results-wrapper-v2.tsx`
- El navegador del usuario hace fetch directamente al backend

### Variables SIN NEXT_PUBLIC_* (Server-Side)
- Se usan en API Routes (`app/api/**/*.ts`)
- Estas rutas corren en el servidor de Vercel
- El servidor de Vercel hace fetch al backend de Flask

---

## ✅ Después de Configurar

1. **Redeploy** tu aplicación en Vercel:
   ```bash
   git add .
   git commit -m "Fix environment variables for production"
   git push
   ```

2. **Verifica** que las variables estén configuradas:
   - Ve a Vercel Dashboard → Settings → Environment Variables
   - Deberías ver las 4 variables listadas

3. **Prueba** el login/signup en producción

---

## 🔍 Debugging

Si sigues teniendo problemas, verifica en los logs de Vercel:
- Ve a: **Vercel Dashboard → Deployments → [Tu Deploy] → Functions**
- Busca errores de conexión a localhost (significa que las variables no se cargaron)

---

## 📝 Desarrollo Local

Tu archivo `.env.local` ya está configurado correctamente con:
```
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_AUTH_API_URL=http://localhost:5001/api/auth
API_URL=http://localhost:5001
AUTH_API_URL=http://localhost:5001/api/auth
```

**Recuerda reiniciar el servidor** después de cambiar `.env.local`:
```bash
# Ctrl+C y luego:
npm run dev
```
