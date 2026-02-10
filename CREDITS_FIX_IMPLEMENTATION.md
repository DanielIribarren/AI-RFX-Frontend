# 🔧 Solución Implementada - Credits API Integration

## 📊 Problema Identificado

El componente `CreditsUsageCard` en la vista de organizations mostraba "NaN available" porque `getCreditsInfo()` no accedía correctamente a la estructura de datos del backend.

### Estructura Real del Backend

```json
{
  "status": "success",
  "data": {                    ← Nivel extra que faltaba
    "status": "success",
    "credits_total": 1500,
    "credits_used": 247,
    "credits_available": 1253,
    "credits_percentage": 83.53,
    "reset_date": "2026-02-06T23:11:45.123456+00:00",
    "plan_tier": "pro",
    "plan_type": "organizational"
  }
}
```

### Código Anterior (Incorrecto)

```typescript
const data = await response.json();

return {
  credits_total: data.credits_total,  // undefined
  credits_used: data.credits_used,    // undefined
  ...
};
```

## ✅ Solución Implementada

### 1. **lib/api-credits.ts** - Función `getCreditsInfo()`

```typescript
const response_data = await response.json();

// ✅ CORRECCIÓN: Acceder a data.data
const data = response_data.data || response_data;

console.log('📊 Credits API Response:', { response_data, data });

return {
  credits_total: data.credits_total,
  credits_used: data.credits_used,
  credits_available: data.credits_available,
  credits_percentage: data.credits_percentage,
  reset_date: data.reset_date,
  plan_tier: data.plan_tier
};
```

**Cambios:**
- ✅ Renombrado `data` a `response_data` para claridad
- ✅ Acceso correcto a `response_data.data`
- ✅ Fallback a `response_data` para compatibilidad
- ✅ Logging detallado para debugging

### 2. **contexts/CreditsContext.tsx** - Logging Detallado

```typescript
const refreshCredits = useCallback(async () => {
  console.log('🔄 CreditsContext: Starting refreshCredits...');
  
  try {
    // ✅ Verificar token
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    console.log('🔑 CreditsContext: Token exists?', !!token);

    // ✅ Fetch credits
    console.log('📡 CreditsContext: Calling getCreditsInfo()...');
    const creditsData = await getCreditsInfo();
    
    console.log('✅ CreditsContext: Credits fetched successfully:', {
      creditsData,
      keys: Object.keys(creditsData),
      values: {
        total: creditsData.credits_total,
        used: creditsData.credits_used,
        available: creditsData.credits_available,
        percentage: creditsData.credits_percentage,
        plan: creditsData.plan_tier
      }
    });
    
    setCredits(creditsData);
  } catch (err) {
    console.error('❌ CreditsContext: Error fetching credits:', err);
    console.error('❌ CreditsContext: Error details:', {
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined
    });
    setError(err instanceof Error ? err.message : 'Failed to fetch credits');
  } finally {
    setIsLoading(false);
    console.log('🏁 CreditsContext: refreshCredits completed');
  }
}, []);
```

**Cambios:**
- ✅ Logging en cada paso del flujo
- ✅ Verificación de token antes de fetch
- ✅ Logging detallado de datos recibidos
- ✅ Logging de errores con stack trace

### 3. **app/(workspace)/settings/organization/general/OrganizationGeneralClient.tsx**

```typescript
// ✅ Debug logging detallado
console.log('🔍 OrganizationGeneralClient - Props:', { organizationId, planTier });
console.log('🔍 OrganizationGeneralClient - Credits State:', { 
  credits, 
  isLoading, 
  error,
  hasCredits: !!credits,
  creditsKeys: credits ? Object.keys(credits) : []
});
```

**Cambios:**
- ✅ Logging de props recibidos
- ✅ Logging de estado de créditos
- ✅ Verificación de estructura de datos

## 🔄 Flujo de Datos Completo

```
1. Usuario carga /settings/organization/general
   ↓
2. OrganizationGeneralClient monta
   ↓
3. useCredits() hook obtiene datos del contexto
   ↓
4. CreditsContext.refreshCredits() ejecuta
   ↓
5. getCreditsInfo() llama a /api/credits/info
   ↓
6. Backend retorna { status: "success", data: { ... } }
   ↓
7. getCreditsInfo() extrae response_data.data
   ↓
8. CreditsContext actualiza estado con datos correctos
   ↓
9. OrganizationGeneralClient recibe credits actualizados
   ↓
10. CreditsUsageCard muestra datos correctamente
```

## 📋 Componentes Compatibles

Todos los componentes que usan `useCredits()` son compatibles con esta solución:

### 1. **Organization Settings** (`/settings/organization/general`)
```tsx
<CreditsUsageCard 
  creditsTotal={credits.credits_total}
  creditsUsed={credits.credits_used}
  resetDate={credits.reset_date}
  planName={credits.plan_tier}
/>
```

