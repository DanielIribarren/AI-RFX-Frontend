# 🔍 Diagnóstico de Autenticación - Guía de Uso

## Problema Actual

La página `/budget-settings` se queda en "Cargando..." indefinidamente, lo que indica que el usuario no se está cargando correctamente desde el `AuthContext`.

## Cómo Ejecutar el Diagnóstico

### Opción 1: Desde la Consola del Navegador (RECOMENDADO)

1. Abre la aplicación en el navegador
2. Abre las DevTools (F12 o Cmd+Option+I)
3. Ve a la pestaña "Console"
4. Copia y pega el siguiente código:

```javascript
// DIAGNÓSTICO RÁPIDO DE AUTENTICACIÓN
(async function() {
  console.log('🔍 INICIANDO DIAGNÓSTICO...\n')
  
  // 1. Tokens en localStorage
  const accessToken = localStorage.getItem('access_token')
  const refreshToken = localStorage.getItem('refresh_token')
  console.log('1️⃣ LocalStorage:')
  console.log('   Access Token:', accessToken ? '✅ Existe' : '❌ NO existe')
  console.log('   Refresh Token:', refreshToken ? '✅ Existe' : '❌ NO existe')
  
  // 2. Cookies
  const cookies = document.cookie
  console.log('\n2️⃣ Cookies:')
  console.log('   access_token:', cookies.includes('access_token=') ? '✅ Existe' : '❌ NO existe')
  console.log('   refresh_token:', cookies.includes('refresh_token=') ? '✅ Existe' : '❌ NO existe')
  
  // 3. Token válido?
  if (accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      const expiry = payload.exp * 1000
      const now = Date.now()
      const timeLeft = expiry - now
      
      console.log('\n3️⃣ Token Status:')
      console.log('   Expira:', new Date(expiry).toLocaleString())
      console.log('   Estado:', timeLeft > 0 ? `✅ Válido (${Math.floor(timeLeft/60000)} min)` : `❌ EXPIRADO`)
    } catch (e) {
      console.log('\n3️⃣ Token Status: ❌ Error decodificando')
    }
  }
  
  // 4. API Health
  console.log('\n4️⃣ API Backend:')
  try {
    const res = await fetch('http://localhost:5001/api/auth/health')
    console.log('   Health:', res.ok ? '✅ OK' : `⚠️ ${res.status}`)
  } catch (e) {
    console.log('   Health: ❌ NO responde')
  }
  
  // 5. GET /me
  if (accessToken) {
    console.log('\n5️⃣ Endpoint /me:')
    try {
      const res = await fetch('http://localhost:5001/api/auth/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        console.log('   Status: ✅ OK')
        console.log('   Usuario:', data.user?.email)
      } else {
        console.log('   Status: ❌ FAIL', res.status)
        console.log('   Error:', await res.text())
      }
    } catch (e) {
      console.log('   Status: ❌ Error de red')
    }
  }
  
  console.log('\n✅ DIAGNÓSTICO COMPLETO')
})()
```

5. Presiona Enter y revisa los resultados

### Opción 2: Usando el Script TypeScript

1. Abre el archivo: `scripts/diagnose-auth.ts`
2. Copia todo el contenido
3. Pégalo en la consola del navegador
4. Presiona Enter

## Interpretación de Resultados

### ✅ TODO OK
```
✅ Access Token: Existe
✅ Refresh Token: Existe
✅ Cookies: Ambas presentes
✅ Token: Válido
✅ API: Responde
✅ /me: OK
```
**Solución**: El problema NO es de autenticación. Revisar AuthContext.

### ❌ No hay tokens
```
❌ Access Token: NO existe
❌ Refresh Token: NO existe
```
**Solución**: Usuario debe hacer login nuevamente.

### ❌ Token expirado
```
✅ Access Token: Existe
❌ Token: EXPIRADO
```
**Solución**: 
1. Verificar que `refreshTokenIfNeeded()` se ejecute
2. Verificar endpoint `/refresh` del backend
3. Hacer logout y login nuevamente

### ❌ API no responde
```
❌ API Health: NO responde
```
**Solución**: 
1. Verificar que el backend esté corriendo: `http://localhost:5001`
2. Verificar variable de entorno: `NEXT_PUBLIC_AUTH_API_URL`

### ❌ Endpoint /me falla
```
✅ Token: Válido
❌ /me: FAIL 401
```
**Solución**: 
1. Verificar CORS en el backend
2. Verificar que el endpoint `/api/auth/me` existe
3. Verificar formato del token JWT

### ⚠️ Cookies faltantes
```
✅ LocalStorage: OK
❌ Cookies: NO existen
```
**Solución**: 
1. Verificar que el login guarde cookies
2. Revisar `AuthContext.tsx` líneas 84-89
3. Verificar que las cookies tengan `path=/` y `SameSite=Lax`

## Logs del AuthContext

Con los cambios implementados, ahora verás logs en la consola:

```
🔄 AuthContext: Loading user...
🔄 AuthContext: Token refresh result: true
✅ AuthContext: Token is valid, fetching user...
✅ AuthContext: User loaded: user@example.com
✅ AuthContext: Loading complete
```

Si ves:
```
❌ AuthContext: Token is expired or missing
```
→ Problema con tokens

Si ves:
```
❌ AuthContext: Failed to load user: [error]
```
→ Problema con endpoint `/me`

## Soluciones Rápidas

### 1. Limpiar todo y re-login
```javascript
localStorage.clear()
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
})
window.location.href = '/login'
```

### 2. Verificar backend
```bash
curl http://localhost:5001/api/auth/health
```

### 3. Verificar endpoint /me
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5001/api/auth/me
```

## Archivos Relevantes

- `contexts/AuthContext.tsx` - Manejo de autenticación
- `lib/authService.ts` - Servicios de API
- `middleware.ts` - Protección de rutas
- `app/(workspace)/budget-settings/page.tsx` - Página problemática

## Próximos Pasos

1. Ejecuta el diagnóstico
2. Copia los resultados
3. Identifica qué test falla
4. Aplica la solución correspondiente
5. Si persiste, revisar logs del backend
