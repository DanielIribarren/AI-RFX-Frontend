# 🚀 PLAN DE IMPLEMENTACIÓN - SISTEMA DE ORGANIZACIONES

**Proyecto:** AI-RFX Frontend  
**Fecha Inicio:** Diciembre 5, 2025  
**Diseño:** Blanco y Negro con componentes shadcn/ui

---

## 📋 RESUMEN EJECUTIVO

Implementación completa del sistema de organizaciones multi-tenant para AI-RFX, permitiendo:
- Crear y gestionar organizaciones
- Invitar y administrar miembros del equipo
- Gestión de roles y permisos
- Planes de suscripción por organización
- Branding personalizado

**Principios de diseño:**
- ✅ Minimalista: Blanco y negro como colores principales
- ✅ Componentes shadcn/ui para consistencia
- ✅ KISS: Soluciones simples y directas
- ✅ Modificar antes que crear: Reutilizar componentes existentes

---

## 🎯 FASE 1: ESTRUCTURA BASE Y TIPOS TYPESCRIPT

### Objetivos
- Crear estructura de carpetas organizada
- Definir tipos TypeScript completos
- Establecer constantes y configuraciones

### Tareas

#### 1.1 Tipos TypeScript (`types/organization.ts`)
```typescript
// Tipos principales de organización
- Organization
- OrganizationMember
- Invitation
- PlanTier
- Role
- CreateOrganizationInput
- UpdateOrganizationInput
```

#### 1.2 Constantes (`constants/organization.ts`)
```typescript
// Configuración de planes
- PLANS (Starter, Pro, Enterprise)
- ROLE_PERMISSIONS
- PLAN_LIMITS
```

#### 1.3 Rutas (`types/routes.ts`)
```typescript
// Rutas de organizaciones
- SETTINGS_ORGANIZATION
- ORG_GENERAL, ORG_MEMBERS, ORG_BILLING, etc.
```

#### 1.4 Estructura de Carpetas
```
app/
├── (workspace)/
│   └── settings/
│       └── organization/
│           ├── page.tsx
│           ├── general/page.tsx
│           ├── members/page.tsx
│           ├── billing/page.tsx
│           ├── branding/page.tsx
│           └── usage/page.tsx
│
├── invite/
│   └── [token]/
│       └── page.tsx

components/
├── organization/
│   ├── CreateOrganizationModal.tsx
│   ├── InviteMemberModal.tsx
│   ├── MemberCard.tsx
│   ├── MembersList.tsx
│   ├── OrganizationSwitcher.tsx
│   └── ... (más componentes)
│
└── shared/
    ├── RoleBadge.tsx
    ├── PlanBadge.tsx
    ├── LimitIndicator.tsx
    └── EmptyState.tsx

hooks/
├── useOrganization.tsx
├── useOrganizationMembers.tsx
└── useInvitations.tsx
```

**Tiempo estimado:** 2-3 horas  
**Archivos a crear:** 5-7 archivos

---

## 🎨 FASE 2: COMPONENTES REUTILIZABLES

### Objetivos
- Crear componentes base reutilizables
- Establecer sistema de diseño consistente
- Componentes minimalistas en blanco y negro

### Tareas

#### 2.1 RoleBadge (`components/shared/RoleBadge.tsx`)
**Diseño:**
- Owner: Fondo negro, texto blanco
- Admin: Fondo gris oscuro, texto blanco
- Member: Fondo gris claro, texto negro

**Props:**
```typescript
interface RoleBadgeProps {
  role: 'owner' | 'admin' | 'member';
  className?: string;
}
```

#### 2.2 PlanBadge (`components/shared/PlanBadge.tsx`)
**Diseño:**
- Free: Gris claro
- Starter: Gris medio
- Pro: Negro (destacado)
- Enterprise: Negro con borde

**Props:**
```typescript
interface PlanBadgeProps {
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  className?: string;
}
```

#### 2.3 LimitIndicator (`components/shared/LimitIndicator.tsx`)
**Diseño:**
- Barra de progreso en escala de grises
- < 70%: Gris claro
- 70-90%: Gris medio con warning
- > 90%: Gris oscuro con alerta

**Props:**
```typescript
interface LimitIndicatorProps {
  current: number;
  max: number | null;
  label: string;
  className?: string;
}
```

#### 2.4 EmptyState (`components/shared/EmptyState.tsx`)
**Diseño:**
- Icono en gris medio
- Título en negro
- Descripción en gris

