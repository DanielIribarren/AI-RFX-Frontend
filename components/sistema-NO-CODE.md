Documentación Interfaz NO CODE

# Documentación: Sistema de Edición de Campos Componentes datos extraídos Inline

## Resumen General

Sistema de edición inline que permite modificar campos de texto directamente en la interfaz sin modales o páginas separadas. Incluye validación en tiempo real, confirmación manual y feedback visual completo.

## Arquitectura del Componente

### Componente Principal: `EditableField`

```typescript
interface EditableFieldProps {
  field: keyof ExtractedData; // Clave del campo en el estado
  value: string; // Valor actual del campo
  label: string; // Etiqueta descriptiva
  originalText?: string; // Texto original para referencia
  type?: "text" | "email" | "tel" | "date"; // Tipo de validación
}
```

## Estados del Sistema

### 1. Estados de Edición

```typescript
const [isEditing, setIsEditing] = useState(false); // Modo edición activo/inactivo
const [editValue, setEditValue] = useState(value); // Valor temporal durante edición
const [validationError, setValidationError] = useState<string | null>(null); // Error de validación
const [saveStatus, setSaveStatus] = useState<
  "idle" | "saving" | "saved" | "error"
>("idle"); // Estado de guardado
```

### 2. Referencias DOM

```typescript
const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null); // Referencia para focus automático
```

## Flujo de Interacción

### Modo Vista (Estado Inicial)

1. **Apariencia**: Campo mostrado como texto plano con hover effect
2. **Interacción**: Click activa modo edición
3. **Indicadores visuales**:

4. Ícono de editar aparece al hacer hover
5. Borde transparente que se vuelve gris al hover

### Activación del Modo Edición

```typescript
const handleStartEdit = () => {
  setIsEditing(true); // Activa modo edición
  setEditValue(value); // Inicializa con valor actual
  setValidationError(null); // Limpia errores previos
  setSaveStatus("idle"); // Resetea estado de guardado
};
```

### Auto-focus y Selección

```typescript
useEffect(() => {
  if (isEditing && inputRef.current) {
    inputRef.current.focus(); // Focus automático
    if (inputRef.current instanceof HTMLInputElement) {
      inputRef.current.select(); // Selecciona todo el texto
    }
  }
}, [isEditing]);
```

## Sistema de Validación

### Función de Validación por Tipo

```typescript
const validateField = (val: string): string | null => {
  if (!val.trim()) return null; // Permite valores vacíos

  switch (type) {
    case "email":
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(val) ? null : "Email inválido";

    case "tel":
      const phoneRegex = /^[+]?[0-9\s\-()]{7,}$/;
      return phoneRegex.test(val) ? null : "Teléfono inválido";

    case "date":
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(val)) return "Formato de fecha inválido (YYYY-MM-DD)";
      const date = new Date(val);
      return isNaN(date.getTime()) ? "Fecha inválida" : null;

    default:
      return val.length > 200
        ? "Texto demasiado largo (máx. 200 caracteres)"
        : null;
  }
};
```

## Controles de Teclado

