# Vista: Pricing (`/pricing`)

## 📝 Descripción
Página pública que muestra los planes de suscripción disponibles. Accesible sin autenticación.

## 📂 Archivos Principales
- **Ruta:** `app/pricing/page.tsx`
- **Componente Principal:** `PricingPage` (Client Component)
- **Constantes:** `constants/organization.ts` (`PLANS`)

## 🧩 Componentes Utilizados
| Componente | Origen | Propósito |
|------------|--------|-----------|
| `PublicHeader` | `components/public-header.tsx` | Header compartido |
| `Card` | `components/ui/card` | Contenedor de cada plan |
| `Button` | `components/ui/button` | Selector de plan |
| `Check` | `lucide-react` | Icono para features |

## ⚙️ Lógica y Hooks
- **Estado de Autenticación:** Verifica token local (`localStorage.getItem('access_token')`) para determinar flujo.
- **Flujo de Selección:**
  - **Plan Free (Nuevo):** Redirige a `/signup?from=/pricing`. Ideal para usuarios individuales (10 RFX/mes).
  - **Plan Pago (No Auth):** Redirige a `/signup?plan={key}&from=/pricing`.
  - **Plan Pago (Auth):** Redirige a `/checkout?plan={key}`.
  - **Enterprise:** Muestra `alert` (placeholder).

## 📌 Notas KISS
- No se usó lógica compleja de middleware para precios. Todo es client-side.
- La data de los planes está centralizada en una constante, no hardcodeada en el componente.