**Props:**
```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}
```

**Tiempo estimado:** 3-4 horas  
**Archivos a crear:** 4 componentes

---

## 🎣 FASE 3: HOOKS PERSONALIZADOS

### Objetivos
- Crear lógica reutilizable para operaciones CRUD
- Manejo de estados de carga y errores
- Integración con API backend

### Tareas

#### 3.1 useOrganization (`hooks/useOrganization.tsx`)
**Funciones:**
- `createOrganization(data)` - Crear nueva organización
- `updateOrganization(id, data)` - Actualizar organización
- `deleteOrganization(id)` - Eliminar organización

**Estados:**
- `isCreating`, `isUpdating`, `isDeleting`

#### 3.2 useOrganizationMembers (`hooks/useOrganizationMembers.tsx`)
**Funciones:**
- `changeRole(userId, newRole)` - Cambiar rol de miembro
- `removeMember(userId)` - Remover miembro

**Estados:**
- `isUpdating`, `isRemoving`

#### 3.3 useInvitations (`hooks/useInvitations.tsx`)
**Funciones:**
- `inviteMember(orgId, data)` - Enviar invitación
- `acceptInvitation(token)` - Aceptar invitación
- `declineInvitation(token)` - Rechazar invitación
- `cancelInvitation(invitationId)` - Cancelar invitación
- `resendInvitation(invitationId)` - Reenviar invitación

**Estados:**
- `isInviting`, `isAccepting`

**Tiempo estimado:** 4-5 horas  
**Archivos a crear:** 3 hooks

---

## 📄 FASE 4: VISTAS PRINCIPALES

### Objetivos
- Implementar páginas principales del sistema
- Navegación fluida entre vistas
- Diseño responsive y minimalista

### Tareas

#### 4.1 Vista Overview (`app/(workspace)/settings/organization/page.tsx`)
**Funcionalidad:**
- Si usuario NO está en org → Mostrar CTA para crear
- Si usuario SÍ está en org → Redirect a `/general`

**Componentes:**
- `CreateOrganizationCTA` - Card con beneficios y botón

**Diseño:**
- Card blanco con borde gris
- Lista de beneficios con checkmarks negros
- Botón negro "Create Organization"

#### 4.2 Vista General (`app/(workspace)/settings/organization/general/page.tsx`)
**Secciones:**
1. **General Information**
   - Nombre de organización (editable)
   - URL Slug (editable)
   - Botón "Save Changes"

2. **Current Plan**
   - Badge del plan actual
   - Detalles del plan
   - Indicador de uso (seats)
   - Botón "Change Plan"

3. **Danger Zone** (solo Owner)
   - Botón rojo "Delete Organization"

**Componentes:**
- `OrganizationGeneralSettings`
- `OrganizationPlanCard`
- `DangerZone`

#### 4.3 Vista Members (`app/(workspace)/settings/organization/members/page.tsx`)
**Secciones:**
1. **Header**
   - Título "Team Members"
   - Botón "+ Invite" (Owner/Admin)

2. **Usage Indicator**
   - Barra de progreso: "3 / 5 members"

3. **Members List**
   - Cards de miembros con avatar
   - Role badge
   - Botones de acción (Change Role, Remove)

4. **Pending Invitations**
   - Lista de invitaciones pendientes
   - Botones: Resend, Cancel

**Componentes:**
- `InviteMemberButton`
- `MembersList`
- `MemberCard`
- `PendingInvitationsList`
- `PendingInvitationCard`

#### 4.4 Vista Accept Invitation (`app/invite/[token]/page.tsx`)
**Funcionalidad:**
- Validar token de invitación
- Mostrar detalles de la organización
- Botones: Accept / Decline
- Warning si tiene plan personal

**Componentes:**
- `AcceptInvitationCard`

**Diseño:**
- Card centrado en pantalla
- Icono 🎉 en la parte superior
- Información de la org con logo
- Role badge
- Warning en amarillo si aplica
- Botones: Outline "Decline" / Negro "Accept"

**Tiempo estimado:** 8-10 horas  
**Archivos a crear:** 4 páginas + 8-10 componentes

---

## 🎭 FASE 5: MODALS Y COMPONENTES COMPLEJOS

### Objetivos
- Implementar modals de confirmación
- Componentes de formularios complejos
- Interacciones fluidas

### Tareas