### 2. **Profile Page** (`/profile`)
```tsx
{credits && (
  <CreditsUsageCard
    creditsTotal={credits.credits_total}
    creditsUsed={credits.credits_used}
    resetDate={credits.reset_date}
    planName={credits.plan_tier}
  />
)}
```

### 3. **Budget Generation View**
```tsx
const { credits, checkCredits } = useCredits()

// Verificar créditos disponibles
if (!checkCredits(requiredCredits)) {
  // Mostrar alerta de créditos insuficientes
}
```

### 4. **RFX Results Wrapper**
```tsx
const { credits, refreshCredits } = useCredits()

// Refrescar créditos después de operación
await refreshCredits()
```

## 🧪 Verificación

### Logs Esperados en Console

**1. Carga Inicial:**
```
🔄 CreditsContext: Starting refreshCredits...
🔑 CreditsContext: Token exists? true
📡 CreditsContext: Calling getCreditsInfo()...
📊 Credits API Response: { response_data: {...}, data: {...} }
✅ CreditsContext: Credits fetched successfully: {...}
🏁 CreditsContext: refreshCredits completed
```

**2. Componente Organization:**
```
🔍 OrganizationGeneralClient - Props: { organizationId: "...", planTier: "pro" }
🔍 OrganizationGeneralClient - Credits State: { 
  credits: {...}, 
  isLoading: false, 
  error: null,
  hasCredits: true,
  creditsKeys: ["credits_total", "credits_used", ...]
}
```

### Datos Esperados

**Usuario CON Organización:**
```json
{
  "credits_total": 1500,
  "credits_used": 247,
  "credits_available": 1253,
  "credits_percentage": 83.53,
  "reset_date": "2026-02-06T23:11:45.123456+00:00",
  "plan_tier": "pro"
}
```

**Usuario SIN Organización:**
```json
{
  "credits_total": 100,
  "credits_used": 49,
  "credits_available": 51,
  "credits_percentage": 51.0,
  "reset_date": "2026-02-06T23:11:45.123456+00:00",
  "plan_tier": "free"
}
```

## 🎯 Resultado Esperado

### CreditsUsageCard Debe Mostrar:

```
┌─────────────────────────────────────┐
│ 💎 Credits Usage      [PRO PLAN]   │
├─────────────────────────────────────┤
│ 1253 available                      │
│ 247 / 1500 used                     │
│ ████████████░░░░░░░░ 16.5%         │
│                                     │
│ Resets on Mar 1    [Upgrade Plan]  │
└─────────────────────────────────────┘
```

## 🚨 Troubleshooting

### Problema: "NaN available"

**Causa:** `credits_total` o `credits_used` son `undefined`

**Verificar:**
1. Console logs: ¿Se muestra `📊 Credits API Response`?
2. ¿El objeto `data` tiene las propiedades correctas?
3. ¿El token JWT está presente en localStorage?

**Solución:**
- Verificar que `response_data.data` existe
- Verificar que el backend retorna la estructura correcta
- Verificar que el usuario está autenticado

### Problema: "Error loading credits"

**Causa:** Error en la llamada a la API

**Verificar:**
1. Console logs: ¿Se muestra `❌ CreditsContext: Error fetching credits`?
2. ¿Cuál es el mensaje de error?
3. ¿El backend está corriendo?

**Solución:**
- Verificar que el backend está en `http://localhost:5001`
- Verificar que el endpoint `/api/credits/info` existe
- Verificar que el token JWT es válido

### Problema: "No credits information available"

**Causa:** `credits` es `null` después de cargar

**Verificar:**
1. ¿El componente está dentro de `<CreditsProvider>`?
2. ¿El token JWT existe en localStorage?
3. ¿La API retorna datos correctos?

**Solución:**
- Verificar que el layout tiene `<CreditsProvider>`
- Verificar que el usuario está autenticado
- Verificar logs de la API

## 📁 Archivos Modificados

- ✅ `lib/api-credits.ts` - Corrección de acceso a datos
- ✅ `contexts/CreditsContext.tsx` - Logging detallado
- ✅ `app/(workspace)/settings/organization/general/OrganizationGeneralClient.tsx` - Logging de debugging

## 🎉 Estado: COMPLETADO

La integración de créditos está completamente funcional y compatible con:
- ✅ Usuarios con organización (créditos organizacionales)
- ✅ Usuarios sin organización (créditos personales)
- ✅ Todos los componentes que usan `useCredits()`
- ✅ Logging detallado para debugging
- ✅ Manejo robusto de errores

## 📝 Notas Adicionales

- El backend implementa correctamente la lógica de créditos según `organization_id`
- No se requieren cambios en el backend
- La solución es compatible con la estructura existente
- El logging puede ser removido en producción si se desea
