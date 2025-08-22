Diseño de la interfaz RFX-Result (Estilos de los componentes)

# Documentación de Implementación - Vista RFX Results

## Descripción General

La vista `RfxResults` implementa un diseño minimalista y consistente para mostrar y editar datos extraídos de documentos RFX. Utiliza un sistema de cards horizontales con campos editables inline y una configuración de precios de productos interactiva.

---

## Sistema de Diseño

### **Paleta de Colores**

```css
/* Colores principales */
- Grises sutiles: gray-50, gray-100, gray-200, gray-300
- Texto principal: gray-900, gray-800, gray-700
- Texto secundario: gray-600, gray-500, gray-400
- Acentos: blue-500, green-500, purple-500, orange-500, indigo-500, teal-500
- Estados: emerald-600 (éxito), red-600 (error), amber-600 (cargando)
```

### **Espaciado y Layout**

```css
/* Contenedor principal */
container mx-auto px-4 py-6 space-y-6

/* Cards */
shadow-sm hover:shadow-md transition-shadow duration-300 border-gray-100

/* Espaciado interno */
px-6 py-4 (CardContent)
pb-4 (CardHeader)
```

---

## ️ Estructura de Componentes

### **1. Cards de Información (4 secciones principales)**

#### **Card Header Pattern**

```typescriptreact
<CardHeader className="pb-4">
  <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
    <div className="w-2 h-2 bg-[COLOR]-500 rounded-full"></div>
    [TÍTULO]
  </CardTitle>
</CardHeader>
```

**Colores por sección:**

- 🔵 Datos del Solicitante: `bg-blue-500`
- 🟢 Datos de la Empresa: `bg-green-500`
- 🟣 Datos del Evento: `bg-purple-500`
- 🟠 Requirements Específicos: `bg-orange-500`

#### **Card Content Pattern**

```typescriptreact
<CardContent className="px-6 py-4">
  <div className="space-y-0">
    {/* Campos editables */}
  </div>
</CardContent>
```

---

### **2. Componente EditableField**

#### **Estructura Visual**

```typescriptreact
// Modo Visualización
<div className="group border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors duration-200">
  <div className="py-4 px-1">
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      {/* Label fijo */}
      <div className="sm:w-36 flex-shrink-0">
        <span className="text-sm font-medium text-gray-700">{label}:</span>
      </div>

      {/* Valor editable */}
      <div className="flex-1 flex items-center justify-between group-hover:bg-white/80 rounded-md px-2 py-1 -mx-2 -my-1 transition-colors duration-200">
        <span className="text-sm text-gray-900">{value}</span>

        {/* Indicador de edición */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs">
            <Edit3 className="h-3 w-3" />
            <span className="hidden sm:inline">Editar</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### **Modo Edición**

```typescriptreact
// Input con botones de acción
<div className="flex items-start gap-2">
  <Input className="border-gray-300 bg-white focus:border-blue-400 focus:ring-blue-200" />

  {/* Botones minimalistas */}
  <div className="flex items-center gap-1 flex-shrink-0">
    {/* Confirmar */}
    <Button className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm">
      <CheckCircle className="h-3 w-3" />
    </Button>

    {/* Cancelar */}
    <Button className="h-8 w-8 p-0 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 bg-white shadow-sm">
      <X className="h-3 w-3" />
    </Button>
  </div>
