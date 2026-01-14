# 📦 Component Library Documentation

**Última actualización:** 13 de enero, 2026

---

## 🎯 Arquitectura de Componentes

```
components/
├── ui/                    # Primitives de shadcn/ui (54 componentes)
│   ├── button.tsx        # ✅ EXTENDIDO con variants brand/accent
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
│
├── common/               # ✅ NUEVO - Componentes reutilizables
│   ├── LoadingSpinner.tsx
│   ├── EmptyState.tsx
│   ├── PageHeader.tsx
│   └── index.ts
│
├── layout/               # TODO - Componentes de layout
│   ├── PublicHeader.tsx
│   ├── WorkspaceHeader.tsx
│   └── Footer.tsx
│
└── features/             # TODO - Componentes por feature
    ├── rfx/
    ├── budget/
    ├── organization/
    └── credits/
```

---

## 🎨 Componentes Base (ui/)

### Button - EXTENDIDO ✅

Componente base de shadcn/ui extendido con variants adicionales.

**Nuevos Variants:**

```tsx
import { Button } from "@/components/ui/button"

// Botón negro (CTA principal)
<Button variant="brand">
  Acción Principal
</Button>

// Botón outline negro
<Button variant="brand-outline">
  Acción Secundaria
</Button>

// Botón con color de marca (púrpura)
<Button variant="accent">
  Destacar
</Button>
```

**Variants Existentes:**
- `default` - Púrpura (primary)
- `destructive` - Rojo
- `outline` - Outline con hover
- `secondary` - Gris claro
- `ghost` - Minimal
- `link` - Texto con underline

**Sizes:**
- `sm` - Pequeño (h-9)
- `default` - Normal (h-10)
- `lg` - Grande (h-11)
- `icon` - Cuadrado (10x10)

**Ejemplo Completo:**

```tsx
<Button variant="brand" size="lg">
  Sube tu primera solicitud gratis
  <ArrowRight className="ml-2" />
</Button>
```

---

## 🔄 Componentes Comunes (common/)

### LoadingSpinner ✅

Spinner de carga reutilizable con múltiples tamaños y variantes.

**Props:**
```typescript
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  text?: string
  fullScreen?: boolean
  className?: string
}
```

**Uso:**

```tsx
import { LoadingSpinner, LoadingSpinnerInline } from "@/components/common"

// Spinner con texto
<LoadingSpinner 
  size="md" 
  text="Cargando datos..." 
/>

// Spinner full screen
<LoadingSpinner 
  fullScreen 
  text="Procesando documento..." 
/>

// Spinner inline (sin container)
<LoadingSpinnerInline size="sm" />
```

**Reemplaza:**
```tsx
// ❌ ANTES - Código repetido
<div className="flex items-center justify-center py-12">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
</div>

// ✅ AHORA - Componente reutilizable
<LoadingSpinner />
```

---

### EmptyState ✅

Estado vacío consistente con icono, título, descripción y acción opcional.

**Props:**
```typescript
interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  size?: "sm" | "md" | "lg"
  className?: string
}
```

**Uso:**

```tsx
import { EmptyState } from "@/components/common"
import { FileX } from "lucide-react"

<EmptyState
  icon={FileX}
  title="No hay documentos"
  description="Sube tu primer documento RFX para comenzar"
  action={{
    label: "Subir documento",
    onClick: () => router.push("/upload")
  }}
/>
```

**Reemplaza:**
```tsx
// ❌ ANTES - Código repetido
<div className="flex flex-col items-center justify-center py-12 text-center">
  <FileX className="h-12 w-12 text-gray-400 mb-4" />
  <p className="text-gray-600 font-medium">No hay datos</p>
  <p className="text-gray-500 text-sm">Descripción</p>
</div>

// ✅ AHORA - Componente reutilizable
<EmptyState
  icon={FileX}
  title="No hay datos"
  description="Descripción"
/>
```

---

### PageHeader ✅

Header de página consistente con título, descripción, icono y acciones.

**Props:**
```typescript
interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  actions?: React.ReactNode
  className?: string
}
```

**Uso:**

