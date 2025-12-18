# 🗺️ MAPA VISUAL DE VISTAS - SISTEMA DE ORGANIZACIONES

## 📊 Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUARIO NO EN ORGANIZACIÓN                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  /settings/organization                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  CreateOrganizationCTA                                    │ │
│  │  • Beneficios de organizaciones                           │ │
│  │  • [Create Organization] → Abre modal                     │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  CreateOrganizationModal                                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  1. Detalles básicos (nombre, slug)                       │ │
│  │  2. Selección de plan (Starter/Pro/Enterprise)            │ │
│  │  3. Email de billing                                      │ │
│  │  4. Warning: plan personal se cancela                     │ │
│  │  [Continue to Payment] → Redirect a Stripe                │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    [Stripe Checkout]
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   USUARIO YA EN ORGANIZACIÓN                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  /settings/organization → Redirect automático a:                │
│  /settings/organization/general                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏢 Vistas del Dashboard de Organización

```
/settings/organization/
├── general/          ← Configuración básica
│   ├── OrganizationGeneralSettings (nombre, slug)
│   ├── OrganizationPlanCard (plan actual, usage)
│   └── DangerZone (delete org) [solo Owner]
│
├── members/          ← Gestión de equipo
│   ├── [+ Invite] Button → InviteMemberModal
│   ├── LimitIndicator (3/5 members)
│   ├── MembersList
│   │   └── MemberCard (cada miembro)
│   │       ├── [Change Role] → ChangeRoleModal
│   │       └── [Remove] → RemoveMemberModal
│   └── PendingInvitationsList
│       └── PendingInvitationCard
│           ├── [Resend]
│           └── [Cancel]
│
├── billing/          ← Facturación [solo Owner]
│   ├── OrganizationBillingCard
│   ├── PaymentMethod
│   ├── InvoiceHistory
│   └── [Change Plan] → PlanSelector
│
├── branding/         ← Personalización
│   ├── LogoUploader
│   ├── ColorPicker (primary, secondary)
│   └── TemplateSelector
│
└── usage/            ← Analytics
    ├── UsageMetrics (RFX count, storage)
    ├── UserActivityChart
    └── ExportReport
```

---

## 📧 Flujo de Invitaciones

```
OWNER/ADMIN                          INVITADO
    │                                    │
    │  [+ Invite Member]                │
    │         ↓                          │
    │  InviteMemberModal                │
    │  • Email                           │
    │  • Role (Admin/Member)             │
    │         ↓                          │
    │  [Send Invitation]                │
    │         │                          │
    │         └──── Email ──────────────→│
    │                                    │
    │                          ┌─────────┴─────────┐
    │                          │ ¿Tiene cuenta?    │
    │                          └─────────┬─────────┘
    │                                    │
    │              ┌─────────────────────┼─────────────────────┐
    │              │ SÍ                  │                 NO  │
    │              ↓                     ↓                     ↓
    │     /invite/[token]       /signup?invite=[token]
    │     • Login               • Create account
    │     • Ver detalles org    • Auto-join org
    │     • [Accept] / [Decline]
    │              │
    │              ↓
    │     [Accept Invitation]
    │              │
    │              ↓
    │     • is_in_organization = TRUE
    │     • Plan personal pausado
    │     • Redirect a /settings/organization
```

---

## 🎯 Componentes Clave por Responsabilidad

### 📋 GESTIÓN (CRUD)
```
CreateOrganizationModal
├── PlanSelector
├── Input (nombre, slug)
└── Warning (plan personal)

OrganizationGeneralSettings
├── Form (nombre, slug)
└── Save button

DeleteOrganizationModal
├── Confirmation input
└── Danger button
```

### 👥 MIEMBROS
```
InviteMemberModal
├── Email input
├── Role selector
└── Send button

MemberCard
├── Avatar + info
├── RoleBadge
├── [Change Role] → ChangeRoleModal
└── [Remove] → RemoveMemberModal

PendingInvitationCard
├── Email + date
├── [Resend]
└── [Cancel]
```

### 💰 BILLING & PLANS
```
PlanSelector
├── Starter card
├── Pro card (Popular badge)
└── Enterprise card

OrganizationBillingCard
├── Current plan
├── Next billing date
├── Payment method
└── [Change Plan]

LimitIndicator
├── Progress bar
├── Count (3/5)
└── Warning si cerca del límite
```

### 🎨 BRANDING
```
OrganizationBranding
├── LogoUploader
├── ColorPicker (primary)
├── ColorPicker (secondary)
└── Preview
```

### 📊 ANALYTICS
```
UsageMetrics
├── RFX count chart
├── Storage usage
├── Active users
└── Export button
```

---

## 🔄 Estados y Contextos Globales

### OrganizationContext

```typescript
const OrganizationContext = {
  // Estado actual
  organization: Organization | null,
  membership: OrganizationMember | null,
  
  // Permisos computados
  isOwner: boolean,
  isAdmin: boolean,
  canManageMembers: boolean,
  canManageBilling: boolean,
  
  // Acciones
  switchOrganization: (orgId: string) => void,
  leaveOrganization: () => void,
  
  // Loading states
  isLoading: boolean,
};
```

### UserContext (extendido)

