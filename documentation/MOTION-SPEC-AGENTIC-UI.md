# RFX Frontend Motion Spec (v1)

## Objetivo
Definir un sistema de movimiento consistente para que los cambios de UI se sientan fluidos, predecibles y no bruscos en los flujos principales de RFX.

## Principios
- Animar solo `opacity` y `transform` cuando sea posible.
- Evitar cambios bruscos de layout durante cargas y transiciones de vistas.
- Mantener una duracion corta para feedback UI, media para paneles y larga solo para contexto.
- Todo estado de espera debe tener transicion visible (skeleton, pulse o progress).
- Respetar accesibilidad con `prefers-reduced-motion`.

## Tokens de motion (estandar)

### Duraciones
- `motion-fast`: `150ms` (hover, focus, micro feedback)
- `motion-base`: `220ms` (botones, tabs, cards, badges)
- `motion-slow`: `320ms` (paneles, side sheets, dialogs)
- `motion-emphasis`: `450ms` (entradas destacadas, no usar en loops)

### Easing
- `ease-standard`: `cubic-bezier(0.2, 0, 0, 1)` (default UI)
- `ease-enter`: `cubic-bezier(0, 0, 0, 1)` (entrada suave)
- `ease-exit`: `cubic-bezier(0.3, 0, 1, 1)` (salida limpia)

### Distancias
- `motion-y-sm`: `4px`
- `motion-y-md`: `8px`
- `motion-y-lg`: `12px`
- `motion-scale-subtle`: `1.02`

## Patrones por tipo de componente

### 1) Estado de carga (Thinking / Executing)
- Entrada: `opacity 0 -> 1` + `translateY(8px -> 0)` en `220ms`.
- Actualizaciones de pasos: stagger de `60ms` entre items.
- Progress de barra: transicion minima `200ms` para evitar saltos.
- Skeleton: shimmer suave (sin flicker), no mas de 2 capas animadas simultaneas.

### 2) Panel lateral (chat, artifacts, execution feed)
- Abrir: `translateX(12px -> 0)` + `opacity` en `320ms`.
- Cerrar: `translateX(0 -> 12px)` + `opacity` en `220ms`.
- Resize manual: sin animacion mientras arrastra; animacion solo al "snap" final.

### 3) Cards y lista de eventos
- Hover card: `transform` + `shadow` en `220ms`.
- Nueva card agregada: `fade + slide-up` (`220ms`) una sola vez.
- Estado `success/error`: highlight breve (`400-600ms`), luego estado estable.

### 4) Cambios de tab/vista
- Tab content: `fadeIn + translateY(8px)` en `220ms`.
- No desmontar contenido critico si evita flash; usar preserve-state cuando aplique.

### 5) Dialogs y confirmaciones
- Reemplazar `window.confirm` por `AlertDialog` con:
  - overlay fade `150ms`
  - content scale `0.98 -> 1` + fade `220ms`

## Mapa de aplicacion inmediato (archivos)

- `components/features/rfx/RFXChatInput.tsx`
  - Thinking/processing states con transiciones de entrada/salida.
- `components/features/rfx/RFXResultsWrapperV2.tsx`
  - Feed de ejecucion y cambios aplicados con animaciones de lista.
- `components/features/rfx/update-chat/RFXUpdateChatPanel.tsx`
  - Apertura/cierre de panel y transicion de mensajes.
- `components/layout/AppSidebar.tsx`
  - Confirmaciones via dialog + feedback no bloqueante.
- `app/(workspace)/dashboard/page.tsx`
  - Cambio de estado inicial -> procesando -> resultado sin saltos.

## Reglas de calidad (Definition of Done de motion)
- No usar `alert()` o cambios sin transicion en flujos core.
- No mas de 2 animaciones concurrentes por bloque principal.
- FPS estable en laptop media (sin jank visible en scroll o panel open/close).
- `prefers-reduced-motion: reduce` debe desactivar animaciones no esenciales.

## Implementacion recomendada en el sistema actual

### CSS utilities nuevas (sugeridas)
- `.motion-enter`
- `.motion-exit`
- `.motion-fade-up`
- `.motion-scale-in`
- `.motion-stagger-item`

### Tailwind usage guideline
- Base: `transition-all duration-200 ease-out`
- Paneles: `duration-300`
- Evitar `transition-all` en componentes complejos con layout variable; preferir `transition-[opacity,transform]`.

## Accesibilidad
- Agregar bloque global:
  - `@media (prefers-reduced-motion: reduce) { animation: none; transition-duration: 0.01ms; }`
- Mantener feedback visual alternativo (badges/labels de estado) cuando se desactiva motion.

## KPI de motion UX
- Reduccion de abandono durante procesamiento RFX.
- Menor tasa de clicks repetidos en acciones de submit.
- Menor tasa de errores por doble accion durante estados de carga.
- Mejora en `Time to First Trust` (primer momento donde el usuario percibe progreso claro).

## Nota de compatibilidad
El frontend ya tiene clases como `animate-slide-down`, `animate-slide-up`, `transition-smooth`, `animate-shimmer`.
Esta spec no rompe eso: estandariza el uso y define donde aplicar cada patron para lograr una experiencia fluida y consistente.
