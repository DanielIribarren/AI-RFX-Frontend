# Vista: Aceptar Invitación (`/invite/[token]`)

## 📝 Descripción
Página pública (pero con token secreto) donde los usuarios aceptan invitaciones para unirse a una organización.

## 📂 Archivos Principales
- **Ruta:** `app/invite/[token]/page.tsx`
- **Componente Principal:** `AcceptInvitationCard`

## 🧩 Componentes Utilizados
| Componente | Origen | Propósito |
|------------|--------|-----------|
| `AcceptInvitationCard` | `components/organization/AcceptInvitationCard.tsx` | UI principal de aceptación |
| `Button` | `components/ui/button` | Acciones de aceptar/rechazar |
| `Card` | `components/ui/card` | Contenedor visual |

## ⚙️ Lógica y Hooks
- **Validación Server-Side:** La página `page.tsx` valida el token antes de renderizar la UI. Si el token es inválido o expiró, se puede manejar el error antes de cargar JS del cliente.
- **Flujo:**
  - Usuario recibe link por email -> Clic.
  - Se valida token (actualmente mock).
  - Se muestra tarjeta con detalles de la organización y quién invita.
  - Al aceptar, se vincula el usuario a la organización y redirige al dashboard.

## 📌 Notas KISS
- Se separó la lógica de UI (`AcceptInvitationCard`) de la lógica de datos (`page.tsx`), permitiendo que la página sea un Server Component eficiente.
