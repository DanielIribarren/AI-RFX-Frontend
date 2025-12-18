# 🎨 VISTAS Y COMPONENTES - SISTEMA DE ORGANIZACIONES
## Documentación Frontend para AI-RFX

**Proyecto:** AI-RFX Frontend  
**Framework:** Next.js 14+ (App Router)  
**Fecha:** Diciembre 5, 2025  
**Versión:** 1.0

---

## 📋 ÍNDICE

1. [Arquitectura de Vistas](#arquitectura-de-vistas)
2. [Rutas y Navegación](#rutas-y-navegación)
3. [Componentes por Vista](#componentes-por-vista)
4. [Componentes Reutilizables](#componentes-reutilizables)
5. [Estados y Contextos](#estados-y-contextos)
6. [Integraciones con Backend](#integraciones-con-backend)
7. [Especificaciones Técnicas](#especificaciones-técnicas)

---

## 🏗️ ARQUITECTURA DE VISTAS

### Estructura de Carpetas Propuesta

```
app/
├── (dashboard)/
│   ├── settings/
│   │   ├── page.tsx                    # Settings home (redirect a profile)
│   │   ├── profile/
│   │   │   └── page.tsx                # User profile settings
│   │   ├── billing/
│   │   │   └── page.tsx                # Personal billing
│   │   ├── organization/
│   │   │   ├── page.tsx                # Organization overview
│   │   │   ├── general/
│   │   │   │   └── page.tsx            # Org general settings
│   │   │   ├── members/
│   │   │   │   └── page.tsx            # Members management
│   │   │   ├── billing/
│   │   │   │   └── page.tsx            # Org billing
│   │   │   ├── branding/
│   │   │   │   └── page.tsx            # Org branding
│   │   │   └── usage/
│   │   │       └── page.tsx            # Usage & analytics
│   │   └── preferences/
│   │       └── page.tsx                # App preferences
│   └── layout.tsx                       # Dashboard layout with sidebar
│
├── invite/
│   └── [token]/
│       └── page.tsx                     # Accept invitation page
│
└── org/
    └── [slug]/
        └── page.tsx                     # Public org page (future)

components/
├── organization/
│   ├── OrganizationSwitcher.tsx         # Header dropdown
│   ├── CreateOrganizationModal.tsx      # Create org modal
│   ├── InviteMemberModal.tsx            # Invite member modal
│   ├── MemberCard.tsx                   # Individual member card
│   ├── MembersList.tsx                  # List of members
│   ├── PendingInvitationCard.tsx        # Pending invitation card
│   ├── OrganizationSettings.tsx         # General settings form
│   ├── DeleteOrganizationModal.tsx      # Delete org confirmation
│   ├── ChangeRoleModal.tsx              # Change member role
│   ├── RemoveMemberModal.tsx            # Remove member confirmation
│   ├── OrganizationBranding.tsx         # Branding settings
│   ├── OrganizationBillingCard.tsx      # Billing info card
│   ├── UsageMetrics.tsx                 # Usage charts/stats
│   └── PlanSelector.tsx                 # Plan selection component
│
├── shared/
│   ├── PlanBadge.tsx                    # Plan tier badge
│   ├── RoleBadge.tsx                    # Role badge
│   ├── LimitIndicator.tsx               # Usage limit indicator
│   └── EmptyState.tsx                   # Empty state component
│
└── layouts/
    └── SettingsLayout.tsx               # Settings sidebar layout

contexts/
├── OrganizationContext.tsx              # Current org state
└── UserContext.tsx                      # User + membership state

hooks/
├── useOrganization.tsx                  # Organization CRUD
├── useOrganizationMembers.tsx           # Members management
├── useInvitations.tsx                   # Invitations management
└── usePlanLimits.tsx                    # Check plan limits

types/
└── organization.ts                      # TypeScript types
```

---

## 🛣️ RUTAS Y NAVEGACIÓN

### Rutas Principales

```typescript
// types/routes.ts

export const ROUTES = {
  // Settings
  SETTINGS: '/settings',
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_BILLING: '/settings/billing',
  SETTINGS_ORGANIZATION: '/settings/organization',
  SETTINGS_PREFERENCES: '/settings/preferences',
  
  // Organization settings
  ORG_GENERAL: '/settings/organization/general',
  ORG_MEMBERS: '/settings/organization/members',
  ORG_BILLING: '/settings/organization/billing',
  ORG_BRANDING: '/settings/organization/branding',
  ORG_USAGE: '/settings/organization/usage',
  
  // Invitations
  ACCEPT_INVITATION: '/invite/[token]',
  
  // Public
  ORG_PUBLIC: '/org/[slug]',
} as const;
```

### Navegación Condicional

```typescript
// Lógica para mostrar/ocultar tabs según contexto del usuario

function getSettingsTabs(user: User) {
  const baseTabs = [
    { label: 'Profile', href: ROUTES.SETTINGS_PROFILE },
    { label: 'Preferences', href: ROUTES.SETTINGS_PREFERENCES },
  ];
  
  if (user.is_in_organization) {
    // Usuario en organización
    return [
      ...baseTabs,
      { label: 'Organization', href: ROUTES.SETTINGS_ORGANIZATION },
      // Billing lo maneja el owner en org/billing
    ];
  } else {
    // Usuario individual
    return [
      ...baseTabs,
      { label: 'Billing', href: ROUTES.SETTINGS_BILLING },
      { label: 'Organization', href: ROUTES.SETTINGS_ORGANIZATION }, // Para crear org
    ];
  }
}
```

---

## 📄 COMPONENTES POR VISTA

### VISTA 1: `/settings/organization` (Overview)

**Ubicación:** `app/(dashboard)/settings/organization/page.tsx`

**Propósito:** 
- Si usuario NO está en org → Mostrar opción de crear organización
- Si usuario SÍ está en org → Redirect a `/settings/organization/general`

**Componentes:**

```typescript
// app/(dashboard)/settings/organization/page.tsx

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { CreateOrganizationCTA } from '@/components/organization/CreateOrganizationCTA';

export default async function OrganizationPage() {
  const session = await getServerSession();
  const user = await getUserWithOrganization(session.user.id);
  
  // Si ya está en org, redirect a general
  if (user.is_in_organization) {
    redirect('/settings/organization/general');
  }
  
  // Si no está en org, mostrar CTA
  return (
    <div className="max-w-4xl mx-auto p-6">
      <CreateOrganizationCTA />
    </div>
  );
}
```

**Componente: CreateOrganizationCTA**

```typescript
// components/organization/CreateOrganizationCTA.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateOrganizationModal } from './CreateOrganizationModal';

export function CreateOrganizationCTA() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <>
      <div className="border rounded-lg p-8 text-center space-y-4">
        <h2 className="text-2xl font-semibold">Create an Organization</h2>
        
        <p className="text-gray-600 max-w-2xl mx-auto">
          Organizations allow you to collaborate with your team, 
          manage RFX together, and centralize billing.
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <CheckIcon className="w-5 h-5 text-green-500" />
            <span>Share RFX with team members</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <CheckIcon className="w-5 h-5 text-green-500" />
            <span>Centralized billing and management</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <CheckIcon className="w-5 h-5 text-green-500" />
            <span>Unified branding across all proposals</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <CheckIcon className="w-5 h-5 text-green-500" />
            <span>Analytics and reporting</span>
          </div>
        </div>
        
        <Button 
          size="lg" 
          onClick={() => setIsModalOpen(true)}
        >
          Create Organization
        </Button>
      </div>
      
      <CreateOrganizationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
```

---

### VISTA 2: `/settings/organization/general`

**Ubicación:** `app/(dashboard)/settings/organization/general/page.tsx`

**Propósito:** Configuración general de la organización

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  Settings > Organization > General                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  General Information                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Organization Name                                   │ │
│  │  [Acme Catering                              ]       │ │
│  │                                                      │ │
│  │  URL Slug                                            │ │
│  │  [acme-catering                              ]       │ │
│  │  https://ai-rfx.com/org/acme-catering               │ │
│  │                                                      │ │
│  │  [Save Changes]                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  Current Plan                                               │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  [PRO] Pro Plan                                      │ │
│  │  $99/month • 5 users max • Unlimited RFX             │ │
│  │                                                      │ │
│  │  Usage: 3/5 seats used                               │ │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                 │ │
│  │  60%                                                 │ │
│  │                                                      │ │
│  │  [Change Plan]                                       │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  Danger Zone                                                │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Delete Organization                                 │ │
│  │  This will permanently delete all data               │ │
│  │  [Delete Organization]                               │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Componentes:**

```typescript
// app/(dashboard)/settings/organization/general/page.tsx

import { OrganizationGeneralSettings } from '@/components/organization/OrganizationGeneralSettings';
import { OrganizationPlanCard } from '@/components/organization/OrganizationPlanCard';
import { DangerZone } from '@/components/organization/DangerZone';

export default async function OrganizationGeneralPage() {
  const session = await getServerSession();
  const org = await getOrganization(session.user.current_organization_id);
  const membership = await getMembership(session.user.id, org.id);
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">General Settings</h1>
        <p className="text-gray-600">Manage your organization details</p>
      </div>
      
      <OrganizationGeneralSettings 
        organization={org}
        canEdit={membership.role === 'owner'}
      />
      
      <OrganizationPlanCard 
        organization={org}
        canManage={membership.role === 'owner'}
      />
      
      {membership.role === 'owner' && (
        <DangerZone organizationId={org.id} />
      )}
    </div>
  );
}
```

**Componente: OrganizationGeneralSettings**

```typescript
// components/organization/OrganizationGeneralSettings.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOrganization } from '@/hooks/useOrganization';

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  slug: z.string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  organization: Organization;
  canEdit: boolean;
}

export function OrganizationGeneralSettings({ organization, canEdit }: Props) {
  const { updateOrganization, isUpdating } = useOrganization();
  
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: organization.name,
      slug: organization.slug,
    },
  });
  
  const onSubmit = async (data: FormData) => {
    await updateOrganization(organization.id, data);
  };
  
  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">General Information</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Organization Name
          </label>
          <Input
            {...register('name')}
            disabled={!canEdit}
            placeholder="Acme Catering"
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            URL Slug
          </label>
          <Input
            {...register('slug')}
            disabled={!canEdit}
            placeholder="acme-catering"
          />
          <p className="text-sm text-gray-500 mt-1">
            https://ai-rfx.com/org/{organization.slug}
          </p>
          {errors.slug && (
            <p className="text-sm text-red-500 mt-1">{errors.slug.message}</p>
          )}
        </div>
        
        {canEdit && (
          <Button 
            type="submit" 
            disabled={!isDirty || isUpdating}
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </form>
    </div>
  );
}
```

---

### VISTA 3: `/settings/organization/members`

**Ubicación:** `app/(dashboard)/settings/organization/members/page.tsx`

**Propósito:** Gestión de miembros del equipo

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  Settings > Organization > Members              [+ Invite]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Team Members                                               │
│  Current: 3 / 5 members                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  60%                                                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  👤 Juan Pérez (you)                                 │ │
│  │     juan@acme.com                                    │ │
│  │     [OWNER] • Joined Nov 15, 2025                    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  👤 María García                    [Change Role ▼]  │ │
│  │     maria@acme.com                  [Remove]         │ │
│  │     [ADMIN] • Joined Nov 20, 2025                    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  👤 Carlos López                    [Change Role ▼]  │ │
│  │     carlos@acme.com                 [Remove]         │ │
│  │     [MEMBER] • Joined Nov 25, 2025                   │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  Pending Invitations (1)                                    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  ✉️  sofia@example.com                               │ │
│  │     [MEMBER] • Invited Nov 28, 2025                  │ │
│  │     [Resend]  [Cancel]                               │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Componentes:**

```typescript
// app/(dashboard)/settings/organization/members/page.tsx

import { InviteMemberButton } from '@/components/organization/InviteMemberButton';
import { MembersList } from '@/components/organization/MembersList';
import { PendingInvitationsList } from '@/components/organization/PendingInvitationsList';
import { LimitIndicator } from '@/components/shared/LimitIndicator';

export default async function OrganizationMembersPage() {
  const session = await getServerSession();
  const org = await getOrganization(session.user.current_organization_id);
  const membership = await getMembership(session.user.id, org.id);
  const members = await getOrganizationMembers(org.id);
  const invitations = await getPendingInvitations(org.id);
  
  const canManage = ['owner', 'admin'].includes(membership.role);
  const currentCount = members.length;
  const maxUsers = org.max_users; // null = unlimited
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="text-gray-600">
            Manage who has access to your organization
          </p>
        </div>
        
        {canManage && (
          <InviteMemberButton 
            organizationId={org.id}
            disabled={maxUsers !== null && currentCount >= maxUsers}
          />
        )}
      </div>
      
      <LimitIndicator
        current={currentCount}
        max={maxUsers}
        label="members"
      />
      
      <MembersList 
        members={members}
        currentUserId={session.user.id}
        canManage={canManage}
        isOwner={membership.role === 'owner'}
      />
      
      {invitations.length > 0 && (
        <PendingInvitationsList 
          invitations={invitations}
          canManage={canManage}
        />
      )}
    </div>
  );
}
```

**Componente: MembersList**

```typescript
// components/organization/MembersList.tsx

'use client';

import { MemberCard } from './MemberCard';
import { EmptyState } from '@/components/shared/EmptyState';

interface Props {
  members: OrganizationMember[];
  currentUserId: string;
  canManage: boolean;
  isOwner: boolean;
}

export function MembersList({ 
  members, 
  currentUserId, 
  canManage,
  isOwner 
}: Props) {
  if (members.length === 0) {
    return (
      <EmptyState
        icon="👥"
        title="No members yet"
        description="Invite team members to start collaborating"
      />
    );
  }
  
  return (
    <div className="space-y-3">
      {members.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          isCurrentUser={member.user_id === currentUserId}
          canChangeRole={isOwner && member.user_id !== currentUserId}
          canRemove={canManage && member.role !== 'owner'}
        />
      ))}
    </div>
  );
}
```

**Componente: MemberCard**

```typescript
// components/organization/MemberCard.tsx

'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { Button } from '@/components/ui/button';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { ChangeRoleModal } from './ChangeRoleModal';
import { RemoveMemberModal } from './RemoveMemberModal';

interface Props {
  member: OrganizationMember;
  isCurrentUser: boolean;
  canChangeRole: boolean;
  canRemove: boolean;
}

export function MemberCard({ 
  member, 
  isCurrentUser, 
  canChangeRole,
  canRemove 
}: Props) {
  const [showChangeRole, setShowChangeRole] = useState(false);
  const [showRemove, setShowRemove] = useState(false);
  
  return (
    <>
      <div className="border rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            src={member.user.avatar_url}
            fallback={member.user.name?.[0] || member.user.email[0]}
          />
          
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">
                {member.user.name || member.user.email}
                {isCurrentUser && <span className="text-gray-500"> (you)</span>}
              </p>
            </div>
            <p className="text-sm text-gray-600">{member.user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <RoleBadge role={member.role} />
              <span className="text-sm text-gray-500">
                • Joined {formatDate(member.joined_at)}
              </span>
            </div>
          </div>
        </div>
        
        {!isCurrentUser && (canChangeRole || canRemove) && (
          <div className="flex items-center gap-2">
            {canChangeRole && (
              <DropdownMenu>
                <DropdownMenu.Trigger asChild>
                  <Button variant="outline" size="sm">
                    Change Role
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  <DropdownMenu.Item onClick={() => setShowChangeRole(true)}>
                    Change to Admin
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onClick={() => setShowChangeRole(true)}>
                    Change to Member
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu>
            )}
            
            {canRemove && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowRemove(true)}
              >
                Remove
              </Button>
            )}
          </div>
        )}
      </div>
      
      {showChangeRole && (
        <ChangeRoleModal
          member={member}
          isOpen={showChangeRole}
          onClose={() => setShowChangeRole(false)}
        />
      )}
      
      {showRemove && (
        <RemoveMemberModal
          member={member}
          isOpen={showRemove}
          onClose={() => setShowRemove(false)}
        />
      )}
    </>
  );
}
```

---

### VISTA 4: `/invite/[token]` (Accept Invitation)

**Ubicación:** `app/invite/[token]/page.tsx`

**Propósito:** Página donde usuario acepta invitación a organización

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    AI-RFX Logo                              │
│                                                             │
│             You've been invited! 🎉                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │  Juan Pérez invited you to join                     │ │
│  │                                                      │ │
│  │  🏢 Acme Catering                                    │ │
│  │                                                      │ │
│  │  as a Member                                         │ │
│  │                                                      │ │
│  │  This organization is on the Pro plan               │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ⚠️  Note: Your current personal plan will be paused       │
│                                                             │
│  [Accept Invitation]    [Decline]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Componentes:**

```typescript
// app/invite/[token]/page.tsx

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { AcceptInvitationCard } from '@/components/organization/AcceptInvitationCard';

interface Props {
  params: {
    token: string;
  };
}

export default async function AcceptInvitationPage({ params }: Props) {
  const session = await getServerSession();
  const invitation = await getInvitationByToken(params.token);
  
  // Validar token
  if (!invitation || invitation.status !== 'pending') {
    return <InvalidInvitationPage />;
  }
  
  // Si token expiró
  if (new Date(invitation.expires_at) < new Date()) {
    return <ExpiredInvitationPage />;
  }
  
  // Si no está logueado, redirect a login con return URL
  if (!session) {
    redirect(`/login?callbackUrl=/invite/${params.token}`);
  }
  
  // Si ya está en esta organización
  if (session.user.current_organization_id === invitation.organization_id) {
    redirect('/settings/organization');
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <AcceptInvitationCard 
        invitation={invitation}
        currentUser={session.user}
      />
    </div>
  );
}
```

**Componente: AcceptInvitationCard**

```typescript
// components/organization/AcceptInvitationCard.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { PlanBadge } from '@/components/shared/PlanBadge';
import { useInvitations } from '@/hooks/useInvitations';

interface Props {
  invitation: Invitation;
  currentUser: User;
}

export function AcceptInvitationCard({ invitation, currentUser }: Props) {
  const router = useRouter();
  const { acceptInvitation, declineInvitation, isLoading } = useInvitations();
  
  const hasPersonalPlan = currentUser.personal_plan_tier !== 'free';
  
  const handleAccept = async () => {
    await acceptInvitation(invitation.token);
    router.push('/settings/organization');
  };
  
  const handleDecline = async () => {
    await declineInvitation(invitation.token);
    router.push('/');
  };
  
  return (
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold mb-2">You've been invited!</h1>
        <p className="text-gray-600">
          {invitation.invited_by.name} invited you to join
        </p>
      </div>
      
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏢</span>
          <div>
            <p className="font-semibold text-lg">
              {invitation.organization.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-600">as a</span>
              <RoleBadge role={invitation.role} />
            </div>
          </div>
        </div>
        
        <div className="pt-2 border-t">
          <p className="text-sm text-gray-600">
            This organization is on the{' '}
            <PlanBadge plan={invitation.organization.plan_tier} />
          </p>
        </div>
      </div>
      
      {hasPersonalPlan && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-2">
            <span className="text-yellow-600">⚠️</span>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Your personal plan will be paused
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Your current {currentUser.personal_plan_tier} plan will be 
                paused and you'll receive a prorated refund. You can resume 
                it if you leave this organization.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleDecline}
          disabled={isLoading}
        >
          Decline
        </Button>
        <Button
          className="flex-1"
          onClick={handleAccept}
          disabled={isLoading}
        >
          {isLoading ? 'Accepting...' : 'Accept Invitation'}
        </Button>
      </div>
    </div>
  );
}
```

---

## 🧩 COMPONENTES REUTILIZABLES

### 1. OrganizationSwitcher (Header)

**Ubicación:** `components/organization/OrganizationSwitcher.tsx`

**Propósito:** Dropdown en header para cambiar entre organizaciones (futuro)

```typescript
// components/organization/OrganizationSwitcher.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { Avatar } from '@/components/ui/avatar';
import { Check, Plus } from 'lucide-react';

interface Props {
  currentOrganization: Organization | null;
  organizations: Organization[]; // Future: multiple orgs
}

export function OrganizationSwitcher({ 
  currentOrganization,
  organizations 
}: Props) {
  const router = useRouter();
  
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100">
        {currentOrganization ? (
          <>
            <Avatar
              src={currentOrganization.logo_url}
              fallback={currentOrganization.name[0]}
              size="sm"
            />
            <span className="font-medium">{currentOrganization.name}</span>
          </>
        ) : (
          <span className="font-medium">Personal Account</span>
        )}
        <ChevronDown className="w-4 h-4" />
      </DropdownMenu.Trigger>
      
      <DropdownMenu.Content align="start" className="w-64">
        {/* Current organization */}
        {currentOrganization && (
          <DropdownMenu.Item className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar
                src={currentOrganization.logo_url}
                fallback={currentOrganization.name[0]}
                size="sm"
              />
              <span>{currentOrganization.name}</span>
            </div>
            <Check className="w-4 h-4" />
          </DropdownMenu.Item>
        )}
        
        {/* Personal account option */}
        <DropdownMenu.Item
          onClick={() => router.push('/switch-to-personal')}
          className="flex items-center justify-between"
        >
          <span>Personal Account</span>
          {!currentOrganization && <Check className="w-4 h-4" />}
        </DropdownMenu.Item>
        
        <DropdownMenu.Separator />
        
        {/* Create new organization */}
        <DropdownMenu.Item 
          onClick={() => router.push('/settings/organization')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Organization</span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
```

---

### 2. CreateOrganizationModal

**Ubicación:** `components/organization/CreateOrganizationModal.tsx`

**Propósito:** Modal para crear nueva organización

```typescript
// components/organization/CreateOrganizationModal.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlanSelector } from './PlanSelector';
import { useOrganization } from '@/hooks/useOrganization';

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  slug: z.string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens')
    .transform(val => val.toLowerCase()),
  plan_tier: z.enum(['starter', 'pro', 'enterprise']),
  billing_email: z.string().email('Invalid email address'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateOrganizationModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const { createOrganization, isCreating } = useOrganization();
  const [step, setStep] = useState<'details' | 'plan' | 'billing'>('details');
  
  const { 
    register, 
    handleSubmit, 
    watch,
    setValue,
    formState: { errors } 
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      plan_tier: 'pro', // Default to Pro (most popular)
    }
  });
  
  // Auto-generate slug from name
  const name = watch('name');
  React.useEffect(() => {
    if (name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('slug', slug);
    }
  }, [name, setValue]);
  
  const onSubmit = async (data: FormData) => {
    const org = await createOrganization(data);
    
    // Redirect to Stripe checkout
    window.location.href = org.stripe_checkout_url;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Content className="max-w-2xl">
        <Dialog.Header>
          <Dialog.Title>Create Organization</Dialog.Title>
          <Dialog.Description>
            Set up your organization to collaborate with your team
          </Dialog.Description>
        </Dialog.Header>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Organization Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Organization Name *
              </label>
              <Input
                {...register('name')}
                placeholder="Acme Catering"
                autoFocus
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                URL Slug *
              </label>
              <Input
                {...register('slug')}
                placeholder="acme-catering"
              />
              <p className="text-sm text-gray-500 mt-1">
                https://ai-rfx.com/org/{watch('slug') || 'your-slug'}
              </p>
              {errors.slug && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.slug.message}
                </p>
              )}
            </div>
          </div>
          
          {/* Plan Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Plan *
            </label>
            <PlanSelector
              selected={watch('plan_tier')}
              onChange={(plan) => setValue('plan_tier', plan)}
            />
          </div>
          
          {/* Billing Email */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Billing Email *
            </label>
            <Input
              {...register('billing_email')}
              type="email"
              placeholder="billing@acme.com"
            />
            {errors.billing_email && (
              <p className="text-sm text-red-500 mt-1">
                {errors.billing_email.message}
              </p>
            )}
          </div>
          
          {/* Warning about personal plan */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-2">
              <span className="text-yellow-600">⚠️</span>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Your personal plan will be canceled
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  You'll receive a prorated refund for any unused days on 
                  your current plan.
                </p>
              </div>
            </div>
          </div>
          
          <Dialog.Footer>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Continue to Payment →'}
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
```

---

### 3. InviteMemberModal

**Ubicación:** `components/organization/InviteMemberModal.tsx`

```typescript
// components/organization/InviteMemberModal.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useInvitations } from '@/hooks/useInvitations';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['member', 'admin']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InviteMemberModal({ 
  organizationId, 
  isOpen, 
  onClose 
}: Props) {
  const { inviteMember, isInviting } = useInvitations();
  
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors } 
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'member',
    }
  });
  
  const onSubmit = async (data: FormData) => {
    await inviteMember(organizationId, data);
    reset();
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Invite Team Member</Dialog.Title>
          <Dialog.Description>
            Send an invitation to join your organization
          </Dialog.Description>
        </Dialog.Header>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Email Address *
            </label>
            <Input
              {...register('email')}
              type="email"
              placeholder="member@example.com"
              autoFocus
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Role *
            </label>
            <Select {...register('role')}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </Select>
            
            <div className="mt-2 text-sm text-gray-600 space-y-1">
              <p>• <strong>Member:</strong> Can create and manage their own RFX</p>
              <p>• <strong>Admin:</strong> Can manage all RFX and invite members</p>
            </div>
          </div>
          
          <Dialog.Footer>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isInviting}>
              {isInviting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
```

---

### 4. PlanSelector

**Ubicación:** `components/organization/PlanSelector.tsx`

```typescript
// components/organization/PlanSelector.tsx

'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Plan {
  id: 'starter' | 'pro' | 'enterprise';
  name: string;
  price: string;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$49',
    features: [
      '30 RFX/month',
      '2 users',
      'Custom branding',
      'Export to PDF/Excel/Word',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$99',
    features: [
      'Unlimited RFX',
      '5 users',
      'Advanced analytics',
      'Google integrations',
      'Priority support',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    features: [
      'Everything in Pro',
      'Unlimited users',
      'White-label',
      'SSO & RBAC',
      'Dedicated support',
    ],
  },
];

interface Props {
  selected: string;
  onChange: (plan: 'starter' | 'pro' | 'enterprise') => void;
}

export function PlanSelector({ selected, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {PLANS.map((plan) => (
        <button
          key={plan.id}
          type="button"
          onClick={() => onChange(plan.id)}
          className={cn(
            'relative border-2 rounded-lg p-4 text-left transition-all',
            selected === plan.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                Most Popular
              </span>
            </div>
          )}
          
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <p className="text-2xl font-bold mt-1">
                {plan.price}
                {plan.price !== 'Custom' && <span className="text-sm font-normal text-gray-600">/mo</span>}
              </p>
            </div>
            
            <ul className="space-y-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {selected === plan.id && (
            <div className="absolute top-3 right-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
```

---

### 5. LimitIndicator

**Ubicación:** `components/shared/LimitIndicator.tsx`

```typescript
// components/shared/LimitIndicator.tsx

'use client';

import { cn } from '@/lib/utils';

interface Props {
  current: number;
  max: number | null; // null = unlimited
  label: string;
  className?: string;
}

export function LimitIndicator({ current, max, label, className }: Props) {
  if (max === null) {
    return (
      <div className={cn('text-sm text-gray-600', className)}>
        {current} {label} • Unlimited
      </div>
    );
  }
  
  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= max;
  
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className={cn(
          'font-medium',
          isAtLimit && 'text-red-600',
          isNearLimit && !isAtLimit && 'text-yellow-600'
        )}>
          {current} / {max} {label}
        </span>
        <span className="text-gray-600">{percentage.toFixed(0)}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn(
            'h-2 rounded-full transition-all',
            isAtLimit && 'bg-red-500',
            isNearLimit && !isAtLimit && 'bg-yellow-500',
            !isNearLimit && 'bg-blue-500'
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {isAtLimit && (
        <p className="text-sm text-red-600">
          You've reached your {label} limit. Upgrade to add more.
        </p>
      )}
    </div>
  );
}
```

---

## 🎣 HOOKS Y ESTADOS

### useOrganization Hook

```typescript
// hooks/useOrganization.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useOrganization() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const createOrganization = async (data: CreateOrganizationInput) => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to create organization');
      
      const org = await response.json();
      toast.success('Organization created successfully!');
      return org;
    } catch (error) {
      toast.error('Failed to create organization');
      throw error;
    } finally {
      setIsCreating(false);
    }
  };
  
  const updateOrganization = async (
    id: string, 
    data: UpdateOrganizationInput
  ) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/organizations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to update organization');
      
      toast.success('Organization updated successfully!');
      router.refresh();
    } catch (error) {
      toast.error('Failed to update organization');
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };
  
  const deleteOrganization = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/organizations/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete organization');
      
      toast.success('Organization deleted successfully');
      router.push('/settings/organization');
    } catch (error) {
      toast.error('Failed to delete organization');
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };
  
  return {
    createOrganization,
    updateOrganization,
    deleteOrganization,
    isCreating,
    isUpdating,
    isDeleting,
  };
}
```

---

### useOrganizationMembers Hook

```typescript
// hooks/useOrganizationMembers.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useOrganizationMembers(organizationId: string) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  
  const changeRole = async (userId: string, newRole: 'admin' | 'member') => {
    setIsUpdating(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/members/${userId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        }
      );
      
      if (!response.ok) throw new Error('Failed to change role');
      
      toast.success('Member role updated successfully');
      router.refresh();
    } catch (error) {
      toast.error('Failed to change member role');
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };
  
  const removeMember = async (userId: string) => {
    setIsRemoving(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/members/${userId}`,
        {
          method: 'DELETE',
        }
      );
      
      if (!response.ok) throw new Error('Failed to remove member');
      
      toast.success('Member removed successfully');
      router.refresh();
    } catch (error) {
      toast.error('Failed to remove member');
      throw error;
    } finally {
      setIsRemoving(false);
    }
  };
  
  return {
    changeRole,
    removeMember,
    isUpdating,
    isRemoving,
  };
}
```

---

### useInvitations Hook

```typescript
// hooks/useInvitations.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useInvitations() {
  const router = useRouter();
  const [isInviting, setIsInviting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  
  const inviteMember = async (
    organizationId: string,
    data: { email: string; role: 'member' | 'admin' }
  ) => {
    setIsInviting(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/invitations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      
      if (!response.ok) throw new Error('Failed to send invitation');
      
      toast.success(`Invitation sent to ${data.email}`);
      router.refresh();
    } catch (error) {
      toast.error('Failed to send invitation');
      throw error;
    } finally {
      setIsInviting(false);
    }
  };
  
  const acceptInvitation = async (token: string) => {
    setIsAccepting(true);
    try {
      const response = await fetch(`/api/invitations/accept/${token}`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to accept invitation');
      
      toast.success('Welcome to the organization!');
      return await response.json();
    } catch (error) {
      toast.error('Failed to accept invitation');
      throw error;
    } finally {
      setIsAccepting(false);
    }
  };
  
  const declineInvitation = async (token: string) => {
    try {
      const response = await fetch(`/api/invitations/decline/${token}`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to decline invitation');
      
      toast.success('Invitation declined');
    } catch (error) {
      toast.error('Failed to decline invitation');
      throw error;
    }
  };
  
  const cancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to cancel invitation');
      
      toast.success('Invitation canceled');
      router.refresh();
    } catch (error) {
      toast.error('Failed to cancel invitation');
      throw error;
    }
  };
  
  const resendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to resend invitation');
      
      toast.success('Invitation resent');
      router.refresh();
    } catch (error) {
      toast.error('Failed to resend invitation');
      throw error;
    }
  };
  
  return {
    inviteMember,
    acceptInvitation,
    declineInvitation,
    cancelInvitation,
    resendInvitation,
    isInviting,
    isAccepting,
  };
}
```

---

## 📡 INTEGRACIONES CON BACKEND

### API Endpoints Requeridos

```typescript
// types/api.ts

export interface API {
  // Organizations
  'POST /api/organizations': {
    body: CreateOrganizationInput;
    response: Organization & { stripe_checkout_url: string };
  };
  
  'GET /api/organizations/:id': {
    response: Organization;
  };
  
  'PUT /api/organizations/:id': {
    body: UpdateOrganizationInput;
    response: Organization;
  };
  
  'DELETE /api/organizations/:id': {
    response: { success: boolean };
  };
  
  // Members
  'GET /api/organizations/:id/members': {
    response: OrganizationMember[];
  };
  
  'PUT /api/organizations/:id/members/:userId': {
    body: { role: 'admin' | 'member' };
    response: OrganizationMember;
  };
  
  'DELETE /api/organizations/:id/members/:userId': {
    response: { success: boolean };
  };
  
  // Invitations
  'POST /api/organizations/:id/invitations': {
    body: { email: string; role: 'admin' | 'member' };
    response: Invitation;
  };
  
  'GET /api/organizations/:id/invitations': {
    response: Invitation[];
  };
  
  'POST /api/invitations/accept/:token': {
    response: { organization: Organization; member: OrganizationMember };
  };
  
  'POST /api/invitations/decline/:token': {
    response: { success: boolean };
  };
  
  'DELETE /api/invitations/:id': {
    response: { success: boolean };
  };
  
  'POST /api/invitations/:id/resend': {
    response: { success: boolean };
  };
}
```

---

## 🎨 DISEÑO Y ESTILOS

### Paleta de Colores para Estados

```typescript
// constants/organization-colors.ts

export const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  member: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;

export const PLAN_COLORS = {
  free: 'bg-gray-100 text-gray-800',
  starter: 'bg-green-100 text-green-800',
  pro: 'bg-blue-100 text-blue-800',
  enterprise: 'bg-purple-100 text-purple-800',
} as const;

export const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  suspended: 'bg-red-100 text-red-800',
  invited: 'bg-blue-100 text-blue-800',
} as const;
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Componentes Base (Semana 1)
- [ ] Crear estructura de carpetas
- [ ] Implementar tipos TypeScript
- [ ] Crear componentes reutilizables básicos:
  - [ ] RoleBadge
  - [ ] PlanBadge
  - [ ] LimitIndicator
  - [ ] EmptyState
