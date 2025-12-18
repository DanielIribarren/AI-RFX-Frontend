# Vistas: Checkout & Plans

## 📝 Descripción
Vistas relacionadas con la selección y pago de suscripciones. Incluye la página de comparación de planes dentro del workspace y el flujo de checkout.

## 📂 Archivos Principales
- **Rutas:**
  - `app/(workspace)/plans/page.tsx` (Lista de planes interna)
  - `app/(workspace)/checkout/page.tsx` (Pasarela de pago)
- **Constantes:** `constants/organization.ts`

## 🧩 Componentes Utilizados
| Componente | Origen | Propósito |
|------------|--------|-----------|
| `CurrentPlanCard` | `app/(workspace)/plans/page.tsx` | Muestra el plan actual |
| `PlanComparison` | `app/(workspace)/plans/page.tsx` | Tabla comparativa de planes |
| `PlanBadge` | `components/shared/PlanBadge` | Badge visual del tipo de plan |
| `CheckoutContent` | `app/(workspace)/checkout/page.tsx` | Componente de checkout (Stripe placeholder) |

## ⚙️ Lógica y Hooks
- **Suspense (`checkout`):** La página de checkout envuelve su contenido en `Suspense` para manejar `useSearchParams` de forma segura.
- **Validación de Plan:** El checkout verifica que el `planKey` en la URL exista y sea válido.
- **Flujo:**
  - Selección de plan Pago → Redirect a `/checkout?plan={key}`
  - Selección de plan Free → Redirect a `/signup` (sin checkout)
  - Validación de pago (Mock) → Redirect a `/dashboard`

## 📌 Notas KISS
- El checkout es un placeholder funcional que simula la latencia de red.
- `Suspense` es crucial aquí para evitar errores de renderizado en servidor cuando se accede a query params.
