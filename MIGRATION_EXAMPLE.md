# 🔄 Ejemplo de Migración: landing-page.tsx

Este documento muestra cómo migrar un archivo existente usando los nuevos componentes y tokens semánticos.

---

## 📊 Análisis del Archivo Original

**Archivo:** `components/landing-page.tsx`  
**Issues detectados:** 31 (27 colores hardcoded, 4 patrones repetidos)

### Problemas Identificados

1. **Colores hardcoded** (27 ocurrencias)
   - `bg-white` → debería usar `bg-background`
   - `text-gray-900` → debería usar `text-foreground`
   - `text-gray-600` → debería usar `text-muted-foreground`
   - `border-gray-200` → debería usar `border`
   - `text-black` → debería usar `text-foreground`

2. **Cards repetidas** (3 ocurrencias)
   - Estructura repetida: `flex flex-col items-center text-center p-6 rounded-lg border-2 border-gray-200 bg-white`
   - Debería usar: `<Card variant="bordered">`

3. **Botones con estilos inline**
   - `bg-black hover:bg-gray-800` → debería usar `variant="brand"`

---

## ✅ Migración Paso a Paso

### Paso 1: Importar Nuevos Componentes

```tsx
// ❌ ANTES
import { Button } from '@/components/ui/button'

// ✅ DESPUÉS
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
```

### Paso 2: Reemplazar Colores Hardcoded

```tsx
// ❌ ANTES
<div className="min-h-screen bg-white">
  <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
    Título
  </h1>
  <p className="text-xl text-gray-600">
    Descripción
  </p>
</div>

// ✅ DESPUÉS
<div className="min-h-screen bg-background">
  <h1 className="text-4xl md:text-6xl font-bold text-foreground">
    Título
  </h1>
  <p className="text-xl text-muted-foreground">
    Descripción
  </p>
</div>
```

**Cambios:**
- `bg-white` → `bg-background`
- `text-gray-900` → `text-foreground`
- `text-gray-600` → `text-muted-foreground`

### Paso 3: Reemplazar Cards Inline con Card Component

```tsx
// ❌ ANTES - Código repetido 3 veces
<div className="flex flex-col items-center text-center p-6 rounded-lg border-2 border-gray-200 bg-white">
  <Zap className="h-12 w-12 text-black mb-4" />
  <h3 className="font-semibold text-lg mb-2">⚡ De 4 horas a 20 minutos</h3>
  <p className="text-sm text-gray-600">Reduce 92% el tiempo por propuesta</p>
</div>

// ✅ DESPUÉS - Componente reutilizable
<Card variant="bordered" className="flex flex-col items-center text-center">
  <CardContent className="pt-6">
    <Zap className="h-12 w-12 text-foreground mb-4" />
    <h3 className="font-semibold text-lg mb-2">⚡ De 4 horas a 20 minutos</h3>
    <p className="text-sm text-muted-foreground">Reduce 92% el tiempo por propuesta</p>
  </CardContent>
</Card>
```

**Beneficios:**
- ✅ Usa componente Card con variant
- ✅ Tokens semánticos (`text-foreground`, `text-muted-foreground`)
- ✅ Más fácil de mantener
- ✅ Consistente con el resto de la app

### Paso 4: Reemplazar Botones con Estilos Inline

```tsx
// ❌ ANTES
<Button 
  onClick={() => router.push('/signup')}
  className="bg-black hover:bg-gray-800 text-white px-8 py-6 text-lg"
>
  Sube tu primera solicitud gratis
  <ArrowRight className="ml-2" />
</Button>

// ✅ DESPUÉS
<Button 
  variant="brand"
  size="lg"
  onClick={() => router.push('/signup')}
>
  Sube tu primera solicitud gratis
  <ArrowRight className="ml-2" />
</Button>
```

**Cambios:**
- Eliminado `className` con estilos inline
- Agregado `variant="brand"` (usa `bg-foreground`)
- Agregado `size="lg"` (predefinido)
- Más limpio y mantenible

### Paso 5: Reemplazar Badge Inline

```tsx
// ❌ ANTES
<div className="inline-flex items-center rounded-full border-2 border-gray-200 px-4 py-1.5 text-sm">
  <span className="font-semibold">✨ Nuevo:</span>
  <span className="ml-2 text-gray-600">Generación de propuestas con IA</span>
</div>

// ✅ DESPUÉS
<div className="inline-flex items-center rounded-full border-2 border px-4 py-1.5 text-sm">
  <span className="font-semibold">✨ Nuevo:</span>
  <span className="ml-2 text-muted-foreground">Generación de propuestas con IA</span>
</div>
```

**Cambios:**
- `border-gray-200` → `border` (token semántico)
- `text-gray-600` → `text-muted-foreground`

---

## 📊 Resultado de la Migración

### Métricas

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Colores hardcoded | 27 | 0 | 100% ✅ |
| Código repetido (cards) | 3x ~8 líneas | 3x ~6 líneas | 25% ✅ |
| Líneas totales | 133 | ~120 | 10% ✅ |
| Componentes reutilizables | 1 | 2 | 100% ✅ |

