# 🎨 AI-RFX Frontend Style Guide

**Versión:** 1.0  
**Última actualización:** 13 de enero, 2026

---

## 🎯 Filosofía de Diseño

### Principios Fundamentales

1. **Tokens sobre valores hardcoded** - Siempre usar variables CSS
2. **Semántica sobre literales** - `bg-primary` en lugar de `bg-indigo-600`
3. **Composición sobre duplicación** - Reutilizar utilidades y componentes
4. **Consistencia sobre creatividad** - Seguir el sistema establecido

---

## 🎨 Sistema de Tokens CSS

### 1. Colores Semánticos

**❌ NO USAR:**
```tsx
// Valores hardcoded
<div className="bg-black text-white" />
<div className="bg-gray-800 text-gray-600" />
<div className="bg-indigo-600 border-indigo-500" />
```

**✅ USAR:**
```tsx
// Tokens semánticos
<div className="bg-foreground text-background" />
<div className="bg-muted text-muted-foreground" />
<div className="bg-primary border-primary" />
```

### Tabla de Mapeo de Colores

| ❌ Evitar | ✅ Usar | Propósito |
|-----------|---------|-----------|
| `bg-white` | `bg-background` | Fondo principal |
| `bg-black` | `bg-foreground` | Texto/elementos principales |
| `text-black` | `text-foreground` | Texto principal |
| `text-white` | `text-background` | Texto sobre fondos oscuros |
| `bg-gray-50` | `bg-secondary` | Fondos secundarios |
| `bg-gray-100` | `bg-muted` | Fondos sutiles |
| `text-gray-600` | `text-muted-foreground` | Texto secundario |
| `text-gray-400` | `text-muted-foreground/60` | Texto deshabilitado |
| `border-gray-200` | `border` | Bordes estándar |
| `border-gray-300` | `border-input` | Bordes de inputs |
| `bg-indigo-600` | `bg-primary` o `bg-accent` | Color de marca |
| `bg-red-600` | `bg-destructive` | Acciones destructivas |

### 2. Tokens de Color Disponibles

```css
/* Base Colors */
--background: 0 0% 100%;           /* Fondo principal (blanco) */
--foreground: 0 0% 4%;             /* Texto principal (negro) */

/* Brand Colors */
--primary: 258 90% 66%;            /* Púrpura vibrante - Acciones principales */
--primary-foreground: 0 0% 100%;  /* Texto sobre primary */
--primary-light: 258 90% 75%;     /* Variante clara */
--primary-dark: 258 90% 56%;      /* Variante oscura */

/* Accent (mismo que primary para consistencia) */
--accent: 258 90% 66%;            /* Highlights y badges */
--accent-foreground: 0 0% 100%;   /* Texto sobre accent */
--accent-light: 258 100% 95%;     /* Fondo sutil de accent */

/* Secondary Colors */
--secondary: 0 0% 97%;            /* Fondos secundarios */
--secondary-foreground: 0 0% 9%; /* Texto sobre secondary */

/* Muted (grises sutiles) */
--muted: 0 0% 96%;                /* Fondos deshabilitados/sutiles */
--muted-foreground: 0 0% 45%;    /* Texto secundario */

/* Borders */
--border: 0 0% 90%;               /* Bordes estándar */
--border-light: 0 0% 94%;         /* Bordes sutiles */
--input: 0 0% 90%;                /* Bordes de inputs */

/* Cards */
--card: 0 0% 100%;                /* Fondo de cards */
--card-foreground: 0 0% 4%;       /* Texto en cards */
--card-border: 0 0% 92%;          /* Bordes de cards */

/* Destructive */
--destructive: 0 84% 60%;         /* Rojo para acciones destructivas */
--destructive-foreground: 0 0% 98%; /* Texto sobre destructive */

/* Focus Ring */
--ring: 258 90% 66%;              /* Color del focus ring (primary) */
```

---

## 📐 Sistema de Spacing

### Escala de Spacing Consistente

**❌ NO USAR:**
```tsx
// Valores arbitrarios inconsistentes
<div className="p-5 mb-7 gap-3" />
<div className="px-6 py-4 space-y-5" />
```

**✅ USAR:**
```tsx
// Escala consistente de Tailwind
<div className="p-4 mb-6 gap-2" />
<div className="px-6 py-4 space-y-4" />
```

### Escala Recomendada

| Uso | Spacing | Ejemplo |
|-----|---------|---------|
| Muy compacto | `gap-1` (4px) | Iconos + texto inline |
| Compacto | `gap-2` (8px) | Elementos relacionados |
| Normal | `gap-4` (16px) | Elementos de card |
| Espacioso | `gap-6` (24px) | Secciones dentro de página |
| Muy espacioso | `gap-8` (32px) | Secciones principales |
| Extra espacioso | `gap-12` (48px) | Separación de bloques |

### Padding de Componentes

```tsx
// Cards
<Card className="p-6" />          // Estándar
<Card className="p-4" />          // Compacto
<Card className="p-8" />          // Espacioso

// Buttons
<Button className="px-4 py-2" />  // Default
<Button className="px-3 py-1.5" /> // Small
<Button className="px-6 py-3" />  // Large

// Sections
<section className="py-12 px-6" /> // Estándar
<section className="py-20 px-6" /> // Hero sections
```