</div>
```

#### **Estados Visuales**

```css
/* Estados del input */
border-red-300 bg-red-50     /* Error */
border-amber-300 bg-amber-50 /* Guardando */
border-emerald-300 bg-emerald-50 /* Guardado */
border-gray-300 bg-white     /* Normal */
```

---

### **3. Configuración de Precios de Productos**

#### **Card Header con Controles**

```typescriptreact
<CardHeader>
  <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
    <span>Configurar Precios de Productos</span>

    {/* Controles en la derecha */}
    <div className="ml-auto flex items-center gap-3">
      {/* Selector de moneda */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Moneda:</span>
        <CurrencySelector className="w-[140px]" />
      </div>

      {/* Botón agregar */}
      <Button className="gap-2 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-800 shadow-sm">
        <Plus className="h-4 w-4" />
        Agregar
      </Button>
    </div>
  </CardTitle>
</CardHeader>
```

#### **Header de Tabla**

```typescriptreact
<div className="grid grid-cols-12 gap-4 items-center py-3 px-4 bg-gray-50/50 rounded-lg text-sm font-medium text-gray-600 border border-gray-100">
  <div className="col-span-4">Producto</div>
  <div className="col-span-2 text-center">Cantidad</div>
  <div className="col-span-2 text-center">Unidad</div>
  <div className="col-span-2 text-center">Precio Unit.</div>
  <div className="col-span-2 text-right">Subtotal</div>
</div>
```

#### **Fila de Producto**

```typescriptreact
<div className="grid grid-cols-12 gap-4 items-center py-4 px-4 border border-gray-100 rounded-lg hover:border-gray-200 hover:bg-gray-50/30 transition-all duration-200">
  {/* Nombre del producto - 4 columnas */}
  <div className="col-span-4">
    <div className="font-medium text-gray-900">{nombre}</div>
    <div className="text-sm text-gray-500">Unidad: {unidad}</div>
    {isModified && <div className="text-xs text-blue-600 font-medium">Cantidad modificada</div>}
  </div>

  {/* Campos editables - 8 columnas restantes */}
  {/* ... campos con InlineEditableField ... */}

  {/* Subtotal calculado - 2 columnas */}
  <div className="col-span-2 text-right">
    <div className="font-semibold text-gray-900">{currencySymbol}{subtotal}</div>
  </div>
</div>
```

#### **Formulario Agregar Producto**

```typescriptreact
<div className="grid grid-cols-12 gap-4 items-center py-4 px-4 border border-gray-200 bg-gray-50/30 rounded-lg">
  {/* Inputs con estilos consistentes */}
  <Input className="border-gray-200 bg-white focus:border-gray-400 focus:ring-gray-200" />

  {/* Botones de acción */}
  <div className="col-span-2 flex items-center justify-end gap-1">
    <Button className="h-8 w-8 p-0 bg-gray-800 hover:bg-gray-900 text-white shadow-sm">
      <CheckCircle className="h-4 w-4" />
    </Button>
    <Button className="h-8 w-8 p-0 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 bg-white shadow-sm">
      <X className="h-4 w-4" />
    </Button>
  </div>
</div>
```

---

### **4. Propuesta Comercial**

#### **Card Header**

```typescriptreact
<CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
  Paso 2: Generar Propuesta Comercial
  {/* Badges de estado */}
  {costsSaved && <span className="text-green-600 text-sm">✅ Costos guardados</span>}
</CardTitle>
```

#### **Botones de Acción**

```typescriptreact
<div className="flex flex-col sm:flex-row gap-3">
  <div className="flex gap-3">
    {/* Regenerar */}
    <Button className="gap-2 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-800 shadow-sm">
      <RefreshCw className="h-4 w-4" />
      🤖 Regenerar Propuesta
    </Button>

    {/* Descargar */}
    <Button className="gap-2 bg-gray-800 hover:bg-gray-900 text-white shadow-sm">
      <Download className="h-4 w-4" />
      Descargar Propuesta
    </Button>
  </div>

  {/* Finalizar */}
  <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm sm:ml-auto">
    <CheckCircle className="h-4 w-4" />
    Finalizar Análisis
  </Button>
</div>
```

---

## ️ Componentes Reutilizables

### **InlineEditableField**

**Props:**

```typescriptreact
interface InlineEditableFieldProps {
  value: string | number
  onSave: (value: string | number) => void
  type?: "text" | "number"
  placeholder?: string
  className?: string
  validate?: (value: string | number) => string | null
}
```

**Estados:**

- **Normal**: Hover sutil con indicador de edición
- **Edición**: Input enfocado con botones de acción
- **Error**: Border rojo con mensaje de validación

### **CurrencySelector**

```typescriptreact
<CurrencySelector
  value={selectedCurrency}
  onValueChange={setCurrency}
  className="w-[140px]"
/>
```

---

## Patrones de Botones

### **Botones Primarios**

```typescriptreact
// Acción principal (guardar, finalizar)
className="gap-2 bg-gray-800 hover:bg-gray-900 text-white shadow-sm"

// Acción exitosa
className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm"
```

### **Botones Secundarios**

```typescriptreact
// Outline sutil
className="gap-2 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-800 shadow-sm"
```

### **Botones de Acción Inline**

```typescriptreact
// Confirmar (verde)
className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm"

// Cancelar (gris)
className="h-8 w-8 p-0 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 bg-white shadow-sm"
```

---

## Responsividad

### **Breakpoints**

```css
/* Mobile first */
flex-col gap-2           /* Mobile */
sm:flex-row sm:gap-4     /* Desktop */

/* Labels */
sm:w-36 flex-shrink-0    /* Ancho fijo en desktop */

/* Grid de productos */
grid-cols-12             /* Siempre 12 columnas */
col-span-4               /* Producto: 4 columnas */
col-span-2               /* Otros campos: 2 columnas */
```

### **Texto Adaptativo**

```css
text-sm                  /* Labels y texto secundario */
text-lg                  /* Títulos de cards */
text-xs                  /* Badges y ayuda */
hidden sm:inline         /* Ocultar texto en mobile */
```

---

## Estados y Transiciones

### **Hover States**

```css
hover:bg-gray-50/50 transition-colors duration-200    /* Cards */
hover:border-gray-200 hover:bg-gray-50/30            /* Filas */
opacity-0 group-hover:opacity-100                   /* Indicadores */
```

### **Estados de Carga**

```css
animate-spin             /* Iconos de carga */
opacity-50              /* Contenido deshabilitado */
```

### **Feedback Visual**

```css
border-emerald-300 bg-emerald-50  /* Guardado exitoso */
border-red-300 bg-red-50          /* Error */
border-amber-300 bg-amber-50      /* Procesando */
```

---

## Funcionalidad Clave (Resumen)

### **Edición Inline**

- Click para editar → Input con botones
- Enter para confirmar, Escape para cancelar
- Validación en tiempo real
- Auto-guardado con feedback visual

### **Gestión de Productos**

- Tabla editable con campos inline
- Agregar productos dinámicamente
- Cálculo automático de subtotales
- Indicadores de modificación

### **Estados de Propuesta**

- Flujo: Guardar costos → Generar propuesta → Finalizar
- Feedback visual en cada paso
- Botones contextuales según estado

---

## Checklist de Implementación

- ✅ **Cards con puntos de color** para identificación visual
- ✅ **Campos editables inline** con hover states
- ✅ **Botones minimalistas** con iconos y colores consistentes
- ✅ **Grid responsive** para tabla de productos
- ✅ **Estados visuales** para feedback de usuario
- ✅ **Transiciones suaves** en todos los elementos interactivos
- ✅ **Tipografía consistente** con jerarquía clara
- ✅ **Espaciado uniforme** entre elementos
- ✅ **Colores sutiles** sin saturación excesiva
- ✅ **Sombras minimalistas** para profundidad sutil