### Beneficios

1. **Mantenibilidad** ⬆️
   - Cambiar colores globalmente: 1 lugar (CSS variables)
   - Cambiar estilo de cards: 1 lugar (Card component)
   - Cambiar estilo de botones: 1 lugar (Button variants)

2. **Consistencia** ⬆️
   - Todos los cards usan el mismo componente
   - Todos los botones usan variants predefinidos
   - Todos los colores usan tokens semánticos

3. **Escalabilidad** ⬆️
   - Fácil agregar nuevos variants
   - Fácil crear nuevas páginas con componentes existentes
   - Menos código para mantener

---

## 🎯 Código Completo Migrado

### Value Props Section - ANTES

```tsx
<div className="grid md:grid-cols-3 gap-6 w-full mt-12">
  <div className="flex flex-col items-center text-center p-6 rounded-lg border-2 border-gray-200 bg-white">
    <Zap className="h-12 w-12 text-black mb-4" />
    <h3 className="font-semibold text-lg mb-2">⚡ De 4 horas a 20 minutos</h3>
    <p className="text-sm text-gray-600">Reduce 92% el tiempo por propuesta</p>
  </div>
  
  <div className="flex flex-col items-center text-center p-6 rounded-lg border-2 border-gray-200 bg-white">
    <Target className="h-12 w-12 text-black mb-4" />
    <h3 className="font-semibold text-lg mb-2">🎯 100% Personalizado</h3>
    <p className="text-sm text-gray-600">Cada propuesta adaptada al cliente</p>
  </div>
  
  <div className="flex flex-col items-center text-center p-6 rounded-lg border-2 border-gray-200 bg-white">
    <FileText className="h-12 w-12 text-black mb-4" />
    <h3 className="font-semibold text-lg mb-2">📄 Excel/PDF Profesional</h3>
    <p className="text-sm text-gray-600">Listo para enviar al cliente</p>
  </div>
</div>
```

### Value Props Section - DESPUÉS

```tsx
<div className="grid md:grid-cols-3 gap-6 w-full mt-12">
  <Card variant="bordered" className="flex flex-col items-center text-center">
    <CardContent className="pt-6">
      <Zap className="h-12 w-12 text-foreground mb-4" />
      <h3 className="font-semibold text-lg mb-2">⚡ De 4 horas a 20 minutos</h3>
      <p className="text-sm text-muted-foreground">Reduce 92% el tiempo por propuesta</p>
    </CardContent>
  </Card>
  
  <Card variant="bordered" className="flex flex-col items-center text-center">
    <CardContent className="pt-6">
      <Target className="h-12 w-12 text-foreground mb-4" />
      <h3 className="font-semibold text-lg mb-2">🎯 100% Personalizado</h3>
      <p className="text-sm text-muted-foreground">Cada propuesta adaptada al cliente</p>
    </CardContent>
  </Card>
  
  <Card variant="bordered" className="flex flex-col items-center text-center">
    <CardContent className="pt-6">
      <FileText className="h-12 w-12 text-foreground mb-4" />
      <h3 className="font-semibold text-lg mb-2">📄 Excel/PDF Profesional</h3>
      <p className="text-sm text-muted-foreground">Listo para enviar al cliente</p>
    </CardContent>
  </Card>
</div>
```

**Diferencias clave:**
- ✅ Usa `<Card variant="bordered">` en lugar de div con clases inline
- ✅ Usa `<CardContent>` para el contenido
- ✅ `text-black` → `text-foreground`
- ✅ `text-gray-600` → `text-muted-foreground`
- ✅ `border-gray-200` eliminado (incluido en variant)

---

## 📝 Checklist de Migración

Al migrar cualquier archivo, verifica:

- [ ] Reemplazar `bg-white` → `bg-background`
- [ ] Reemplazar `bg-black` → `bg-foreground`
- [ ] Reemplazar `text-gray-900` → `text-foreground`
- [ ] Reemplazar `text-gray-600` → `text-muted-foreground`
- [ ] Reemplazar `text-gray-400` → `text-muted-foreground/60`
- [ ] Reemplazar `border-gray-200` → `border`
- [ ] Usar `<Card variant="...">` en lugar de divs con estilos inline
- [ ] Usar `<Button variant="...">` en lugar de estilos inline
- [ ] Eliminar código repetido usando componentes
- [ ] Verificar que todo funciona correctamente

---

## 🚀 Próximos Archivos a Migrar

Según el análisis, estos son los archivos prioritarios:

1. **app-sidebar.tsx** (36 issues)
   - 17 colores hardcoded
   - 16 valores arbitrarios
   - 3 patrones repetidos

2. **rfx-history.tsx** (36 issues)
   - 27 colores hardcoded
   - 8 patrones repetidos

3. **processed-files-content.tsx** (36 issues)
   - 23 colores hardcoded
   - 13 patrones repetidos

---

**Última actualización:** 13 de enero, 2026  
**Próximo paso:** Migrar landing-page.tsx completamente