---

## 🔤 Sistema Tipográfico

### Fuentes

```tsx
// Headings (próximamente: Sora o Space Grotesk)
font-family: var(--font-heading);

// Body text
font-family: Inter, system-ui, sans-serif;

// Monospace (código)
font-family: 'Fira Code', monospace;
```

### Escala Tipográfica

**❌ NO USAR:**
```tsx
// Tamaños arbitrarios
<h1 className="text-[42px]" />
<p className="text-[15px]" />
```

**✅ USAR:**
```tsx
// Escala predefinida
<h1 className="text-4xl md:text-6xl font-bold" />
<p className="text-base" />
```

### Jerarquía de Texto

| Elemento | Clases | Uso |
|----------|--------|-----|
| H1 | `text-4xl md:text-6xl font-bold` | Hero titles |
| H2 | `text-3xl md:text-4xl font-bold` | Section titles |
| H3 | `text-2xl font-semibold` | Subsection titles |
| H4 | `text-xl font-semibold` | Card titles |
| Body Large | `text-lg` | Intro paragraphs |
| Body | `text-base` | Texto estándar |
| Body Small | `text-sm` | Texto secundario |
| Caption | `text-xs` | Labels, metadata |

### Pesos de Fuente

```tsx
font-normal    // 400 - Texto normal
font-medium    // 500 - Énfasis sutil
font-semibold  // 600 - Títulos secundarios
font-bold      // 700 - Títulos principales
```

---

## 🎭 Sombras y Elevación

### Sistema de Sombras

**❌ NO USAR:**
```tsx
// Sombras hardcoded
<div className="shadow-[0_4px_6px_rgba(0,0,0,0.1)]" />
```

**✅ USAR:**
```tsx
// Tokens de sombra
<div className="shadow-md" />
```

### Escala de Elevación

| Token | Uso | Ejemplo |
|-------|-----|---------|
| `shadow-sm` | Bordes sutiles | Inputs, dividers |
| `shadow` | Elevación básica | Cards en reposo |
| `shadow-md` | Elevación media | Cards hover, dropdowns |
| `shadow-lg` | Elevación alta | Modals, popovers |
| `shadow-xl` | Elevación muy alta | Floating elements |
| `shadow-2xl` | Máxima elevación | Hero elements |

### Sombras de Marca

```tsx
// Sombra con color de marca (púrpura)
<div className="shadow-brand" />      // Sutil
<div className="shadow-brand-lg" />   // Pronunciada
```

---

## 🎨 Utilidades CSS Custom

### Cards con Variantes

**❌ NO USAR:**
```tsx
// Estilos inline repetidos
<div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300" />
```

**✅ USAR:**
```tsx
// Utilidades custom
<div className="card-elevated" />
<div className="card-elevated-lg" />
<div className="card-glass" />
```

### Utilidades Disponibles

```css
/* Cards */
.card-elevated       /* Card con sombra y hover lift */
.card-elevated-lg    /* Card grande con más elevación */
.card-glass          /* Card con efecto glassmorphism */

/* Backgrounds */
.bg-brand-gradient         /* Gradiente púrpura */
.bg-brand-gradient-subtle  /* Gradiente sutil */

/* Hover Effects */
.hover-lift           /* Eleva elemento al hover */
.hover-glow-brand     /* Glow con color de marca */

/* Borders */
.border-brand-accent  /* Borde izquierdo con color de marca */

/* Text */
.text-brand-gradient  /* Texto con gradiente de marca */

/* Buttons */
.btn-brand           /* Botón con estilo de marca */
.btn-brand-outline   /* Botón outline con marca */

/* Inputs */
.input-brand-focus   /* Focus ring con color de marca */

/* Transitions */
.transition-smooth   /* Transición suave estándar */

/* Backdrop */
.backdrop-modern     /* Backdrop blur moderno */
```

---

## 🔄 Animaciones

### Animaciones Disponibles

```tsx
// Animaciones de entrada
<div className="animate-slide-down" />  // Desliza desde arriba
<div className="animate-slide-up" />    // Desliza hacia arriba
<div className="animate-fadeIn" />      // Fade in suave

// Animaciones de estado
<div className="animate-pulse-brand" /> // Pulso con color de marca
<div className="animate-soft-pulse" />  // Pulso sutil
<div className="animate-shimmer" />     // Efecto shimmer/loading

// Animaciones de feedback
<div className="animate-glow" />        // Glow verde (éxito)
<div className="animate-glow-blue" />   // Glow azul (nuevo)
<div className="animate-glow-yellow" /> // Glow amarillo (modificado)
<div className="animate-shake" />       // Shake (error)
<div className="animate-success-scale" /> // Scale (éxito)

// Animaciones decorativas
<div className="animate-float" />       // Flotación suave
```

---

## 🎯 Patrones de Uso Comunes

### 1. Botones

