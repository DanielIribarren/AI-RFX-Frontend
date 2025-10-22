# 🔧 Fix: Login/Signup Redirect en Producción

## 🎯 Problema Identificado

Después del login o signup en producción (Vercel), el usuario no era redirigido al dashboard.

### Causa Raíz

El `AuthContext` estaba usando `authService` directamente, que hace llamadas desde el **navegador del cliente** al backend de Flask usando `NEXT_PUBLIC_AUTH_API_URL`.

En producción, el navegador intentaba conectarse a `localhost:5001` (el fallback), lo cual obviamente falla porque localhost en el navegador del usuario no es el servidor de Flask.

## ✅ Solución Implementada

Modificamos `contexts/AuthContext.tsx` para que las funciones `login` y `signup` usen las **API Routes de Next.js** en lugar de llamar directamente al backend:

### Antes (❌ Problemático):
```typescript
const login = async (email: string, password: string) => {
  const response = await authService.login(email, password)
  // authService hace fetch directo a NEXT_PUBLIC_AUTH_API_URL
  // En producción, el navegador intenta conectarse a localhost:5001
}
```

### Después (✅ Correcto):
```typescript
const login = async (email: string, password: string) => {
  // Llama a la API Route de Next.js
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  
  const response = await res.json()
  
  // Guarda tokens en localStorage
  if (response.access_token) {
    localStorage.setItem('access_token', response.access_token)
  }
  if (response.refresh_token) {
    localStorage.setItem('refresh_token', response.refresh_token)
  }
  
  if (response.user) {
    setUser(response.user)
  }
}
```

## 🔄 Flujo Correcto Ahora

### Login/Signup en Producción:

1. **Cliente (Navegador)** → Llama a `/api/auth/login` (API Route de Next.js)
2. **Servidor de Vercel** → Recibe la petición en `app/api/auth/login/route.ts`
3. **Servidor de Vercel** → Hace fetch a `https://recharge-api.akeela.co/api/auth/login` (usando `AUTH_API_URL`)
4. **Backend Flask** → Procesa login y devuelve tokens + user
5. **Servidor de Vercel** → Devuelve respuesta al cliente
6. **Cliente** → Guarda tokens en localStorage y actualiza estado del usuario
7. **Cliente** → Redirige a `/dashboard` ✅

## 📋 Archivos Modificados

- ✅ `contexts/AuthContext.tsx` - Funciones `login` y `signup` ahora usan API Routes

## 🧪 Cómo Probar

### En Local:
```bash
npm run dev
# Prueba login/signup en http://localhost:3000
```

### En Producción:
1. Haz push de los cambios
2. Espera el deploy en Vercel
3. Prueba login/signup en tu dominio de producción
4. Verifica que después del login te redirija a `/dashboard`

## 🔍 Debugging

Si sigue sin funcionar, verifica:

1. **Tokens se guardan correctamente:**
   - Abre DevTools → Application → Local Storage
   - Deberías ver `access_token` y `refresh_token`

2. **Variables de entorno en Vercel:**
   - `AUTH_API_URL=https://recharge-api.akeela.co/api/auth`
   - `API_URL=https://recharge-api.akeela.co`

3. **Logs de Vercel:**
   - Ve a Vercel Dashboard → Functions
   - Busca errores en las funciones `/api/auth/login` y `/api/auth/signup`

## 📝 Notas Adicionales

- El `authService` todavía se usa para otras funciones como `getCurrentUser()`, `updateProfile()`, etc.
- Estas funciones usan axios con interceptores que automáticamente agregan el token de autorización
- El token refresh sigue funcionando con el sistema de interceptores de axios
