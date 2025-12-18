# Vistas: Autenticación (`/login`, `/signup`)

## 📝 Descripción
Páginas de inicio de sesión y registro. Utilizan un sistema de autenticación centralizado (`AuthContext`) y manejan el flujo de entrada a la aplicación protegida.

## 📂 Archivos Principales
- **Rutas:** 
  - `app/(auth)/login/page.tsx`
  - `app/(auth)/signup/page.tsx`
- **Contexto:** `contexts/AuthContext.tsx`
- **Servicio:** `lib/authService.ts`

## 🧩 Componentes Utilizados
| Componente | Origen | Propósito |
|------------|--------|-----------|
| `Card` | `components/ui/card` | Contenedor principal del formulario |
| `Button` | `components/ui/button` | Submit y botón "Volver" |
| `Input` | `components/ui/input` | Campos de formulario |
| `Alert` | `components/ui/alert` | Feedback de errores |

## ⚙️ Lógica y Hooks
- **`useAuth`:** Hook personalizado para acceder a métodos `login` y `signup`.
- **`useSearchParams`:**
  - `redirect`: URL de destino tras auth exitosa (default: `/dashboard`).
  - `from`: URL de procedencia para el botón "Volver".
  - `plan` (Signup): Plan pre-seleccionado (ej: `pro`) desde Pricing/Plans.
- **Redirección Signup:**
  - Si hay plan seleccionado (`!= free`), redirige a `/checkout?plan={...}`.
  - Si no, redirige a `/dashboard` (o `redirect` param).

## 📌 Notas KISS
- Lógica de "Volver" implementada con query params simples (`?from=`), sin estado global complejo.
- Los formularios son Client Components para manejo de estado local (`email`, `password`, `error`).
