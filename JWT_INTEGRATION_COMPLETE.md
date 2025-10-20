# ✅ Integración JWT Completada

## Fecha: 2025-10-17

## 🎯 Problema Resuelto

**El frontend NO estaba enviando el token JWT** en los requests al backend, causando que:
- El backend no pudiera identificar al usuario autenticado
- Los RFX no se asociaran correctamente con el `user_id`
- El branding no se cargara correctamente (necesita `company_id` del usuario)

## 🔧 Solución Implementada

### 1. **Función Helper `getAuthHeaders()`**
**Archivo**: `lib/api.ts` (líneas 4-16)

```typescript
function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}
```

**Funcionalidad**:
- Obtiene el token de `localStorage`
- Agrega automáticamente el header `Authorization: Bearer <token>`
- Maneja SSR (verifica `window !== 'undefined'`)

### 2. **Función `fetchWithAuth()`**
**Archivo**: `lib/api.ts` (líneas 18-82)

```typescript
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // 1. Agrega headers de autenticación automáticamente
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };
  
  let response = await fetch(url, {
    ...options,
    headers,
  });
  
  // 2. Maneja token expirado (401)
  if (response.status === 401) {
    // Intenta refresh automático
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (refreshToken) {
      // Refresh token
      const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      
      if (refreshResponse.ok) {
        // Guarda nuevo token
        const data = await refreshResponse.json();
        localStorage.setItem('access_token', data.access_token);
        
        // Reintenta request original
        return fetch(url, { ...options, headers: getAuthHeaders() });
      }
    }
    
    // Si falla, redirect a login
    localStorage.clear();
    window.location.href = '/login';
  }
  
  return response;
}
```

**Funcionalidad**:
- ✅ Inyecta token JWT automáticamente
- ✅ Detecta token expirado (401)
- ✅ Intenta refresh automático
- ✅ Reintenta request con nuevo token
- ✅ Redirect a login si falla todo

### 3. **Actualización de Todas las Funciones API**

**Funciones actualizadas** (todas ahora usan `fetchWithAuth`):
- ✅ `generateProposal()` - Genera propuestas con user_id
- ✅ `getRFXHistory()` - Historial del usuario autenticado
- ✅ `getLatestRFX()` - Últimos RFX del usuario
- ✅ `loadMoreRFX()` - Paginación con autenticación
- ✅ `getRecentRFX()` - RFX recientes del usuario
- ✅ `getRFXById()` - Obtiene RFX específico
- ✅ `finalizeRFX()` - Finaliza RFX
- ✅ `updateRFXCurrency()` - Actualiza moneda
- ✅ `getProposalById()` - Obtiene propuesta
- ✅ `getProposalsByRFX()` - Propuestas de un RFX
- ✅ `updateProductCosts()` - Actualiza costos
- ✅ `updateRFXField()` - Actualiza campos
- ✅ `updateProductField()` - Actualiza productos

## 📊 Antes vs Después

### ❌ ANTES
```typescript
// Sin token JWT
const response = await fetch(`${API_BASE_URL}/api/proposals/generate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // ❌ FALTA Authorization header
  },
  body: JSON.stringify(data),
});
```

**Resultado en Backend**:
```
🔍 Attempting to get user_id from RFX: b11b67b7...
❌ No user_id available from any source
```

### ✅ DESPUÉS
```typescript
// Con token JWT automático
const response = await fetchWithAuth(`${API_BASE_URL}/api/proposals/generate`, {
  method: 'POST',
  body: JSON.stringify(data),
});
```

**Resultado en Backend**:
```
✅ Authenticated user generating proposal: iriyidan@gmail.com (ID: 186ea35f...)
🎯 Final user_id for proposal generation: 186ea35f...
✅ Generating proposal for user: 186ea35f...
```

## 🔍 Verificación

### 1. **Verificar Token en DevTools**

Abre DevTools (F12) → Network tab → Selecciona cualquier request → Headers:

```
Request Headers:
  Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
  Content-Type: application/json