```tsx
import { PageHeader, PageHeaderCompact } from "@/components/common"
import { FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

// Header completo con icono
<PageHeader
  icon={FileText}
  title="Historial de RFX"
  description="Todos tus documentos procesados"
  actions={
    <Button variant="brand">
      <Plus className="mr-2" />
      Nuevo RFX
    </Button>
  }
/>

// Header compacto (sin icono)
<PageHeaderCompact
  title="Configuración"
  description="Administra tus preferencias"
  actions={
    <Button variant="outline">Guardar</Button>
  }
/>
```

**Reemplaza:**
```tsx
// ❌ ANTES - Código repetido
<div className="flex items-center justify-between pb-6 border-b">
  <div>
    <h1 className="text-3xl font-bold text-gray-900">Título</h1>
    <p className="text-gray-600">Descripción</p>
  </div>
  <Button>Acción</Button>
</div>

// ✅ AHORA - Componente reutilizable
<PageHeader
  title="Título"
  description="Descripción"
  actions={<Button>Acción</Button>}
/>
```

---

## 🔄 Migración de Componentes Existentes

### Paso 1: Identificar Patrones Repetidos

Usa el script de análisis:

```bash
node scripts/analyze-hardcoded-styles.js
```

Esto genera `HARDCODED_STYLES_REPORT.md` con archivos prioritarios.

### Paso 2: Reemplazar Componentes Duplicados

#### brand-button.tsx → ui/button.tsx

```tsx
// ❌ ANTES
import { BrandButton } from "@/components/brand-button"

<BrandButton variant="primary" size="lg">
  Acción
</BrandButton>

// ✅ AHORA
import { Button } from "@/components/ui/button"

<Button variant="brand" size="lg">
  Acción
</Button>
```

#### Loading States

```tsx
// ❌ ANTES
<div className="flex items-center justify-center py-12">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  <p className="text-gray-600 ml-4">Loading...</p>
</div>

// ✅ AHORA
import { LoadingSpinner } from "@/components/common"

<LoadingSpinner text="Loading..." />
```

#### Empty States

```tsx
// ❌ ANTES
<div className="text-center py-12">
  <FileX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
  <p className="text-gray-600">No hay datos</p>
</div>

// ✅ AHORA
import { EmptyState } from "@/components/common"

<EmptyState
  icon={FileX}
  title="No hay datos"
/>
```

### Paso 3: Usar Tokens Semánticos

```tsx
// ❌ ANTES - Colores hardcoded
<div className="bg-black text-white">
<p className="text-gray-600">
<div className="border-gray-200">

// ✅ AHORA - Tokens semánticos
<div className="bg-foreground text-background">
<p className="text-muted-foreground">
<div className="border">
```

---

## 📋 Checklist de Migración

Para cada archivo que migres:

- [ ] Reemplazar `brand-button` con `ui/button` + variant
- [ ] Reemplazar loading states con `LoadingSpinner`
- [ ] Reemplazar empty states con `EmptyState`
- [ ] Reemplazar headers con `PageHeader`
- [ ] Cambiar colores hardcoded por tokens semánticos
- [ ] Eliminar estilos inline repetidos
- [ ] Usar utilidades CSS custom cuando aplique
- [ ] Verificar que todo funciona correctamente

---

## 🎯 Próximos Componentes a Crear

### Alta Prioridad
- [ ] `Section` - Contenedor de sección con spacing consistente
- [ ] `ErrorBoundary` - Manejo de errores consistente
- [ ] `ConfirmDialog` - Diálogo de confirmación reutilizable

### Media Prioridad
- [ ] `DataTable` - Tabla con sorting, filtering, pagination
- [ ] `StatusBadge` - Badge con estados predefinidos
- [ ] `FileUploadZone` - Zona de drag & drop consistente

### Baja Prioridad
- [ ] `Timeline` - Timeline de eventos
- [ ] `StatCard` - Card de estadísticas
- [ ] `ProgressBar` - Barra de progreso con estados

---

## 📚 Referencias

- [STYLE_GUIDE.md](./STYLE_GUIDE.md) - Guía de estilos y tokens
- [FRONTEND_AUDIT_REPORT.md](./FRONTEND_AUDIT_REPORT.md) - Auditoría completa
- [shadcn/ui Docs](https://ui.shadcn.com) - Documentación de componentes base

---

**Última actualización:** 13 de enero, 2026  
**Próxima revisión:** Después de Fase 3