#### 5.1 CreateOrganizationModal (`components/organization/CreateOrganizationModal.tsx`)
**Secciones:**
1. Organization Details
   - Nombre (auto-genera slug)
   - URL Slug

2. Plan Selection
   - `PlanSelector` component
   - Cards de planes en grid

3. Billing Email
   - Input de email

4. Warning
   - Alerta sobre cancelación de plan personal

**Diseño:**
- Modal ancho (max-w-2xl)
- Formulario en pasos visuales
- Botones: "Cancel" outline / "Continue to Payment" negro

#### 5.2 InviteMemberModal (`components/organization/InviteMemberModal.tsx`)
**Campos:**
- Email address
- Role selector (Member/Admin)
- Descripción de permisos por rol

**Diseño:**
- Modal estándar
- Botones: "Cancel" / "Send Invitation"

#### 5.3 ChangeRoleModal (`components/organization/ChangeRoleModal.tsx`)
**Funcionalidad:**
- Mostrar miembro actual
- Selector de nuevo rol
- Confirmación de cambio

#### 5.4 RemoveMemberModal (`components/organization/RemoveMemberModal.tsx`)
**Funcionalidad:**
- Confirmación de eliminación
- Mostrar nombre del miembro
- Warning sobre acción irreversible

#### 5.5 DeleteOrganizationModal (`components/organization/DeleteOrganizationModal.tsx`)
**Funcionalidad:**
- Input de confirmación (escribir nombre de org)
- Warning sobre pérdida de datos
- Botón rojo "Delete Organization"

#### 5.6 PlanSelector (`components/organization/PlanSelector.tsx`)
**Diseño:**
- Grid de 3 columnas (responsive)
- Cards de planes con:
  - Badge "Most Popular" en Pro
  - Precio destacado
  - Lista de features con checkmarks
  - Checkmark de selección

**Colores:**
- Seleccionado: Borde negro, fondo gris muy claro
- No seleccionado: Borde gris claro
- Hover: Borde gris medio

#### 5.7 OrganizationSwitcher (`components/organization/OrganizationSwitcher.tsx`)
**Ubicación:** Header del dashboard

**Funcionalidad:**
- Dropdown con org actual
- Opción "Personal Account"
- Opción "Create Organization"

**Diseño:**
- Avatar de org + nombre
- Checkmark en opción actual
- Separador antes de "Create"

**Tiempo estimado:** 10-12 horas  
**Archivos a crear:** 7 componentes complejos

---

## 🔌 FASE 6: INTEGRACIÓN CON API Y TESTING

### Objetivos
- Conectar frontend con backend
- Implementar API client
- Testing de flujos completos

### Tareas

#### 6.1 API Client (`lib/api-organizations.ts`)
**Endpoints:**
```typescript
// Organizations
- createOrganization(data)
- getOrganization(id)
- updateOrganization(id, data)
- deleteOrganization(id)

// Members
- getOrganizationMembers(orgId)
- updateMemberRole(orgId, userId, role)
- removeMember(orgId, userId)

// Invitations
- inviteMember(orgId, data)
- getPendingInvitations(orgId)
- acceptInvitation(token)
- declineInvitation(token)
- cancelInvitation(invitationId)
- resendInvitation(invitationId)
```

#### 6.2 Context Provider (`contexts/OrganizationContext.tsx`)
**Estado global:**
- Organización actual
- Membership del usuario
- Permisos computados

#### 6.3 Middleware Updates (`middleware.ts`)
**Protección de rutas:**
- Rutas de organización requieren membership
- Rutas de admin requieren rol admin/owner

#### 6.4 Testing
- Unit tests para componentes base
- Integration tests para flujos
- E2E tests con Playwright

**Tiempo estimado:** 8-10 horas  
**Archivos a crear/modificar:** 5-7 archivos

---

## 📊 CRONOGRAMA ESTIMADO

| Fase | Duración | Archivos | Complejidad |
|------|----------|----------|-------------|
| Fase 1: Estructura base | 2-3h | 5-7 | Baja |
| Fase 2: Componentes reutilizables | 3-4h | 4 | Media |
| Fase 3: Hooks | 4-5h | 3 | Media |
| Fase 4: Vistas principales | 8-10h | 12-14 | Alta |
| Fase 5: Modals complejos | 10-12h | 7 | Alta |
| Fase 6: API y testing | 8-10h | 5-7 | Media |
| **TOTAL** | **35-44h** | **36-42** | **-** |

