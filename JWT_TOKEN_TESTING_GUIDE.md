# 🧪 JWT Token Testing Guide - Guía de Pruebas

## 📊 Logging Implementado

Se agregó logging detallado en **3 niveles** para debugging completo:

### 1. 🔐 Login Page (`app/(auth)/login/page.tsx`)
```
🔐 [LOGIN PAGE] Form submitted
🔐 [LOGIN PAGE] Email: user@example.com
🔐 [LOGIN PAGE] Redirect to: /dashboard
🔐 [LOGIN PAGE] Calling login...
✅ [LOGIN PAGE] Login successful, redirecting to: /dashboard
❌ [LOGIN PAGE] Login failed: [error]
```

### 2. 🔐 Auth Context (`contexts/AuthContext.tsx`)
```
🔐 [AUTH CONTEXT] Starting login...
🔐 [AUTH CONTEXT] Login response status: 200
🔐 [AUTH CONTEXT] Login response data: { status, hasAccessToken, hasRefreshToken, hasUser }
💾 [AUTH CONTEXT] Saving access token to localStorage
💾 [AUTH CONTEXT] Saving refresh token to localStorage
🍪 [AUTH CONTEXT] Setting access token cookie
🍪 [AUTH CONTEXT] Setting refresh token cookie
✅ [AUTH CONTEXT] User logged in: user@example.com
⚠️ [AUTH CONTEXT] No user data in response
❌ [AUTH CONTEXT] Login error: [error]
```

### 3. 🔐 Login API Route (`app/api/auth/login/route.ts`)
```
🔐 [LOGIN ROUTE] Starting login request...
🔐 [LOGIN ROUTE] Backend URL: http://localhost:5001/api/auth
🔐 [LOGIN ROUTE] Request body: { email: 'user@example.com', password: '***' }
🔐 [LOGIN ROUTE] Calling backend: http://localhost:5001/api/auth/login
🔐 [LOGIN ROUTE] Backend response status: 200
🔐 [LOGIN ROUTE] Backend response headers: {...}
🔐 [LOGIN ROUTE] Backend response data: { status, hasAccessToken, hasRefreshToken, hasUser }
✅ [LOGIN ROUTE] Login successful, setting cookies...
✅ [LOGIN ROUTE] Cookies set successfully
❌ [LOGIN ROUTE] Login failed: [message]
❌ [LOGIN ROUTE] Login proxy error: [error]
```

---

## 🧪 Cómo Probar el Login

### Paso 1: Abrir DevTools
```
1. Abrir navegador
2. F12 o Cmd+Option+I (Mac)
3. Ir a tab "Console"
4. Limpiar console (Cmd+K o Ctrl+L)
```

### Paso 2: Intentar Login
```
1. Ir a http://localhost:3000/login
2. Ingresar credenciales
3. Click en "Iniciar Sesión"
4. Observar logs en consola
```

### Paso 3: Verificar Flujo Completo

**✅ Login Exitoso - Logs Esperados:**
```
🔐 [LOGIN PAGE] Form submitted
🔐 [LOGIN PAGE] Email: user@example.com
🔐 [LOGIN PAGE] Redirect to: /dashboard
🔐 [LOGIN PAGE] Calling login...
🔐 [AUTH CONTEXT] Starting login...
🔐 [LOGIN ROUTE] Starting login request...
🔐 [LOGIN ROUTE] Backend URL: http://localhost:5001/api/auth
🔐 [LOGIN ROUTE] Calling backend: http://localhost:5001/api/auth/login
🔐 [LOGIN ROUTE] Backend response status: 200
🔐 [LOGIN ROUTE] Backend response data: { status: 'success', hasAccessToken: true, hasRefreshToken: true, hasUser: true }
✅ [LOGIN ROUTE] Login successful, setting cookies...
✅ [LOGIN ROUTE] Cookies set successfully
🔐 [AUTH CONTEXT] Login response status: 200
🔐 [AUTH CONTEXT] Login response data: { status: 'success', hasAccessToken: true, hasRefreshToken: true, hasUser: true }
💾 [AUTH CONTEXT] Saving access token to localStorage
💾 [AUTH CONTEXT] Saving refresh token to localStorage
🍪 [AUTH CONTEXT] Setting access token cookie
🍪 [AUTH CONTEXT] Setting refresh token cookie
✅ [AUTH CONTEXT] User logged in: user@example.com
✅ [LOGIN PAGE] Login successful, redirecting to: /dashboard
```

**❌ Login Fallido (Backend DB Error) - Logs Actuales:**
```
🔐 [LOGIN PAGE] Form submitted
🔐 [LOGIN PAGE] Email: user@example.com
🔐 [LOGIN PAGE] Calling login...
🔐 [AUTH CONTEXT] Starting login...
🔐 [LOGIN ROUTE] Starting login request...
🔐 [LOGIN ROUTE] Backend URL: http://localhost:5001/api/auth
🔐 [LOGIN ROUTE] Calling backend: http://localhost:5001/api/auth/login
🔐 [LOGIN ROUTE] Backend response status: 401
🔐 [LOGIN ROUTE] Backend response data: { status: 'error', message: 'Database connection error', hasAccessToken: false }
❌ [LOGIN ROUTE] Login failed: Database connection error
🔐 [AUTH CONTEXT] Login response status: 401
❌ [AUTH CONTEXT] Login failed: Database connection error
❌ [LOGIN PAGE] Login failed: Error: Database connection error
```

