# 🔐 Configuración de Autenticación

## Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# API de Autenticación
NEXT_PUBLIC_AUTH_API_URL=http://localhost:5000/api/auth

# API de RFX (existente)
NEXT_PUBLIC_API_URL=http://localhost:5001
```

## Estructura Implementada

### 📁 Archivos Creados

```
lib/
  └── authService.ts          # Servicio de autenticación con axios

contexts/
  └── AuthContext.tsx         # Contexto global de autenticación

app/
  ├── layout.tsx              # Actualizado con AuthProvider
  ├── (auth)/
  │   ├── layout.tsx          # Layout sin sidebar para auth
  │   ├── login/
  │   │   └── page.tsx        # Página de login
  │   └── signup/
  │       └── page.tsx        # Página de registro
  └── (workspace)/
      └── budget-settings/
          └── page.tsx        # Actualizado para usar user.id
```

### 🔑 Funcionalidades Implementadas

#### 1. **AuthService** (`lib/authService.ts`)
- ✅ Signup (registro)
- ✅ Login
- ✅ Logout
- ✅ Get Current User
- ✅ Forgot Password
- ✅ Reset Password
- ✅ Verify Email
- ✅ Resend Verification
- ✅ Update Profile
- ✅ Change Password
- ✅ Auto-refresh token en 401
- ✅ Interceptores de axios configurados

#### 2. **AuthContext** (`contexts/AuthContext.tsx`)
- ✅ Estado global del usuario
- ✅ Funciones de login/signup/logout
- ✅ Loading states
- ✅ Auto-carga del usuario al iniciar
- ✅ Hook `useAuth()` para acceder al contexto

#### 3. **Páginas de Autenticación**
- ✅ Login con validación
- ✅ Signup con confirmación de contraseña
- ✅ Manejo de errores
- ✅ Estados de loading
- ✅ Redirección automática
- ✅ Links entre login/signup

#### 4. **Integración con Budget Settings**
- ✅ Protección de ruta (redirect a login si no autenticado)
- ✅ Uso de `user.id` en lugar de mock UUID
- ✅ Muestra nombre de empresa del usuario
- ✅ Loading state mientras carga usuario

## 🚀 Uso

### En cualquier componente:

```typescript
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, loading, isAuthenticated, login, logout } = useAuth()
  
  if (loading) return <div>Loading...</div>
  
  if (!isAuthenticated) {
    return <div>Please login</div>
  }
  
  return (
    <div>
      <h1>Welcome {user.full_name}</h1>
      <p>User ID: {user.id}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Proteger una ruta:

```typescript
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedPage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])
  
  if (loading) return <div>Loading...</div>
  if (!isAuthenticated) return null
  
  return <div>Protected Content</div>
}
```

## 📡 Endpoints del Backend

El sistema se conecta a los siguientes endpoints (ver `Api-authentication.md` para detalles):

### Públicos:
- `POST /api/auth/signup` - Registro
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-email` - Verificar email
- `POST /api/auth/forgot-password` - Solicitar reset
- `POST /api/auth/reset-password` - Confirmar reset

### Protegidos (requieren token):
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/refresh` - Refresh token
- `PUT /api/auth/profile` - Actualizar perfil
- `POST /api/auth/change-password` - Cambiar contraseña
- `POST /api/auth/resend-verification` - Reenviar verificación

## 🔄 Flujo de Autenticación

1. **Usuario se registra** → Signup → Recibe tokens → Redirige a dashboard
2. **Usuario inicia sesión** → Login → Recibe tokens → Redirige a dashboard
3. **Navegación protegida** → Cada request incluye token automáticamente
4. **Token expira** → Auto-refresh con refresh_token → Continúa navegación
5. **Refresh falla** → Logout automático → Redirige a login

## 🛡️ Seguridad

- ✅ Tokens almacenados en `localStorage`
- ✅ Auto-refresh de tokens expirados
- ✅ Logout automático en errores 401
- ✅ Validación de contraseñas (mínimo 6 caracteres)
- ✅ Manejo de errores de red
- ✅ HTTPS requerido en producción

## 📝 Notas Importantes

1. **Backend debe estar corriendo** en `http://localhost:5000`
2. **Tokens duran 7 días** (access_token)
3. **Refresh tokens duran 30 días**
4. **Email verification es opcional** pero recomendado
5. **Budget Settings ahora usa `user.id`** en lugar de UUID mock

## 🐛 Troubleshooting

### Error: "Cannot find module 'axios'"
```bash
npm install axios
```

### Error: "Network error"
- Verifica que el backend esté corriendo
- Verifica la URL en `.env.local`
- Revisa CORS en el backend

### Usuario no se carga
- Verifica que el token esté en localStorage
- Revisa la consola del navegador
- Verifica que `/api/auth/me` responda correctamente

### Redirect loop
- Limpia localStorage: `localStorage.clear()`
- Recarga la página
- Verifica que no haya múltiples AuthProviders

## ✅ Checklist de Implementación

- [x] Instalar axios
- [x] Crear authService.ts
- [x] Crear AuthContext.tsx
- [x] Crear páginas de login/signup
- [x] Actualizar layout principal con AuthProvider
- [x] Actualizar budget-settings para usar user.id
- [x] Configurar variables de entorno
- [ ] Configurar backend en puerto 5000
- [ ] Probar flujo completo de auth
- [ ] Implementar forgot-password page (opcional)

## 🎯 Próximos Pasos

1. Crear página de "Forgot Password"
2. Crear página de perfil de usuario
3. Agregar verificación de email en UI
4. Implementar ProtectedRoute component reutilizable
5. Agregar tests para authService
6. Implementar logout en el sidebar

---

**¡La autenticación está lista para usar! 🎉**
