# 🔍 Debugging HTML Proposal Integration

## 🎯 Problema

El endpoint `/api/rfx/${rfxId}` devuelve correctamente el campo `generated_html`, pero no se está renderizando en `budget-generation-view.tsx` ni en `RFXDetailsDialog.tsx`.

## 🛠️ Debugging Añadido

He añadido logs de debugging extensivos en ambos componentes para identificar exactamente dónde está el problema:

### 1. **fetchCompleteRFXData** (Ambos componentes)

```typescript
// ✅ Debugging en la llamada al API
console.log("🔍 DEBUG: Fetching RFX data from URL:", url);
console.log("🔍 DEBUG: Response status:", response.status);
console.log("🔍 DEBUG: Raw API response:", JSON.stringify(result, null, 2));
console.log(
  "🔍 DEBUG: generated_html in response:",
  result.data?.generated_html
);
```

### 2. **rfx-results-wrapper-v2.tsx**

```typescript
// ✅ Debugging en extracción de datos
console.log("🔍 DEBUG: Complete backend data keys:", Object.keys(completeData));
console.log(
  "🔍 DEBUG: generated_html field:",
  (completeData as any).generated_html
);
console.log(
  "🔍 DEBUG: Full completeData object:",
  JSON.stringify(completeData, null, 2)
);

// ✅ Debugging después de setPropuesta
if (htmlFromDB) {
  console.log(
    "✅ HTML proposal loaded from database, length:",
    htmlFromDB.length
  );
} else {
  console.log("⚠️ No HTML content found in response");
}
```

### 3. **budget-generation-view.tsx**

```typescript
// ✅ Debugging de prop recibida
console.log("🔍 DEBUG BudgetGenerationView: propuesta prop received:", propuesta)
console.log("🔍 DEBUG BudgetGenerationView: propuesta length:", propuesta?.length || 0)

// ✅ Debugging visual en el UI
<div className="mb-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
  DEBUG: Propuesta encontrada, longitud: {propuesta.length} caracteres
</div>
```

### 4. **RFXDetailsDialog.tsx**

```typescript
// ✅ Debugging de estado
console.log("🔍 DEBUG RFXDetailsDialog: Current propuesta state:", propuesta)
console.log("🔍 DEBUG RFXDetailsDialog: Dialog isOpen:", isOpen)

// ✅ Debugging visual en el UI
<div className="mb-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
  DEBUG RFXDetailsDialog: Propuesta encontrada, longitud: {propuesta.length} caracteres
</div>
```

## 🧪 Cómo Probar

### Paso 1: Abrir Budget Generation View

1. Navegar a un RFX que tenga propuesta HTML en la BD
2. Ir a Budget Generation View
3. **Abrir DevTools Console** y buscar estos logs:

```
🔍 DEBUG: Fetching RFX data from URL: http://localhost:5001/api/rfx/[UUID]
🔍 DEBUG: Response status: 200
🔍 DEBUG: generated_html in response: [DEBERÍA MOSTRAR EL HTML]
🔍 DEBUG: Complete backend data keys: [ARRAY DE KEYS]
🔍 DEBUG: generated_html field: [HTML CONTENT]
✅ HTML proposal loaded from database, length: [NÚMERO]
🔍 DEBUG BudgetGenerationView: propuesta prop received: [HTML]
```

### Paso 2: Abrir RFXDetailsDialog

1. Desde el historial, hacer clic en "Ver detalles" de un RFX
2. **Abrir DevTools Console** y buscar logs similares con prefijo "RFXDetailsDialog"

### Paso 3: Verificar UI

- **Si hay HTML**: Debería aparecer un banner azul con "DEBUG: Propuesta encontrada, longitud: X caracteres"
- **Si no hay HTML**: Aparecerá el mensaje "No hay propuesta generada para este RFX"

## 🔍 Posibles Problemas a Identificar

### A. El endpoint no se está llamando

**Síntomas**: No aparecen logs de "Fetching RFX data from URL"
**Causa**: Problema en el flujo de navegación o rfxId inválido

### B. El endpoint no retorna generated_html

**Síntomas**: Log muestra "generated_html in response: undefined" o "null"
**Causa**:

- No hay propuesta HTML en la BD para ese RFX
- El backend no está consultando correctamente `generated_documents`
- Campo `content_html` o `content` vacío en la BD

### C. El HTML llega pero no se extrae

**Síntomas**:

- "generated_html in response: [HTML]" ✅
- "No HTML content found in response" ❌
  **Causa**: Error en la lógica de extracción de datos

### D. El HTML se extrae pero no llega al componente

**Síntomas**:

- "HTML proposal loaded from database" ✅
- "propuesta prop received: [VACÍO]" ❌
  **Causa**: Error en el paso de props entre wrapper y componente

### E. El HTML llega al componente pero no se renderiza

**Síntomas**:

- "propuesta prop received: [HTML]" ✅
- Banner DEBUG no aparece en UI ❌
  **Causa**: Error en la lógica de renderizado o condiciones

## 📊 Verificación en Backend

### Verificar que existe HTML en BD

```sql
SELECT rfx_id, content, length(content) as content_length, generated_at
FROM generated_documents
WHERE document_type = 'proposal'
AND content IS NOT NULL
AND content != ''
ORDER BY generated_at DESC;
```

### Verificar endpoint específico

```bash
curl -X GET http://localhost:5001/api/rfx/[RFX_UUID] | jq '.data.generated_html'
```

## 🎯 Próximos Pasos

1. **Ejecutar las pruebas** con DevTools abierto
2. **Copiar todos los logs** relevantes
3. **Identificar en qué paso** se rompe el flujo
4. **Reportar hallazgos** con los logs específicos

Con este debugging extensivo, deberíamos poder identificar exactamente dónde está el problema en el flujo de datos desde el backend hasta el renderizado del HTML.