### Manejo de Eventos de Teclado

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleConfirm(); // Enter confirma
  }
  if (e.key === "Escape") {
    e.preventDefault();
    handleCancel(); // Escape cancela
  }
};
```

## Acciones de Confirmación y Cancelación

### Confirmar Cambios

```typescript
const handleConfirm = async () => {
  // 1. Validar antes de guardar
  const error = validateField(editValue);
  if (error) {
    setValidationError(error);
    return;
  }

  // 2. Mostrar estado de carga
  setSaveStatus("saving");
  setValidationError(null);

  try {
    // 3. Simular llamada API
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 4. Actualizar estado global
    setExtractedData((prev) => ({ ...prev, [field]: editValue }));

    // 5. Mostrar éxito y salir de edición
    setSaveStatus("saved");
    setIsEditing(false);

    // 6. Reset estado después de mostrar éxito
    setTimeout(() => setSaveStatus("idle"), 2000);
  } catch (error) {
    setSaveStatus("error");
    setValidationError("Error al guardar. Intente nuevamente.");
  }
};
```

### Cancelar Cambios

```typescript
const handleCancel = () => {
  setEditValue(value); // Restaura valor original
  setIsEditing(false); // Sale de modo edición
  setValidationError(null); // Limpia errores
  setSaveStatus("idle"); // Resetea estado
};
```

## Sistema de Estilos Dinámicos

### Clases CSS Condicionales

```typescript
const getInputClassName = () => {
  const baseClass =
    "w-full border-2 rounded-md px-3 py-2 text-sm transition-all duration-200";

  if (validationError) {
    return `${baseClass} border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200`;
  }

  if (saveStatus === "saving") {
    return `${baseClass} border-yellow-300 bg-yellow-50 focus:border-yellow-500`;
  }

  if (saveStatus === "saved") {
    return `${baseClass} border-green-300 bg-green-50 focus:border-green-500`;
  }

  return `${baseClass} border-blue-300 bg-blue-50 focus:border-blue-500 focus:ring-blue-200`;
};
```

## Indicadores Visuales

### Iconos de Estado

```typescript
const getStatusIcon = () => {
  switch (saveStatus) {
    case "saving":
      return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />;
    case "saved":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return null;
  }
};
```

## Layout de Botones de Acción

### Estructura HTML de Botones

```javascriptreact
<div className="flex items-center gap-1 flex-shrink-0">
  {/* Botón Confirmar */}
  <Button
    size="sm"
    onClick={handleConfirm}
    disabled={saveStatus === "saving"}
    className="h-9 w-9 p-0 bg-green-600 hover:bg-green-700 text-white"
    title="Confirmar (Enter)"
  >
    {saveStatus === "saving" ? (
      <RefreshCw className="h-4 w-4 animate-spin" />
    ) : (
      <CheckCircle className="h-4 w-4" />
    )}
  </Button>

  {/* Botón Cancelar */}
  <Button
    size="sm"
    variant="outline"
    onClick={handleCancel}
    disabled={saveStatus === "saving"}
    className="h-9 w-9 p-0 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 bg-transparent"
    title="Cancelar (Escape)"
  >
    <X className="h-4 w-4" />
  </Button>
</div>
```

## Manejo de Diferentes Tipos de Input

### Input vs Textarea

```javascriptreact
{field === "requirements" ? (
  <Textarea
    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
    value={editValue}
    onChange={(e) => setEditValue(e.target.value)}
    onKeyDown={handleKeyDown}
    className={getInputClassName()}
    rows={3}
    disabled={saveStatus === "saving"}
  />
) : (
  <Input
    ref={inputRef as React.RefObject<HTMLInputElement>}
    type={type}
    value={editValue}
    onChange={(e) => setEditValue(e.target.value)}
    onKeyDown={handleKeyDown}
    className={getInputClassName()}
    disabled={saveStatus === "saving"}
  />
)}
```

## Mensajes de Ayuda y Error

### Estructura de Mensajes

```javascriptreact
{/* Error de Validación */}
{validationError && (
  <div className="flex items-center gap-2 text-red-600 text-xs">
    <AlertCircle className="h-3 w-3" />
    <span>{validationError}</span>
  </div>
)}

{/* Texto de Ayuda */}
<div className="text-xs text-gray-500">
  Presiona <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> para confirmar o{" "}
  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Escape</kbd> para cancelar
</div>
```

## Integración con Estado Global

### Actualización del Estado Padre

```typescript
// En el componente padre
const [extractedData, setExtractedData] = useState<ExtractedData>(initialData);

// En EditableField
setExtractedData((prev) => ({ ...prev, [field]: editValue }));
```

## Consideraciones de Implementación

### 1. Dependencias Requeridas

- React hooks: `useState`, `useEffect`, `useRef`
- Iconos: `lucide-react` o similar
- Componentes UI: Button, Input, Textarea

### 2. Estilos CSS

- Tailwind CSS para clases utilitarias
- Transiciones suaves con `transition-all duration-200`
- Estados hover y focus bien definidos

### 3. Accesibilidad

- `title` attributes en botones para tooltips
- `aria-label` apropiados
- Manejo de teclado completo
- Focus management automático

### 4. Performance

- Debounce en validación si es necesario
- Memoización de funciones costosas
- Cleanup de timeouts en useEffect

## Ejemplo de Uso

```javascriptreact
<EditableField
  field="solicitante"
  value={extractedData.solicitante}
  label="Nombre del Solicitante"
  type="text"
  originalText={originalDocumentText}