```

### 2. **Verificar en Consola del Navegador**

```javascript
// Ver token guardado
console.log('Token:', localStorage.getItem('access_token'));

// Ver user
console.log('User:', JSON.parse(localStorage.getItem('user')));
```

### 3. **Logs Esperados en Backend**

```
✅ Authenticated user: iriyidan@gmail.com (ID: 186ea35f-3cf8-480f-a7d3-0af178c09498)
🎯 Final user_id: 186ea35f-3cf8-480f-a7d3-0af178c09498
```

## 🚀 Impacto en Funcionalidades

### ✅ Branding
- Ahora el backend puede identificar el `company_id` del usuario
- Las URLs de logo/template se generan correctamente
- El endpoint `/api/branding/files/{companyId}/{fileType}` funciona

### ✅ Propuestas
- Se asocian automáticamente al usuario autenticado
- El `user_id` se guarda en la base de datos
- Historial de propuestas por usuario

### ✅ RFX
- Cada RFX se asocia al usuario que lo creó
- Filtrado automático por usuario en historial
- Seguridad: usuarios solo ven sus propios RFX

## 📝 Notas Importantes

### Sistema de Autenticación Dual

El proyecto tiene **DOS sistemas de autenticación**:

1. **`lib/authService.ts`** (Axios con interceptores) ✅
   - Usado para endpoints de autenticación (`/api/auth/*`)
   - Tiene interceptores configurados correctamente
   - Maneja refresh token automáticamente

2. **`lib/api.ts`** (Fetch nativo) ✅ AHORA CORREGIDO
   - Usado para endpoints de negocio (`/api/rfx/*`, `/api/proposals/*`)
   - **ANTES**: No enviaba token
   - **AHORA**: Usa `fetchWithAuth()` con token automático

### Compatibilidad con SSR

La función `getAuthHeaders()` verifica `typeof window !== 'undefined'` para evitar errores en Server-Side Rendering de Next.js.

## 🔄 Flujo Completo

```
1. Usuario hace login
   ↓
2. authService guarda token en localStorage
   ↓
3. Usuario genera propuesta
   ↓
4. api.generateProposal() llama fetchWithAuth()
   ↓
5. fetchWithAuth() agrega header: Authorization: Bearer <token>
   ↓
6. Backend recibe token y extrae user_id
   ↓
7. Backend asocia propuesta con user_id
   ↓
8. Si token expira (401):
   ↓
9. fetchWithAuth() intenta refresh automático
   ↓
10. Si refresh exitoso: reintenta request
11. Si refresh falla: redirect a /login
```

## ✅ Checklist de Implementación

- [x] Crear función `getAuthHeaders()`
- [x] Crear función `fetchWithAuth()`
- [x] Actualizar `generateProposal()`
- [x] Actualizar `getRFXHistory()`
- [x] Actualizar `getLatestRFX()`
- [x] Actualizar `loadMoreRFX()`
- [x] Actualizar `getRecentRFX()`
- [x] Actualizar `getRFXById()`
- [x] Actualizar `finalizeRFX()`
- [x] Actualizar `updateRFXCurrency()`
- [x] Actualizar `getProposalById()`
- [x] Actualizar `getProposalsByRFX()`
- [x] Actualizar `updateProductCosts()`
- [x] Actualizar `updateRFXField()`
- [x] Actualizar `updateProductField()`
- [x] Manejo de token expirado
- [x] Refresh token automático
- [x] Redirect a login en caso de fallo

## 🎉 Resultado

**El frontend ahora envía correctamente el token JWT en TODOS los requests**, permitiendo que el backend identifique al usuario autenticado y asocie correctamente los datos con el `user_id`.

Esto resuelve:
- ✅ Problema de branding (company_id)
- ✅ Problema de propuestas (user_id)
- ✅ Problema de historial (filtrado por usuario)
- ✅ Seguridad (usuarios solo ven sus datos)