```typescript
const UserContext = {
  user: User,
  
  // Organization info
  isInOrganization: boolean,
  currentOrganization: Organization | null,
  
  // Plan efectivo
  effectivePlan: {
    tier: 'free' | 'starter' | 'pro' | 'enterprise',
    limits: PlanLimits,
    features: PlanFeatures,
  },
  
  // Funciones
  updateUser: (data) => void,
};
```

---

## 🎨 Sistema de Diseño

### Badges

```typescript
// RoleBadge
<RoleBadge role="owner" />   → 🟣 OWNER
<RoleBadge role="admin" />   → 🔵 ADMIN
<RoleBadge role="member" />  → ⚪ MEMBER

// PlanBadge
<PlanBadge plan="free" />       → ⚪ Free
<PlanBadge plan="starter" />    → 🟢 Starter
<PlanBadge plan="pro" />        → 🔵 Pro
<PlanBadge plan="enterprise" /> → 🟣 Enterprise

// StatusBadge
<StatusBadge status="active" />    → 🟢 Active
<StatusBadge status="pending" />   → 🟡 Pending
<StatusBadge status="suspended" /> → 🔴 Suspended
```

### Indicadores de Límites

```typescript
// Verde: < 70%
<LimitIndicator current={3} max={10} />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
30%

// Amarillo: 70-90%
<LimitIndicator current={8} max={10} />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
80%  ⚠️ Acercándose al límite

// Rojo: > 90%
<LimitIndicator current={10} max={10} />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
100% ❌ Límite alcanzado
```

### Modals Estandarizados

```typescript
// Patrón común para todos los modals
<Dialog>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>...</Dialog.Title>
      <Dialog.Description>...</Dialog.Description>
    </Dialog.Header>
    
    {/* Contenido */}
    
    <Dialog.Footer>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog>
```

---

## 📱 Responsive Breakpoints

```typescript
// Mobile-first approach

// Small (sm): 640px
// Medium (md): 768px
// Large (lg): 1024px
// XLarge (xl): 1280px

// Ejemplos:

// Desktop: 3 columnas para planes
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">

// Mobile: Stack vertical
<div className="flex flex-col lg:flex-row gap-4">

// Sidebar: Oculto en mobile
<aside className="hidden lg:block">
```

---

## ⚡ Performance Optimizations

### Lazy Loading

```typescript
// Cargar modals solo cuando se necesiten
const CreateOrganizationModal = dynamic(
  () => import('@/components/organization/CreateOrganizationModal'),
  { ssr: false }
);

// Cargar charts solo en vista de analytics
const UsageChart = dynamic(
  () => import('@/components/organization/UsageChart'),
  { loading: () => <Skeleton /> }
);
```

### Caching

```typescript
// Usar React Query para cachear datos de org
const { data: organization } = useQuery({
  queryKey: ['organization', orgId],
  queryFn: () => fetchOrganization(orgId),
  staleTime: 5 * 60 * 1000, // 5 minutos
});

// Invalidar cache al hacer cambios
const mutation = useMutation({
  mutationFn: updateOrganization,
  onSuccess: () => {
    queryClient.invalidateQueries(['organization']);
  },
});
```

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// Componentes individuales
describe('MemberCard', () => {
  it('shows owner badge for owner role', () => {});
  it('hides remove button for current user', () => {});
  it('calls onRemove when remove clicked', () => {});
});
```

### Integration Tests
```typescript
// Flujos completos
describe('Organization Creation Flow', () => {
  it('creates org and redirects to billing', () => {});
  it('validates form inputs correctly', () => {});
  it('shows error if slug taken', () => {});
});
```

### E2E Tests (Playwright)
```typescript
test('complete member invitation flow', async ({ page }) => {
  // Owner invita
  await page.goto('/settings/organization/members');
  await page.click('[data-testid="invite-member"]');
  await page.fill('[name="email"]', 'new@member.com');
  await page.click('[type="submit"]');
  
  // Nuevo miembro acepta
  const inviteLink = await getInvitationLink();
  await page.goto(inviteLink);
  await page.click('[data-testid="accept-invitation"]');
  
  // Verificar
  await expect(page).toHaveURL('/settings/organization');
});
```

---

## 📋 CHECKLIST VISUAL

```
COMPONENTES BASE
├── ✅ RoleBadge
├── ✅ PlanBadge  
├── ✅ LimitIndicator
└── ✅ EmptyState

MODALS
├── ✅ CreateOrganizationModal
├── ✅ InviteMemberModal
├── ✅ ChangeRoleModal
├── ✅ RemoveMemberModal
└── ✅ DeleteOrganizationModal

VISTAS PRINCIPALES
├── ✅ /settings/organization (CTA)
├── ✅ /settings/organization/general
├── ✅ /settings/organization/members
├── ✅ /settings/organization/billing
├── ✅ /settings/organization/branding
└── ✅ /invite/[token]

COMPONENTES COMPLEJOS
├── ✅ OrganizationSwitcher
├── ✅ MembersList
├── ✅ PlanSelector
└── ✅ UsageMetrics

HOOKS
├── ✅ useOrganization
├── ✅ useOrganizationMembers
└── ✅ useInvitations
```

---

**🎯 TODO LISTO PARA IMPLEMENTACIÓN**

Esta documentación visual complementa la documentación técnica completa.
Usa ambos documentos juntos para implementar el sistema de organizaciones.