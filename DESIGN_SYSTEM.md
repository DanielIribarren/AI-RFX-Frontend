# 🎨 Design System - RFX Analyzer

Sistema de diseño moderno inspirado en Relevance AI con énfasis en profundidad, claridad y color de marca vibrante.

## 🎯 Principios de Diseño

1. **Minimalismo Elegante**: Base blanco/negro con acentos de color estratégicos
2. **Profundidad Visual**: Sombras múltiples y efectos de elevación
3. **Color de Marca Dominante**: Púrpura vibrante (#8B5CF6) como color principal
4. **Transiciones Suaves**: Animaciones fluidas de 200-300ms
5. **Jerarquía Clara**: Tipografía y espaciado consistentes

## 🎨 Paleta de Colores

### Colores Base
- **Background**: `hsl(0 0% 100%)` - Blanco puro
- **Foreground**: `hsl(0 0% 4%)` - Negro profundo
- **Card**: `hsl(0 0% 100%)` - Blanco para cards

### Color de Marca (Primary)
- **Primary**: `hsl(258 90% 66%)` - Púrpura vibrante
- **Primary Light**: `hsl(258 90% 75%)` - Púrpura claro
- **Primary Dark**: `hsl(258 90% 56%)` - Púrpura oscuro
- **Primary Foreground**: `hsl(0 0% 100%)` - Blanco

### Grises Modernos
- **Muted**: `hsl(0 0% 96%)` - Gris muy claro
- **Muted Foreground**: `hsl(0 0% 45%)` - Gris medio
- **Border**: `hsl(0 0% 90%)` - Borde sutil
- **Border Light**: `hsl(0 0% 94%)` - Borde muy sutil

### Colores Funcionales
- **Destructive**: `hsl(0 84% 60%)` - Rojo para acciones destructivas
- **Success**: Verde para estados completados
- **Warning**: Naranja para alertas

## 📐 Sombras y Elevación

### Sistema de Sombras
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25)
```

### Sombras con Brand Color
```css
--shadow-brand: 0 0 0 3px hsl(var(--accent-light)), 0 10px 15px -3px rgb(0 0 0 / 0.1)
--shadow-brand-lg: 0 0 0 4px hsl(var(--accent-light)), 0 20px 25px -5px rgb(0 0 0 / 0.1)
```

## 🔲 Componentes de UI

### Cards

#### Card Elevated
```tsx
<div className="card-elevated">
  {/* Contenido */}
</div>
```
- Fondo blanco
- Borde sutil `border-gray-200/60`
- Sombra media con hover a XL
- Border radius: `rounded-xl` (0.75rem)

#### Card Elevated Large
```tsx
<div className="card-elevated-lg">
  {/* Contenido */}
</div>
```
- Similar a card-elevated pero con sombra más profunda
- Border radius: `rounded-2xl` (1rem)
- Ideal para componentes destacados

#### Card Glass
```tsx
<div className="card-glass">
  {/* Contenido */}
</div>
```
- Fondo semi-transparente con backdrop blur
- Efecto de vidrio esmerilado

### Botones

#### Botón Primary (Brand)
```tsx
<button className="btn-brand">
  Acción Principal
</button>
```
- Gradiente de marca
- Sombra media con hover a grande
- Texto blanco

#### Botón Outline
```tsx
<button className="btn-brand-outline">
  Acción Secundaria
</button>
```
- Borde de 2px con color de marca
- Texto color de marca
- Hover: fondo de marca con texto blanco

### Efectos de Hover

#### Hover Lift
```tsx
<div className="hover-lift">
  {/* Se eleva al hacer hover */}
</div>
```
- Translación -4px en Y
- Sombra aumenta

#### Hover Glow Brand
```tsx
<div className="hover-glow-brand">
  {/* Brilla con color de marca */}
</div>
```
- Ring de 3px con color de marca claro
- Sombra adicional

## 🎭 Gradientes

### Gradiente de Marca
```css
.bg-brand-gradient {
  background: linear-gradient(135deg, hsl(258 90% 66%) 0%, hsl(280 90% 70%) 100%);
}
```

### Gradiente Sutil
```css
.bg-brand-gradient-subtle {
  background: linear-gradient(135deg, hsl(258 100% 97%) 0%, hsl(280 100% 98%) 100%);
}
```

### Texto con Gradiente
```tsx
<h1 className="text-brand-gradient">
  Título con Gradiente
