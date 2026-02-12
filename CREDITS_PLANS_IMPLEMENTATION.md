# 🎯 Implementación: Sistema de Créditos, Planes y Organizaciones

## 📋 Resumen Ejecutivo

Se implementó la integración completa del sistema de organizaciones, planes y créditos en el frontend, siguiendo los principios **KISS** (Keep It Simple, Stupid) y **YAGNI** (You Aren't Gonna Need It).

### ✅ Estado: FASE 1 COMPLETADA

**Componentes Críticos Implementados:**
- ✅ Hook de verificación de créditos
- ✅ Componente de protección de operaciones (CreditsGuard)
- ✅ Modal de upgrade dinámico
- ✅ Badge de créditos en sidebar
- ✅ Página de planes conectada con backend

---

## 🏗️ Arquitectura Implementada

### 1. Hook: `useCreditsVerification`
**Archivo:** `hooks/use-credits-verification.ts`

**Propósito:** Verificación simple de créditos antes de operaciones

**API:**
```typescript
const {
  canPerformOperation,  // (operation) => boolean
  getOperationCost,     // (operation) => number
  credits,              // CreditsInfo | null
  costs,                // CreditCosts | null
  isLoading             // boolean
} = useCreditsVerification();
```

**Principio KISS aplicado:**
- Solo verifica y retorna boolean
- Sin lógica compleja
- Carga costos una vez al montar
- ~40 líneas de código

---

### 2. Componente: `CreditsGuard`
**Archivo:** `components/credits/CreditsGuard.tsx`

**Propósito:** Proteger operaciones que consumen créditos

**Uso:**
```tsx
<CreditsGuard operation="complete">
  <button onClick={processRFX}>Procesar RFX</button>
</CreditsGuard>
```

**Comportamiento:**
- Si hay créditos → Muestra children
- Si NO hay créditos → Muestra `LowCreditsAlert` + botón "Ver Planes"
- Loading state mientras carga

**Principio KISS aplicado:**
- Lógica simple: if/else
- Sin estado complejo
- Props mínimos necesarios
- ~50 líneas de código

---

### 3. Componente: `CreditsBadge`
**Archivo:** `components/credits/CreditsBadge.tsx`

**Propósito:** Mostrar créditos disponibles en sidebar

**Características:**
- Muestra número de créditos disponibles
- Cambia color según porcentaje:
  - Verde: ≥50%
  - Amarillo: 20-49%
  - Rojo: <20%
- Loading state con spinner
- Se oculta cuando sidebar está colapsado

**Principio KISS aplicado:**
- Solo muestra información
- Sin interacciones complejas
- ~40 líneas de código

**Integración:**
```tsx
// components/layout/AppSidebar.tsx
<div className="mb-4 px-2 group-data-[collapsible=icon]:hidden">
  <CreditsBadge />
</div>
```

---

### 4. Componente: `UpgradeModal`
**Archivo:** `components/organization/UpgradeModal.tsx`

**Propósito:** Modal dinámico para mostrar información de upgrade

**Características:**
- Carga datos desde `GET /api/organization/upgrade-info`
- Muestra comparación: Plan Actual vs Plan Recomendado
- Lista beneficios del upgrade
- Botón "Actualizar Ahora" → Redirige a checkout
- Manejo de errores con mensajes claros

**Props:**
```typescript
interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'credits' | 'rfx_limit' | 'users_limit';
  currentCredits?: number;
  requiredCredits?: number;
}
```

**Mensajes contextuales:**
- `credits`: "Necesitas X créditos pero solo tienes Y disponibles"
- `rfx_limit`: "Has alcanzado el límite de RFX de tu plan este mes"
- `users_limit`: "Has alcanzado el límite de usuarios de tu plan"

**Principio KISS aplicado:**
- Carga datos solo cuando se abre
- Muestra loading/error/success states
- Sin lógica de negocio compleja
- ~150 líneas de código

---

### 5. Página: `PlansPage` (Actualizada)
**Archivo:** `app/(workspace)/plans/page.tsx`

**Cambios:**
- ✅ Conectada con `useOrganization()` para obtener plan actual
- ✅ Usa `organization.plan.tier` en lugar de mock
- ✅ Loading state mientras carga organización
- ✅ Modal de upgrade integrado
- ✅ Imports corregidos (Separator, ArrowRight, CreditCard)

**Antes:**
```typescript
const currentPlan = 'pro'; // Hardcoded
const isInOrganization = false; // Hardcoded
```

**Ahora:**
```typescript
const { organization, isLoading } = useOrganization();
const currentPlan = organization?.plan?.tier || 'free';
const isInOrganization = !!organization;
```

**Principio KISS aplicado:**
- Modificar antes que crear
- Reutiliza componentes existentes
- Solo cambia lo necesario

---

## 📦 Tipos Actualizados

### `types/organization.ts`

**Tipo agregado:**
```typescript
export interface UpgradeInfo {
  current_plan: {
    tier: PlanTier;
    name: string;
    credits_per_month: number;
    max_rfx_per_month: number | null;
    max_users: number | null;
  };
  next_plan: {
    tier: PlanTier;
    name: string;
    credits_per_month: number;
    max_rfx_per_month: number | null;
    max_users: number | null;
  } | null;
  benefits: string[];
}
```

**Principio aplicado:**
- Única fuente de verdad
- Tipo compartido entre `api-organizations.ts` y componentes
- Eliminado tipo duplicado

---

## 🔄 Flujos Implementados

### Flujo 1: Verificación de Créditos
```
Usuario intenta acción → CreditsGuard verifica
                       ↓
              ¿Hay créditos?
              ↙          ↘
            SÍ           NO
            ↓            ↓
    Muestra children   LowCreditsAlert
                       + Botón "Ver Planes"
                       ↓
                   UpgradeModal
```

### Flujo 2: Visualización de Planes
```
Usuario → /plans → PlansPage
                   ↓
         useOrganization() carga datos
                   ↓
         Muestra plan actual desde backend
                   ↓
         Compara con planes disponibles
                   ↓
         Botón "Upgrade" → UpgradeModal
```

### Flujo 3: Indicador de Créditos
```
Sidebar monta → CreditsBadge
                ↓
        useCredits() obtiene datos
                ↓
        Muestra créditos disponibles
                ↓
        Color según porcentaje
```

---

## 📊 Integración con Backend

### Endpoints Utilizados

| Endpoint | Uso | Componente |
|----------|-----|------------|
| `GET /api/credits/info` | Obtener créditos actuales | `CreditsContext` |
| `GET /api/credits/costs` | Obtener costos por operación | `useCreditsVerification` |
| `GET /api/organization/current` | Obtener organización actual | `OrganizationContext` |
| `GET /api/organization/upgrade-info` | Info de upgrade | `UpgradeModal` |

### Estructura de Datos

**CreditsInfo:**
```json
{
  "credits_total": 1000,
  "credits_used": 250,
  "credits_available": 750,
  "credits_percentage": 75.0,
  "reset_date": "2024-03-01T00:00:00Z",
  "plan_tier": "pro"
}
```

**CreditCosts:**
```json
{
  "complete": 10,
  "extraction": 5,
  "generation": 5,
  "chat_message": 1,
  "regeneration": 5
}
```

**Organization:**
```json
{
  "id": "...",
  "name": "Mi Organización",
  "slug": "mi-organizacion",
  "plan": {
    "tier": "pro",
    "name": "Pro",
    "credits_per_month": 1000,
    "max_rfx_per_month": 100,
    "max_users": 10
  },
  "usage": { ... }
}
```

---

## 🎨 Componentes Visuales

### CreditsBadge
```
┌─────────────────────────┐
│ 💎 750 créditos         │  ← Verde (≥50%)
└─────────────────────────┘

┌─────────────────────────┐
│ 💎 350 créditos         │  ← Amarillo (20-49%)
└─────────────────────────┘

┌─────────────────────────┐
│ 💎 50 créditos          │  ← Rojo (<20%)
└─────────────────────────┘
```

### CreditsGuard (Sin créditos)
```
┌──────────────────────────────────────┐
│ ⚠️ Créditos Insuficientes            │
│                                      │
│ Necesitas: 10 créditos               │
│ Disponibles: 5 créditos              │
│                                      │
│ [ Ver Planes ]                       │
└──────────────────────────────────────┘
```

### UpgradeModal
```
┌────────────────────────────────────────────┐
│ Actualizar Plan                      [X]   │
├────────────────────────────────────────────┤
│ ⚠️ Necesitas 10 créditos pero solo         │
│    tienes 5 disponibles.                   │
│                                            │
│ ┌──────────────┐  ┌──────────────────┐    │
│ │ Plan Actual  │  │ Plan Recomendado │    │
│ │ Starter      │  │ Pro              │    │
│ │ 500 créditos │  │ 1000 créditos    │    │
│ └──────────────┘  └──────────────────┘    │
│                                            │
│ Qué obtendrás:                             │
│ ✓ 500 créditos adicionales                 │
│ ✓ 50 RFX más por mes                       │
│ ✓ 5 usuarios adicionales                   │
│                                            │
│ [ Tal vez después ]  [ Actualizar Ahora →] │
└────────────────────────────────────────────┘
```

---

## 🚀 Próximos Pasos (FASE 2)

### Integración en Flujos Críticos

**1. Procesamiento de RFX**
```typescript
// components/file-uploader.tsx (o similar)
const { canPerformOperation } = useCreditsVerification();

const handleUpload = async (file: File) => {
  // Verificar créditos ANTES de procesar
  if (!canPerformOperation('complete')) {
    setShowUpgradeModal(true);
    return;
  }
  
  // Procesar RFX
  await api.processRFX(file);
  
  // Auto-refresh créditos
  await refreshCredits();
};
```

**2. Generación de Propuesta**
```typescript
// components/budget/tabs/ProposalTab.tsx
const handleGenerate = async () => {
  // Verificar si tiene regeneraciones gratis
  const regenInfo = await getRegenerationInfo(rfxId);
  
  if (regenInfo.has_free_regeneration) {
    // Gratis - no verificar créditos
    await generateProposal();
  } else {
    // Verificar créditos
    if (!canPerformOperation('regeneration')) {
      setShowUpgradeModal(true);
      return;
    }
    await generateProposal();
  }
  
  await refreshCredits();
};
```

**3. Chat con RFX**
```typescript
// Donde se maneje el chat
const handleSendMessage = async (message: string) => {
  if (!canPerformOperation('chat_message')) {
    setShowUpgradeModal(true);
    return;
  }
  
  await sendChatMessage(message);
  await refreshCredits();
};
```

---

## 📝 Guía de Uso para Desarrolladores

### Proteger una Operación

```tsx
import { CreditsGuard } from '@/components/credits/CreditsGuard';

function MyComponent() {
  return (
    <CreditsGuard operation="complete">
      <button onClick={handleAction}>
        Procesar RFX
      </button>
    </CreditsGuard>
  );
}
```

### Verificar Créditos Programáticamente

```tsx
import { useCreditsVerification } from '@/hooks/use-credits-verification';

function MyComponent() {
  const { canPerformOperation, getOperationCost } = useCreditsVerification();
  
  const handleAction = () => {
    if (!canPerformOperation('complete')) {
      alert(`Necesitas ${getOperationCost('complete')} créditos`);
      return;
    }
    
    // Ejecutar acción
  };
}
```

### Mostrar Modal de Upgrade

```tsx
import { UpgradeModal } from '@/components/organization/UpgradeModal';

function MyComponent() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowUpgrade(true)}>
        Upgrade
      </button>
      
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason="credits"
        currentCredits={50}
        requiredCredits={100}
      />
    </>
  );
}
```

---

## 🎯 Principios Aplicados

### KISS (Keep It Simple, Stupid)
- ✅ Componentes pequeños con una responsabilidad
- ✅ Lógica directa sin abstracciones innecesarias
- ✅ Props mínimos necesarios
- ✅ Sin over-engineering

### YAGNI (You Aren't Gonna Need It)
- ✅ Solo funcionalidad necesaria ahora
- ✅ Sin preparación para casos futuros hipotéticos
- ✅ Sin configuraciones que nadie usa

### DRY (Don't Repeat Yourself)
- ✅ Hook reutilizable `useCreditsVerification`
- ✅ Componente reutilizable `CreditsGuard`
- ✅ Tipo compartido `UpgradeInfo`

### Modificar Antes que Crear
- ✅ PlansPage actualizado, no reescrito
- ✅ Contextos existentes reutilizados
- ✅ Componentes UI de shadcn/ui reutilizados

---

## 📁 Archivos Creados/Modificados

### Nuevos Archivos
```
hooks/
  └── use-credits-verification.ts       (~40 líneas)

components/
  ├── credits/
  │   ├── CreditsGuard.tsx              (~50 líneas)
  │   └── CreditsBadge.tsx              (~40 líneas)
  └── organization/
      └── UpgradeModal.tsx              (~150 líneas)
```

### Archivos Modificados
```
types/
  └── organization.ts                   (+ tipo UpgradeInfo)

lib/
  └── api-organizations.ts              (+ import UpgradeInfo)

app/(workspace)/
  └── plans/page.tsx                    (conectado con backend)

components/layout/
  └── AppSidebar.tsx                    (+ CreditsBadge)
```

**Total:** ~280 líneas de código nuevo

---

## ✅ Checklist de Implementación

### FASE 1 (COMPLETADA) ✅
- [x] Hook `useCreditsVerification`
- [x] Componente `CreditsGuard`
- [x] Componente `CreditsBadge`
- [x] Componente `UpgradeModal`
- [x] Tipo `UpgradeInfo`
- [x] PlansPage conectado con backend
- [x] CreditsBadge integrado en sidebar

### FASE 2 (PENDIENTE)
- [ ] Integrar verificación en procesamiento de RFX
- [ ] Integrar verificación en generación de propuesta
- [ ] Integrar verificación en chat
- [ ] Verificar regeneraciones gratuitas
- [ ] Auto-refresh de créditos después de operaciones
- [ ] Testing end-to-end

---

## 🧪 Testing

### Manual Testing Checklist

**CreditsBadge:**
- [ ] Se muestra en sidebar
- [ ] Cambia color según porcentaje
- [ ] Se oculta cuando sidebar está colapsado
- [ ] Muestra loading state

**CreditsGuard:**
- [ ] Muestra children cuando hay créditos
- [ ] Muestra alerta cuando no hay créditos
- [ ] Botón "Ver Planes" abre modal

**UpgradeModal:**
- [ ] Carga datos del backend
- [ ] Muestra comparación de planes
- [ ] Lista beneficios
- [ ] Botón "Actualizar Ahora" redirige a checkout
- [ ] Maneja errores correctamente

**PlansPage:**
- [ ] Muestra plan actual desde backend
- [ ] Compara con planes disponibles
- [ ] Botones de upgrade funcionan

---

## 🚨 Notas Importantes

1. **Auto-refresh de créditos:** Implementar en FASE 2 después de cada operación que consuma créditos

2. **Regeneraciones gratuitas:** Verificar con `GET /api/credits/regenerations/{rfx_id}` antes de consumir créditos

3. **Manejo de errores 402/403:**
   - 402: Créditos insuficientes → Mostrar `UpgradeModal`
   - 403: Límite de plan excedido → Mostrar `UpgradeModal` con reason específico

4. **Checkout:** El botón "Actualizar Ahora" redirige a `/checkout?plan={tier}` - asegurar que esta ruta existe

5. **Loading states:** Todos los componentes manejan estados de carga correctamente

---

## 📚 Referencias

- **Documentación Backend:** `API_ORGANIZATIONS_FRONTEND_GUIDE.md`
- **Endpoints de Créditos:** `CREDITS-ENDPOINTS.MD`
- **Tipos de Organización:** `types/organization.ts`
- **Constantes de Planes:** `constants/organization.ts`

---

**Fecha de Implementación:** Febrero 2026  
**Versión:** 1.0  
**Estado:** FASE 1 COMPLETADA ✅