```tsx
// ✅ Botón principal (CTA)
<Button variant="default" size="lg">
  Acción Principal
</Button>

// ✅ Botón secundario
<Button variant="outline" size="default">
  Acción Secundaria
</Button>

// ✅ Botón destructivo
<Button variant="destructive">
  Eliminar
</Button>

// ✅ Botón ghost (minimal)
<Button variant="ghost">
  Cancelar
</Button>

// ❌ NO hardcodear estilos
<button className="bg-black text-white px-4 py-2 rounded-md">
  Acción
</button>
```

### 2. Cards

```tsx
// ✅ Card estándar
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descripción</CardDescription>
  </CardHeader>
  <CardContent>
    Contenido
  </CardContent>
</Card>

// ✅ Card con elevación
<Card className="card-elevated">
  ...
</Card>

// ❌ NO recrear estructura
<div className="bg-white border rounded-lg p-6">
  <h3 className="text-xl font-bold">Título</h3>
  <p className="text-gray-600">Descripción</p>
</div>
```

### 3. Estados de Loading

```tsx
// ✅ Usar componente reutilizable (próximamente)
<LoadingSpinner />

// ✅ Mientras tanto, usar clase consistente
<div className="flex items-center justify-center py-12">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
</div>

// ❌ NO variar el patrón
<div className="animate-spin h-10 w-10 border-4 border-blue-500" />
```

### 4. Estados Vacíos

```tsx
// ✅ Usar componente reutilizable (próximamente)
<EmptyState
  icon={FileX}
  title="No hay datos"
  description="Sube tu primer documento para comenzar"
/>

// ✅ Mientras tanto, usar patrón consistente
<div className="flex flex-col items-center justify-center py-12 text-center">
  <FileX className="h-12 w-12 text-muted-foreground mb-4" />
  <p className="text-foreground font-medium">No hay datos</p>
  <p className="text-muted-foreground text-sm">Descripción</p>
</div>
```

### 5. Inputs

```tsx
// ✅ Input estándar
<Input
  type="text"
  placeholder="Placeholder"
  className="input-brand-focus"
/>

// ✅ Input con label
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" />
</div>

// ❌ NO hardcodear estilos
<input className="border-2 border-gray-300 rounded-md px-4 py-2" />
```

---

## 🚫 Anti-Patrones (Evitar)

### 1. Hardcoded Colors

```tsx
// ❌ MAL
<div className="bg-[#8B5CF6] text-[#FFFFFF]" />
<div className="bg-black hover:bg-gray-800" />

// ✅ BIEN
<div className="bg-primary text-primary-foreground" />
<div className="bg-foreground hover:opacity-90" />
```

### 2. Valores Arbitrarios Innecesarios

```tsx
// ❌ MAL
<div className="w-[347px] h-[89px] p-[23px]" />

// ✅ BIEN
<div className="w-80 h-20 p-6" />
```

### 3. Estilos Inline Repetidos

```tsx
// ❌ MAL - Repetido en 10 lugares
<div className="flex items-center justify-between p-6 bg-white border border-gray-200 rounded-lg shadow-md" />

// ✅ BIEN - Crear utilidad o componente
<div className="card-elevated flex items-center justify-between p-6" />
```

### 4. Mezclar Sistemas de Color

```tsx
// ❌ MAL - Mezcla tokens y valores hardcoded
<div className="bg-primary border-indigo-500" />

// ✅ BIEN - Consistente con tokens
<div className="bg-primary border-primary" />
```

### 5. Ignorar Responsive Design

```tsx
// ❌ MAL - No responsive
<h1 className="text-6xl font-bold" />

// ✅ BIEN - Mobile-first responsive
<h1 className="text-4xl md:text-6xl font-bold" />
```

---

## 📱 Responsive Design

### Breakpoints

```tsx
// Mobile first approach
sm:   // 640px  - Tablets pequeñas
md:   // 768px  - Tablets
lg:   // 1024px - Laptops
xl:   // 1280px - Desktops
2xl:  // 1536px - Desktops grandes
```

### Patrones Responsive

```tsx
// ✅ Layout responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" />

// ✅ Texto responsive
<h1 className="text-4xl md:text-6xl" />

// ✅ Spacing responsive
<section className="py-12 md:py-20 px-6" />

// ✅ Visibilidad responsive
<div className="hidden md:block" />
<div className="block md:hidden" />
```

---

## ✅ Checklist de Calidad

Antes de hacer commit, verifica:

- [ ] No hay colores hardcoded (`bg-black`, `text-gray-600`, etc.)
- [ ] Se usan tokens semánticos (`bg-foreground`, `text-muted-foreground`)
- [ ] Spacing consistente (escala de Tailwind: 2, 4, 6, 8, 12)
- [ ] Componentes reutilizables en lugar de estilos inline
- [ ] Responsive design implementado (mobile-first)
- [ ] Animaciones suaves (usando clases predefinidas)
- [ ] Accesibilidad considerada (focus states, aria labels)

---

## 📚 Referencias

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com)
- [HSL Color Picker](https://hslpicker.com)

---

**Última actualización:** 13 de enero, 2026  
**Próxima revisión:** Después de Fase 2