/>
```

Esta documentación proporciona todos los elementos necesarios para implementar el sistema de edición inline en cualquier aplicación React con las mismas funcionalidades y comportamientos.

# Documentación: Lógica de Edición e Inserción de Productos

## Resumen General

Esta documentación describe la lógica de negocio para la **edición e inserción de productos** en el sistema RFX, separando completamente la funcionalidad del diseño visual.

---

## Estructura de Datos del Producto

### **ProductoIndividual Interface**

```typescript
interface ProductoIndividual {
  id: string; // Identificador único
  nombre: string; // Nombre del producto
  cantidad: number; // Cantidad original del backend
  cantidadOriginal: number; // Copia inmutable de la cantidad original
  cantidadEditada: number; // Cantidad modificable por el usuario
  unidad: string; // Unidad de medida (kg, personas, horas, etc.)
  precio: number; // Precio unitario
  isQuantityModified: boolean; // Flag que indica si la cantidad fue modificada
}
```

---

## Sistema de Monedas

### **Monedas Disponibles**

```typescript
const currencies = [
  { value: "EUR", label: "EUR - Euro", symbol: "€" },
  { value: "USD", label: "USD - US Dollar", symbol: "$" },
  { value: "MXN", label: "MXN - Peso Mexicano", symbol: "$" },
  { value: "VES", label: "VES - Bolívar Venezolano", symbol: "Bs" },
];
```

### **Lógica de Cambio de Moneda**

- **Estado**: `selectedCurrency` (por defecto: "EUR")
- **Función**: `setCurrency(currencyCode: string)`
- **Efecto**: Cambia el símbolo mostrado en todos los campos de precio
- **Conversión**: No se realiza conversión automática de precios existentes
- **Formato**: Utiliza `formatPrice()` y `formatPriceWithSymbol()` para mostrar valores

---

## ️ Lógica de Edición de Productos

### **Campos Editables**

1. **Cantidad** (`cantidadEditada`)

1. Tipo: `number`
1. Validación: Debe ser ≥ 0 y número entero
1. Efecto: Actualiza `isQuantityModified` si difiere de `cantidadOriginal`

1. **Unidad** (`unidad`)

1. Tipo: `string`
1. Validación: No puede estar vacía
1. Ejemplos: "personas", "kg", "horas", "unidades"

1. **Precio Unitario** (`precio`)

1. Tipo: `number`
1. Validación: Debe ser ≥ 0
1. Formato: 2 decimales
1. Moneda: Se muestra con el símbolo de la moneda seleccionada

### **Funciones de Edición**

```typescript
// Cambiar cantidad
handleQuantityChange(productId: string, newQuantity: number)
// Cambiar precio
handleProductPriceChange(productId: string, newPrice: number)
// Cambiar unidad
handleUnitChange(productId: string, newUnit: string)
```

### **Validaciones por Campo**

```typescript
// Validación de cantidad
const validateQuantity = (value: number): string | null => {
  if (value < 0) return "La cantidad no puede ser negativa";
  if (!Number.isInteger(value)) return "La cantidad debe ser un número entero";
  return null;
};