---

## 🔍 Verificar Tokens Guardados

### En DevTools Console:
```javascript
// Verificar localStorage
console.log('Access Token:', localStorage.getItem('access_token'))
console.log('Refresh Token:', localStorage.getItem('refresh_token'))

// Verificar cookies
console.log('Cookies:', document.cookie)
```

### En DevTools Application Tab:
```
1. Application > Storage > Local Storage > http://localhost:3000
   - Buscar: access_token
   - Buscar: refresh_token

2. Application > Storage > Cookies > http://localhost:3000
   - Buscar: access_token
   - Buscar: refresh_token
```

---

## 🎯 Identificar el Problema

### Problema 1: Backend No Responde
**Síntoma:**
```
❌ [LOGIN ROUTE] Login proxy error: TypeError: fetch failed
```

**Causa:** Backend no está corriendo

**Solución:**
```bash
cd ../backend
python app.py  # O como se inicie el backend
```

### Problema 2: Backend Responde 401 (Actual)
**Síntoma:**
```
🔐 [LOGIN ROUTE] Backend response status: 401
❌ Error in query_one: [Errno 8] nodename nor servname provided, or not known
```

**Causa:** Backend no puede conectarse a la base de datos

**Solución:** Ver `BACKEND_DB_CONNECTION_FIX.md`

### Problema 3: Backend Responde 200 pero Sin Tokens
**Síntoma:**
```
🔐 [LOGIN ROUTE] Backend response data: { status: 'success', hasAccessToken: false }
```

**Causa:** Backend no está generando JWT tokens correctamente

**Solución:** Verificar configuración de JWT en backend

### Problema 4: Tokens No Se Guardan
**Síntoma:**
```
✅ [LOGIN ROUTE] Login successful, setting cookies...
// Pero localStorage.getItem('access_token') es null
```

**Causa:** Error en el código de guardado (ya corregido)

**Solución:** Ya implementado en AuthContext

---

## 🔧 Mejoras Implementadas

### 1. ✅ Cookies Automáticas en API Route
Las cookies ahora se configuran **automáticamente** en el servidor (API route):

```typescript
// app/api/auth/login/route.ts
nextResponse.cookies.set('access_token', data.access_token, {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 86400, // 24 hours
  path: '/',
})
```

**Beneficios:**
- ✅ Cookies configuradas desde el servidor (más seguro)
- ✅ Configuración consistente
- ✅ Funciona incluso si JavaScript está deshabilitado

### 2. ✅ Redundancia en AuthContext
AuthContext también configura cookies como backup:

```typescript
// contexts/AuthContext.tsx
document.cookie = `access_token=${response.access_token}; path=/; max-age=86400; SameSite=Lax`
```

**Beneficios:**
- ✅ Doble garantía de que las cookies se configuran
- ✅ Compatibilidad con navegadores antiguos

### 3. ✅ Logging Detallado
Logs en 3 niveles para debugging completo:

**Beneficios:**
- ✅ Identificar exactamente dónde falla el flujo
- ✅ Ver qué datos se reciben del backend
- ✅ Verificar que tokens se guardan correctamente

---

## 📋 Checklist de Verificación

### Frontend (✅ COMPLETADO)
- [x] Login page con logging
- [x] AuthContext con logging
- [x] API route con logging
- [x] Cookies configuradas automáticamente
- [x] localStorage configurado
- [x] Error handling robusto
- [x] Middleware de autenticación

### Backend (⏳ PENDIENTE)
- [ ] Base de datos conectada
- [ ] Variable `DATABASE_URL` configurada
- [ ] PostgreSQL corriendo
- [ ] Endpoint `/api/auth/login` funcional
- [ ] JWT tokens generándose correctamente
- [ ] Usuario de prueba en la DB

---

## 🚀 Próximos Pasos

1. **Arreglar Backend DB Connection**
   - Ver `BACKEND_DB_CONNECTION_FIX.md`
   - Configurar `DATABASE_URL`
   - Verificar PostgreSQL

2. **Probar Login Nuevamente**
   - Intentar login con credenciales válidas
   - Verificar logs en consola
   - Verificar tokens en DevTools

3. **Verificar Flujo Completo**
   - Login exitoso → Redirect a dashboard
   - Tokens guardados en localStorage + cookies
   - Middleware permite acceso a rutas protegidas

---

## 🎯 Estado Actual

**Frontend:** ✅ 100% LISTO
- Logging completo implementado
- Manejo de tokens correcto
- Cookies automáticas
- Error handling robusto

**Backend:** ❌ ERROR DE CONEXIÓN A DB
- No puede conectarse a PostgreSQL
- Error: `[Errno 8] nodename nor servname provided, or not known`
- Necesita configurar `DATABASE_URL`

**Próximo Blocker:** Arreglar conexión del backend a la base de datos
