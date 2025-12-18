# Vista: Organización (`/settings/organization/*`)

## 📝 Descripción
Sección protegida para la gestión de organizaciones. Incluye configuración general, gestión de miembros e invitaciones.

## 📂 Archivos Principales
- **Rutas:**
  - `app/(workspace)/settings/organization/page.tsx` (Gatekeeper)
  - `app/(workspace)/settings/organization/general/page.tsx`
  - `app/(workspace)/settings/organization/members/page.tsx`

## 🧩 Componentes Modulares (`components/organization/*`)
Esta sección utiliza una arquitectura altamente modular:

### Configuración General
| Componente | Propósito |
|------------|-----------|
| `OrganizationGeneralSettings` | Formulario para editar nombre/slug/email |
| `OrganizationPlanCard` | Muestra plan actual y límites de uso |
| `DangerZone` | Botones para eliminar org (solo Owners) |

### Gestión de Miembros
| Componente | Propósito |
|------------|-----------|
| `MembersList` | Lista de usuarios activos con roles |
| `PendingInvitationsList` | Lista de invitaciones enviadas y pendientes |
| `InviteMemberButton` | Modal para invitar nuevos usuarios |
| `CreateOrganizationCTA` | Call-to-action si el usuario no tiene org |

## ⚙️ Lógica y Hooks
- **Carga de Datos:** Cada `page.tsx` tiene funciones asíncronas (`getOrganizationData`, `getOrganizationMembersData`) que actualmente usan mocks. Preparado para integración con API real.
- **Control de Acceso:**
  - `OrganizationPage`: Redirige a `/general` si ya tiene org, sino muestra CTA.
  - **Roles:** La UI se adapta según si el usuario es `owner`, `admin` o `member`.

## 📌 Notas KISS
- En lugar de una tabla gigante compleja, se separaron las listas de miembros e invitaciones.
- Los modales (`InviteMemberModal`, etc.) están encapsulados en sus botones disparadores para mantener limpias las páginas principales.