// Validación de precio
const validatePrice = (value: number): string | null => {
  if (value < 0) return "El precio no puede ser negativo";
  return null;
};
```

---

## Lógica de Inserción de Productos

### **Campos Obligatorios**

1. **Nombre** (`nombre`) - string, no vacío
2. **Unidad** (`unidad`) - string, no vacío

### **Campos Opcionales con Valores por Defecto**

1. **Cantidad** (`cantidad`) - number, por defecto: 1
2. **Precio** (`precio`) - number, por defecto: 0

### **Proceso de Inserción**

```typescript
const handleAddProduct = (productData) => {
  const newProduct: ProductoIndividual = {
    id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    nombre: productData.nombre,
    cantidad: productData.cantidad,
    cantidadOriginal: productData.cantidad,
    cantidadEditada: productData.cantidad,
    unidad: productData.unidad,
    precio: productData.precio,
    isQuantityModified: false,
  };

  setProductosIndividuales((prev) => [...prev, newProduct]);
};
```

### **Estados del Formulario de Inserción**

- **isAddingProduct**: `boolean` - Controla la visibilidad del formulario
- **newProduct**: Objeto temporal con los datos del nuevo producto
- **Validación**: Se ejecuta antes de la inserción

---

## Distribución y Orden de Campos

### **Orden de Campos (Izquierda a Derecha)**

1. **Nombre del Producto** (4 columnas) - Campo principal
2. **Cantidad** (2 columnas) - Numérico, centrado
3. **Unidad** (2 columnas) - Texto, centrado
4. **Precio Unitario** (2 columnas) - Numérico con símbolo de moneda
5. **Subtotal** (2 columnas) - Calculado automáticamente, solo lectura

### **Cálculo Automático**

```typescript
const subtotal = producto.cantidadEditada * producto.precio;
```

---

## Estados y Flujos de Datos

### **Estados Principales**

```typescript
const [productosIndividuales, setProductosIndividuales] = useState<
  ProductoIndividual[]
>([]);
const [selectedCurrency, setCurrency] = useState("EUR");
const [isAddingProduct, setIsAddingProduct] = useState(false);
```

### **Flujo de Edición**

1. Usuario hace clic en campo editable
2. Campo entra en modo edición (input visible)
3. Usuario modifica valor
4. Validación en tiempo real
5. Confirmación con Enter o pérdida de foco
6. Actualización del estado global
7. Recálculo automático de subtotales

### **Flujo de Inserción**

1. Usuario activa modo inserción (`isAddingProduct = true`)
2. Formulario inline se hace visible
3. Usuario completa campos obligatorios
4. Validación de campos requeridos
5. Generación de ID único
6. Inserción en array de productos
7. Reset del formulario y ocultación

---

## ️ Controles de Teclado

### **Edición Inline**

- **Enter**: Confirmar cambios
- **Escape**: Cancelar cambios
- **Tab**: Navegar entre campos

### **Formulario de Inserción**

- **Enter**: Agregar producto (si validación pasa)
- **Escape**: Cancelar y ocultar formulario

---

## Características Especiales

### **Tracking de Modificaciones**

- `isQuantityModified`: Indica si la cantidad fue modificada respecto al original
- Permite mostrar indicadores visuales de cambios
- Útil para auditoría y confirmaciones

### **Generación de IDs**

- **Productos del Backend**: Usan ID real de base de datos
- **Productos Manuales**: `manual-${timestamp}-${random}`
- Garantiza unicidad y trazabilidad

### **Persistencia de Datos**

- Cambios se reflejan inmediatamente en el estado
- Función `saveProductCosts()` para persistir en backend
- Auto-guardado por campo individual

### **Manejo de Errores**

- Validación por campo con mensajes específicos
- Prevención de valores inválidos
- Feedback inmediato al usuario

---

## Funciones Utilitarias

### **Formateo de Moneda**

```typescript
formatPrice(price: number, currency: string): string
formatPriceWithSymbol(price: number): string
getCurrencyInfo(currency: string): CurrencyInfo
```

### **Validaciones**

```typescript
validateQuantity(value: number): string | null
validatePrice(value: number): string | null
```

### **Manipulación de Estado**

```typescript
handleQuantityChange(productId: string, newQuantity: number): void
handleProductPriceChange(productId: string, newPrice: number): void
handleUnitChange(productId: string, newUnit: string): void
handleAddProduct(productData: ProductData): void
```

---

## Casos de Uso Principales

1. **Editar cantidad de producto existente**
2. **Cambiar precio unitario**
3. **Modificar unidad de medida**
4. **Agregar producto manualmente**
5. **Cambiar moneda de visualización**
6. **Calcular subtotales automáticamente**
7. **Validar datos antes de guardar**
8. **Trackear modificaciones para auditoría**

Esta lógica de negocio es completamente independiente del diseño y puede ser implementada con cualquier framework o librería de UI.