- [ ] Implementar hooks:
  - [ ] useOrganization
  - [ ] useOrganizationMembers
  - [ ] useInvitations

### Fase 2: Vistas Principales (Semana 2)
- [ ] Vista: `/settings/organization` (overview)
- [ ] Vista: `/settings/organization/general`
- [ ] Vista: `/settings/organization/members`
- [ ] Vista: `/invite/[token]`
- [ ] Componente: CreateOrganizationModal
- [ ] Componente: InviteMemberModal

### Fase 3: Features Avanzadas (Semana 3)
- [ ] OrganizationSwitcher (header dropdown)
- [ ] Modals de confirmación:
  - [ ] DeleteOrganizationModal
  - [ ] RemoveMemberModal
  - [ ] ChangeRoleModal
- [ ] Vista: `/settings/organization/billing`
- [ ] Vista: `/settings/organization/branding`

### Fase 4: Polish y Testing (Semana 4)
- [ ] Animaciones y transiciones
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Responsive design
- [ ] Testing E2E
- [ ] Accessibility (a11y)

---

## 🚀 PRÓXIMOS PASOS

1. **Revisar y aprobar** esta documentación
2. **Crear tickets/issues** por componente
3. **Implementar en orden**:
   - Componentes base → Vistas simples → Features complejas
4. **Testing continuo** mientras se desarrolla
5. **Iteración** basada en feedback

---

**Estado:** Documentación de vistas y componentes completa ✅  
**Siguiente paso:** Comenzar implementación de componentes base