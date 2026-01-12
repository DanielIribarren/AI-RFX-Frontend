# 🔐 Solución: Error 401 Unauthorized en Endpoints de Organización

## 📋 Diagnóstico del Problema

**Error:** `401 Unauthorized` al llamar `/api/organization/current`

**Causa Raíz:** Las páginas de Server Components de Next.js no pueden acceder directamente a `localStorage`, solo a cookies.

---

## ✅ Solución Implementada

### **1. Actualización de `getAuthHeaders()` en API Services**

He actualizado tanto `lib/api-organizations.ts` como `lib/api-credits.ts` para soportar **ambos entornos**:

```typescript
function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Client-side: use localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } 
  // Server-side: use cookies (Next.js Server Components)
  else {
    try {
      const { cookies } = require('next/headers');
      const cookieStore = cookies();
      const token = cookieStore.get('access_token')?.value;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from cookies:', error);
    }
  }
  
  return headers;
}
```

### **2. Verificación de Cookies en AuthContext**

El `AuthContext.tsx` **YA está guardando el token en cookies** correctamente:

```typescript
// Líneas 98-103 de AuthContext.tsx
if (response.access_token) {
  document.cookie = `access_token=${response.access_token}; path=/; max-age=86400; SameSite=Lax`
}
if (response.refresh_token) {
  document.cookie = `refresh_token=${response.refresh_token}; path=/; max-age=604800; SameSite=Lax`
}
```

---

## 🧪 Cómo Verificar que Funciona

### **Paso 1: Login**
```bash
# Hacer login en la aplicación
# URL: http://localhost:3000/login
# Email: iriyidan@gmail.com
# Password: tu-password
```

### **Paso 2: Verificar Cookies en DevTools**
1. Abrir DevTools (F12)
2. Ir a **Application** → **Cookies** → `http://localhost:3000`
3. Verificar que existan:
   - `access_token` (válido por 24 horas)
   - `refresh_token` (válido por 7 días)

### **Paso 3: Verificar Token en Network**
1. Navegar a `/settings/organization/general`
2. Abrir **Network** tab en DevTools
3. Buscar la petición a `/api/organization/current`
4. Verificar que el header `Authorization: Bearer <token>` esté presente

### **Paso 4: Verificar en Backend**
```bash
# Ver logs del backend
# Debe mostrar: "GET /api/organization/current 200 OK"
# NO debe mostrar: "401 Unauthorized"
```

---

## 🔍 Debugging: Si Aún Falla

### **Problema 1: Cookie no se está creando**

**Verificar:**
```javascript
// En DevTools Console
document.cookie
// Debe mostrar: "access_token=eyJ..."
```

**Solución:**
- Asegurarse de hacer login correctamente
- Verificar que el backend retorne `access_token` en la respuesta
- Verificar que no haya errores en la consola durante el login

### **Problema 2: Cookie existe pero no se envía**

**Verificar:**
```javascript
// En Server Component (page.tsx)
import { cookies } from 'next/headers';

const cookieStore = cookies();
const token = cookieStore.get('access_token');
console.log('Token from cookies:', token?.value);
```

**Solución:**
- Verificar que la cookie tenga `path=/` (ya configurado)
- Verificar que `SameSite=Lax` esté configurado (ya configurado)
- Verificar que no haya expirado (`max-age=86400` = 24 horas)

### **Problema 3: Backend rechaza el token**

**Verificar en Backend:**
```python
# En el endpoint de organization
@organization_bp.route('/current', methods=['GET'])
@jwt_required()
def get_current_organization():
    current_user_id = get_jwt_identity()
    print(f"User ID from token: {current_user_id}")
    # ...
```

**Posibles causas:**
- Token expirado (verificar `exp` en el JWT)
- Token inválido (verificar firma)
- Usuario no existe en BD
- Usuario no tiene `organization_id`

---

## 📝 Checklist de Verificación

- [x] `AuthContext.tsx` guarda token en localStorage ✅
- [x] `AuthContext.tsx` guarda token en cookies ✅
- [x] `api-organizations.ts` lee token de cookies en server ✅
- [x] `api-credits.ts` lee token de cookies en server ✅
- [ ] **Login exitoso y cookies creadas** (verificar en DevTools)
- [ ] **Token válido y no expirado** (verificar en jwt.io)
- [ ] **Backend acepta el token** (verificar logs)
- [ ] **Usuario tiene organization_id** (verificar en BD)

---

## 🚀 Siguiente Paso

1. **Hacer login** en la aplicación
2. **Verificar cookies** en DevTools
3. **Navegar** a `/settings/organization/general`
4. **Verificar** que los datos se carguen correctamente

Si sigue fallando, revisar:
- Logs del backend para ver el error específico
- Valor del token en las cookies
- Si el usuario tiene `organization_id` en la base de datos

---

## 💡 Notas Importantes

### **Server Components vs Client Components**

- **Server Components** (páginas con `async function`):
  - Se ejecutan en el servidor
  - NO tienen acceso a `window` o `localStorage`
  - Usan `cookies()` de `next/headers`
  - Ejemplo: `/settings/organization/general/page.tsx`

- **Client Components** (con `'use client'`):
  - Se ejecutan en el navegador
  - Tienen acceso a `window` y `localStorage`
  - Usan `document.cookie` o `localStorage`
  - Ejemplo: `contexts/AuthContext.tsx`

### **Flujo de Autenticación**

```
1. Usuario hace login
   ↓
2. AuthContext guarda token en:
   - localStorage (para Client Components)
   - Cookies (para Server Components)
   ↓
3. Server Component llama a API
   ↓
4. getAuthHeaders() lee token de cookies
   ↓
5. Petición incluye: Authorization: Bearer <token>
   ↓
6. Backend valida token con @jwt_required
   ↓
7. Retorna datos de organización
```

---

**Estado:** ✅ Código actualizado y listo para probar
**Próximo paso:** Hacer login y verificar que las cookies se crean correctamente