**Estimación:** 5-6 días de trabajo (8h/día)

---

## 🎨 GUÍA DE DISEÑO

### Paleta de Colores (Blanco y Negro)

```css
/* Backgrounds */
--bg-primary: #FFFFFF;      /* Blanco puro */
--bg-secondary: #F9FAFB;    /* Gris muy claro */
--bg-tertiary: #F3F4F6;     /* Gris claro */

/* Borders */
--border-light: #E5E7EB;    /* Gris claro */
--border-medium: #D1D5DB;   /* Gris medio */
--border-dark: #9CA3AF;     /* Gris oscuro */

/* Text */
--text-primary: #111827;    /* Negro casi puro */
--text-secondary: #6B7280;  /* Gris medio */
--text-tertiary: #9CA3AF;   /* Gris claro */

/* Accents */
--accent-black: #000000;    /* Negro puro - CTAs */
--accent-gray: #374151;     /* Gris oscuro - Secondary */
```

### Componentes shadcn/ui a Usar

```typescript
// Básicos
- Button (variant: default, outline, ghost)
- Input
- Label
- Card

// Navegación
- Tabs
- Dropdown Menu

// Feedback
- Dialog
- Alert Dialog
- Toast (sonner)
- Badge

// Formularios
- Form (react-hook-form)
- Select
- Checkbox
- Radio Group

// Layout
- Separator
- Avatar
- Progress
```

### Principios de Diseño

1. **Minimalismo**
   - Sin colores llamativos
   - Espacios en blanco generosos
   - Tipografía clara y legible

2. **Jerarquía Visual**
   - Negro para acciones primarias
   - Gris para acciones secundarias
   - Bordes sutiles para separación

3. **Consistencia**
   - Mismo patrón de spacing (4px, 8px, 16px, 24px)
   - Mismo radio de bordes (rounded-lg = 8px)
   - Mismo tamaño de fuentes (text-sm, text-base, text-lg)

4. **Responsive**
   - Mobile-first
   - Grid adaptativo
   - Sidebar colapsable en mobile

---

## 🚦 CRITERIOS DE ACEPTACIÓN

### Fase 1
- ✅ Tipos TypeScript sin errores
- ✅ Estructura de carpetas creada
- ✅ Constantes definidas

### Fase 2
- ✅ 4 componentes reutilizables funcionando
- ✅ Diseño consistente en blanco y negro
- ✅ Props tipadas correctamente

### Fase 3
- ✅ 3 hooks implementados
- ✅ Manejo de errores robusto
- ✅ Estados de carga funcionando

### Fase 4
- ✅ 4 vistas navegables
- ✅ Responsive en mobile y desktop
- ✅ Permisos implementados correctamente

### Fase 5
- ✅ 7 modals funcionando
- ✅ Validación de formularios
- ✅ Feedback visual claro

### Fase 6
- ✅ API integrada completamente
- ✅ Tests pasando
- ✅ Sin errores en consola

---

## 📝 NOTAS DE IMPLEMENTACIÓN

### Reutilización de Código Existente

**Componentes a reutilizar:**
- `components/ui/*` - Todos los componentes shadcn/ui
- `components/delete-confirmation-dialog.tsx` - Patrón para modals de confirmación
- `components/toast-notification.tsx` - Sistema de notificaciones
- `lib/api.ts` - Patrón de API client con `fetchWithAuth`

**Patrones a seguir:**
- Optimistic UI updates (como en productos)
- Auto-save con debounce (como en pricing config)
- Cache con localStorage (como en sidebar)

### Consideraciones de Performance

1. **Lazy Loading**
   - Modals solo se cargan cuando se abren
   - Vistas de analytics con dynamic import

2. **Caching**
   - Lista de miembros en cache (5 min)
   - Datos de organización en cache (5 min)

3. **Optimistic Updates**
   - Cambios de rol se reflejan inmediatamente
   - Rollback si falla el backend

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. ✅ **Crear tipos TypeScript** (`types/organization.ts`)
2. ✅ **Crear constantes** (`constants/organization.ts`)
3. ✅ **Crear estructura de carpetas**
4. ⏳ **Implementar RoleBadge**
5. ⏳ **Implementar PlanBadge**

---

**Estado:** Plan de implementación completo ✅  
**Listo para comenzar:** Fase 1 en progreso 🚀
