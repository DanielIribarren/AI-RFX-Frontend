# AI-RFX Branding System

Sistema de diseño implementado con **blanco/negro + índigo** para una estética premium y profesional.

---

## 🎨 Paleta de Colores

### Neutrales (Base)
```css
--brand-ink: #0B0B0F        /* Textos fuertes, botones primarios */
--brand-graphite: #111827   /* Títulos alternos */
--brand-slate: #475569      /* Texto secundario */
--brand-bg: #FAFAFA         /* Fondo principal */
--brand-surface: #FFFFFF    /* Cards y paneles */
--brand-border: rgba(2, 6, 23, 0.10) /* Bordes finos */
```

### Acento (Brand Indigo)
```css
--indigo-600: #4F46E5      /* Primary */
--indigo-700: #4338CA      /* Hover */
--indigo-glow: rgba(79, 70, 229, 0.25)  /* Glow effect */
--indigo-soft: rgba(79, 70, 229, 0.10)  /* Soft fill */
```

### Estados
```css
--brand-success: #16A34A   /* Checks/validaciones */
--brand-warning: #F59E0B   /* Requiere revisión */
--brand-error: #EF4444     /* Fallos críticos */
```

---

## 🧩 Componentes Base

### BrandButton
```tsx
<BrandButton variant="primary" size="lg">
  Acción Principal
</BrandButton>
```

**Variantes:**
- `primary` - Negro premium (acciones principales)
- `secondary` - Outline negro (acciones secundarias)
- `accent` - Índigo con glow (acciones AI)

**Tamaños:** `sm`, `md`, `lg`

### BrandCard
```tsx
<BrandCard elevated glass>
  Contenido
</BrandCard>
```

**Props:**
- `elevated` - Sombra fuerte + hover effect
- `glass` - Glass effect con backdrop blur

### BrandBadge
```tsx
<BrandBadge variant="indigo">
  Nuevo
</BrandBadge>
```

**Variantes:** `indigo`, `success`, `warning`, `error`, `neutral`

### BrandBackground
```tsx
<BrandBackground />
```

Fondo decorativo con:
- Blobs índigo difuminados (3)
- Grid tenue (6% opacidad)
- Noise overlay (7% opacidad)

---

## 📐 Sombras

```css
shadow-soft: 0 12px 40px rgba(15, 23, 42, 0.08)
shadow-strong: 0 18px 60px rgba(15, 23, 42, 0.12)
shadow-brand: 0 0 0 3px rgba(79, 70, 229, 0.25), 0 10px 15px -3px rgba(0, 0, 0, 0.1)
```

---

## 🎯 Reglas de Uso

### 1. Índigo como Firma
- **Solo para:** Badges "Nuevo", acciones AI, features destacados
- **Máximo:** 1 elemento índigo por sección
- **Nunca:** Fondos completos o elementos decorativos

### 2. Botones
- **Primary (Negro):** "Empezar gratis", "Crear propuesta", "Generar APU"
- **Secondary (Outline):** "Ver demo", "Cómo funciona"
- **Accent (Índigo):** "Generar con IA", "Nuevo APU", "Autocompletar"

### 3. Cards
- Siempre `rounded-2xl`
- Glass effect por defecto (`bg-white/70 backdrop-blur-md`)
- Borde sutil (`border-brand-border`)
- Sombra suave (`shadow-soft`)

### 4. Tipografía
- **Headings:** `font-semibold tracking-tight`
- **Body:** `text-brand-slate leading-7`
- **Títulos:** `text-brand-ink`

---

## ✅ Checklist de Consistencia

- [ ] Solo 1 acento: índigo (no azul/cyan adicional)
- [ ] CTA principal siempre negro
- [ ] Badges y "AI features" en índigo
- [ ] Cards con rounded-2xl + borde sutil + sombra suave
- [ ] Fondo con blobs índigo + grid + noise
- [ ] Glass effect en cards (`bg-white/70 backdrop-blur-md`)
- [ ] Header sticky con glass effect

---

## 📦 Archivos del Sistema

### Componentes
- `components/brand-button.tsx` - Botones con variantes
- `components/brand-card.tsx` - Cards con glass effect
- `components/brand-badge.tsx` - Badges con variantes
- `components/brand-background.tsx` - Fondo decorativo

### Configuración
- `tailwind.config.ts` - Tokens de diseño
- `app/globals.css` - Variables CSS

### Páginas Actualizadas
- `components/landing-page.tsx` - Landing con branding
- `components/public-header.tsx` - Header con glass effect
- `components/how-it-works.tsx` - Sección con branding

---

## 🚀 Uso Rápido

```tsx
import { BrandButton } from '@/components/brand-button'
import { BrandCard } from '@/components/brand-card'
import { BrandBadge } from '@/components/brand-badge'
import { BrandBackground } from '@/components/brand-background'

export function MyPage() {
  return (
    <div className="min-h-screen relative">
      <BrandBackground />
      
      <BrandCard elevated className="p-8">
        <BrandBadge variant="indigo">Nuevo</BrandBadge>
        <h1 className="text-3xl font-semibold text-brand-ink">
          Título
        </h1>
        <p className="text-brand-slate">
          Descripción
        </p>
        <BrandButton variant="accent">
          Generar con IA
        </BrandButton>
      </BrandCard>
    </div>
  )
}
```

---

## 🎨 Ejemplos Visuales

### Header
- Sticky + glass effect
- Logo negro + badge índigo "Nuevo APU"
- Botones: secondary (login) + primary (signup)

### Hero
- Badge índigo con Sparkles
- Título grande en brand-ink
- Descripción en brand-slate
- CTA primary negro + secondary outline

### Cards
- Glass effect (bg-white/70)
- Backdrop blur
- Sombra soft
- Hover: shadow-strong

### Acciones AI
- Botón accent (índigo)
- Glow effect
- Icono Sparkles

---

## 📝 Notas

- El índigo `#4F46E5` es el único acento permitido
- Evitar colores chillones o múltiples acentos
- Mantener jerarquía visual clara
- Glass effect para sensación premium
- Blobs índigo sutiles en fondo (no distraen)