</h1>
```

## ✨ Animaciones

### Float
```tsx
<div className="animate-float">
  {/* Flota suavemente */}
</div>
```
- Movimiento vertical suave
- Duración: 3s
- Ideal para iconos y elementos decorativos

### Shimmer
```tsx
<div className="animate-shimmer">
  {/* Efecto de brillo deslizante */}
</div>
```
- Gradiente que se mueve horizontalmente
- Ideal para estados de carga

### Pulse Brand
```tsx
<div className="animate-pulse-brand">
  {/* Pulso con opacidad */}
</div>
```
- Pulso suave de opacidad
- Duración: 2s

## 📏 Espaciado y Tipografía

### Espaciado
- **Pequeño**: 0.5rem - 1rem (gap-2 a gap-4)
- **Medio**: 1.5rem - 2rem (gap-6 a gap-8)
- **Grande**: 2.5rem - 3rem (gap-10 a gap-12)

### Tipografía
- **Títulos Principales**: `text-3xl` a `text-5xl`, `font-bold`
- **Subtítulos**: `text-xl` a `text-2xl`, `font-semibold`
- **Cuerpo**: `text-base`, `font-normal`
- **Pequeño**: `text-sm` a `text-xs`, `font-medium`

### Line Height
- Títulos: `leading-tight` (1.25)
- Cuerpo: `leading-relaxed` (1.625)

## 🎯 Uso en Componentes

### Dashboard
- Fondo: Gradiente sutil de gris a púrpura claro
- Cards: `card-elevated-lg` con `hover-lift` y `hover-glow-brand`
- Botón principal: `bg-brand-gradient`
- Iconos: Fondos con gradiente de marca

### Sidebar
- Fondo: Blanco puro
- Botón "New RFX": `bg-brand-gradient` con `shadow-md`
- Items de navegación: Hover con `bg-primary/5` y `text-primary`
- Items activos: `bg-primary/10` con `text-primary` y `font-semibold`

### Historial
- Cards: Border de 2px con `hover-lift`
- Seleccionado: `border-primary` con `shadow-brand`
- Search: Border radius grande `rounded-2xl` con focus ring de marca
- Badges: Color de marca para "In Progress"

### Inputs
- Border: `border-gray-200`
- Focus: `border-primary` con `ring-2 ring-primary/20`
- Border radius: `rounded-xl` a `rounded-2xl`
- Altura: `h-12` a `h-14` para mejor accesibilidad

## 🚀 Mejores Prácticas

1. **Consistencia**: Usar siempre las clases de utilidad del sistema
2. **Accesibilidad**: Mantener contraste mínimo 4.5:1
3. **Performance**: Limitar animaciones a propiedades que no causan reflow
4. **Responsive**: Mobile-first con breakpoints consistentes
5. **Dark Mode**: Variables CSS preparadas para modo oscuro

## 📦 Clases de Utilidad Personalizadas

Todas las clases están definidas en `app/globals.css`:

- `.card-elevated` - Card con elevación estándar
- `.card-elevated-lg` - Card con elevación grande
- `.card-glass` - Card con efecto vidrio
- `.bg-brand-gradient` - Gradiente de marca
- `.bg-brand-gradient-subtle` - Gradiente sutil
- `.hover-lift` - Efecto de elevación al hover
- `.hover-glow-brand` - Brillo de marca al hover
- `.border-brand-accent` - Borde izquierdo de marca
- `.text-brand-gradient` - Texto con gradiente
- `.btn-brand` - Botón con estilo de marca
- `.btn-brand-outline` - Botón outline de marca
- `.input-brand-focus` - Focus de input con marca
- `.transition-smooth` - Transición suave
- `.backdrop-modern` - Backdrop moderno

## 🎨 Inspiración

Este sistema de diseño está inspirado en:
- **Relevance AI**: Color de marca vibrante, sombras profundas
- **Linear**: Minimalismo y transiciones suaves
- **Vercel**: Tipografía clara y espaciado generoso
- **Stripe**: Cards elevadas y jerarquía visual
