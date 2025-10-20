# Fix: Sesión se pierde al refrescar la página

## Problema Identificado

Cada vez que se refrescaba la página, el usuario era redirigido al login a pesar de tener una sesión activa con un token de 7 días de duración.

### Causas Raíz

1. **Validación de token inadecuada**: El método `isAuthenticated()` solo verificaba la existencia del token en localStorage, sin validar su expiración.

2. **Logout agresivo en errores**: El `AuthContext` hacía logout automático cuando fallaba la carga del usuario, incluso en errores temporales de red.

3. **Interceptor de respuesta problemático**: El interceptor de axios hacía logout inmediato en cualquier error 401, sin distinguir entre token expirado y otros errores.

4. **Sin refresh proactivo**: No había un mecanismo para refrescar el token antes de que expirara.

## Solución Implementada

### 1. Validación de Expiración de Token (`lib/authService.ts`)

```typescript
// Nueva función helper para decodificar JWT y verificar expiración
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expirationTime = payload.exp * 1000
    const currentTime = Date.now()
    // Buffer de 5 minutos antes de la expiración real
    return currentTime >= (expirationTime - 5 * 60 * 1000)
  } catch (error) {
    console.error('Error decoding token:', error)
    return true
  }
}
```

### 2. Método `isAuthenticated()` Mejorado

```typescript
isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  const token = localStorage.getItem('access_token')
  if (!token) return false
  
  // Verificar si el token está expirado
  if (isTokenExpired(token)) {
    console.log('Access token is expired or about to expire')
    return false
  }
  
  return true
}
```

### 3. Interceptor de Respuesta Mejorado

**Características:**
- **Queue de requests**: Evita múltiples llamadas simultáneas al endpoint de refresh
- **Retry automático**: Reintenta requests fallidos después de refrescar el token
- **No logout en errores temporales**: Solo hace logout cuando el refresh token realmente falla
- **Previene loops de redirección**: Verifica que no estemos ya en la página de login

```typescript
let isRefreshing = false
let failedQueue: Array<{ resolve, reject }> = []

// Procesa la cola de requests pendientes
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}
```

### 4. Refresh Proactivo de Token

```typescript
async refreshTokenIfNeeded(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  
  const token = localStorage.getItem('access_token')
  const refreshToken = localStorage.getItem('refresh_token')
  
  if (!token || !refreshToken) return false
  
  // Verificar si el token está expirado o por expirar
  if (isTokenExpired(token)) {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/refresh`, {
        refresh_token: refreshToken,
      })
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token)
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token)
        }
        return true
      }
    } catch (error) {
      console.error('Failed to refresh token:', error)
      return false
    }
  }
  
  return true // Token todavía válido
}
```

### 5. AuthContext Mejorado (`contexts/AuthContext.tsx`)

**Cambios:**
- Llama a `refreshTokenIfNeeded()` antes de cargar el usuario
- No hace logout en errores de carga de usuario
- Implementa refresh periódico cada 5 minutos
- Mejor manejo de estados de carga

```typescript
const loadUser = async () => {
  // Primero, intentar refrescar el token si es necesario
  const tokenRefreshed = await authService.refreshTokenIfNeeded()
  
  if (tokenRefreshed && authService.isAuthenticated()) {
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Failed to load user:', error)
      // No hacer logout inmediato - el interceptor manejará el refresh
      setUser(null)
    }
  } else {
    setUser(null)
  }
  setLoading(false)
}

useEffect(() => {
  loadUser()
  
  // Configurar verificación periódica de refresh (cada 5 minutos)
  const refreshInterval = setInterval(async () => {
    if (authService.isAuthenticated()) {
      await authService.refreshTokenIfNeeded()
    }
  }, 5 * 60 * 1000)
  
  return () => clearInterval(refreshInterval)
}, [])
```

### 6. Nuevo Método `clearTokens()`

Separado del método `logout()` para permitir limpiar tokens sin redirigir:

```typescript
clearTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }
}
```

## Beneficios

1. ✅ **Sesión persistente**: Los usuarios mantienen su sesión activa durante los 7 días completos
2. ✅ **Refresh automático**: Los tokens se refrescan automáticamente antes de expirar
3. ✅ **Mejor UX**: No más redirecciones inesperadas al login
4. ✅ **Manejo robusto de errores**: Distingue entre errores temporales y tokens realmente inválidos
5. ✅ **Performance mejorada**: Queue de requests evita llamadas duplicadas al endpoint de refresh
6. ✅ **Logging mejorado**: Mejor visibilidad de problemas de autenticación

## Testing

Para probar la solución:

1. **Login normal**: Iniciar sesión y verificar que funciona
2. **Refresh de página**: Refrescar la página múltiples veces - debe mantener la sesión
3. **Esperar 5 minutos**: Verificar que el token se refresca automáticamente
4. **Cerrar y reabrir navegador**: La sesión debe persistir
5. **Token expirado**: Después de 7 días, debe redirigir correctamente al login

## Notas Técnicas

- El buffer de 5 minutos antes de la expiración asegura que el token se refresque antes de que expire realmente
- El intervalo de 5 minutos para el refresh periódico es configurable
- El sistema es resiliente a errores de red temporales
- Compatible con SSR de Next.js (verifica `typeof window !== 'undefined'`)

## Archivos Modificados

- `lib/authService.ts`: Lógica principal de autenticación
- `contexts/AuthContext.tsx`: Context provider de autenticación
- `app/(workspace)/budget-settings/page.tsx`: Ya tenía protección correcta

## Compatibilidad

- ✅ Next.js 14+
- ✅ React 18+
- ✅ TypeScript
- ✅ SSR/SSG compatible
