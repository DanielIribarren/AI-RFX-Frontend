# Vista: Landing Page (`/`)

## 📝 Descripción
Página principal pública de la aplicación. Es el punto de entrada para usuarios no autenticados.

## 📂 Archivos Principales
- **Ruta:** `app/page.tsx` (Server Component - Wrapper simple)
- **Componente Principal:** `components/landing-page.tsx` (Client Component)
- **Header:** `components/public-header.tsx`

## 🧩 Componentes Utilizados
| Componente | Origen | Propósito |
|------------|--------|-----------|
| `PublicHeader` | `components/public-header.tsx` | Header reutilizable con navegación y botones de auth |
| `Button` | `components/ui/button` | Botones de llamada a la acción (CTA) |
| `Card` | `components/ui/card` | Tarjetas para mostrar features |

## ⚙️ Lógica y Hooks
- **Auth Redirect:** Verifica `localStorage` al montar. Si existe token, redirige a `/dashboard`.
- **Navegación:**
  - Login/Signup envían parámetro `?from=/` para permitir el retorno.
  - Botones "Get Started" llevan a `/signup`.

## 📌 Notas KISS
- Se separó en `app/page.tsx` (Server) y `components/landing-page.tsx` (Client) para evitar conflictos de metadatos de Next.js.
- El `PublicHeader` detecta automáticamente la ruta actual (`usePathname`) para el botón "Volver".
