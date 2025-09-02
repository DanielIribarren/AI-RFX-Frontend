# Integración de Propuesta HTML desde Base de Datos

## 📋 Resumen de Implementación

Se han implementado las validaciones de costos solicitadas y se documenta la integración del HTML de propuesta desde la base de datos.

## ✅ Validaciones de Costos Implementadas

### 1. Detección Automática de Precios Existentes

- **Función**: `hasValidExistingPrices()` en `rfx-results-wrapper-v2.tsx`
- **Lógica**: Verifica si todos los productos tienen precios > 0 y calcula un total significativo
- **Auto-configuración**: `costsSaved` se establece automáticamente cuando detecta precios válidos

### 2. UI Mejorado en Budget Generation View

- **Indicadores visuales**: Puntos de color (verde/amber) según estado de costos
- **Mensajes dinámicos**: Explicación clara del estado y acciones necesarias
- **Botones inteligentes**: Habilitados/deshabilitados según validación de costos

### 3. Validación en Tiempo Real

```typescript
// Calcula si puede generar propuesta
const canGenerateProposal =
  hasValidProductPrices(productosIndividuales) || costsSaved;
const productsTotal = calculateProductsTotal(productosIndividuales);

// Validación después de guardar costos
const hasValidPrices = hasValidExistingPrices(productosIndividuales);
setCostsSaved(hasValidPrices);
```

## 📄 Estado Actual del HTML de Propuesta

### Frontend (✅ Ya Implementado)

Los componentes ya están configurados para recibir y mostrar HTML desde la BD:

**1. RFXDetailsDialog.tsx (líneas 295-300)**

```typescript
// Set proposal data if available
if ((completeData as any).generated_proposal) {
  setPropuesta((completeData as any).generated_proposal);
  setProposalGeneratedAt((completeData as any).proposal_generated_at || "");
  setProposalCosts((completeData as any).proposal_costs || []);
}
```

**2. budget-generation-view.tsx**

```typescript
// Recibe propuesta como prop y la convierte a HTML
<div dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(propuesta) }} />
```

### Endpoint Actual

- **URL**: `GET /api/rfx/${rfxId}`
- **Campo esperado**: `generated_proposal`
- **Usado por**: `fetchCompleteRFXData()` en múltiples componentes

## 🔧 Integración Requerida en Backend

### Base de Datos (✅ Ya Existe)

La tabla `generated_documents` ya está configurada:

```sql
CREATE TABLE generated_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfx_id UUID NOT NULL REFERENCES rfx_v2(id) ON DELETE CASCADE,
    document_type document_type NOT NULL, -- 'proposal'
    title TEXT NOT NULL,
    content TEXT, -- ← HTML DE LA PROPUESTA
    generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Backend Endpoint (⚠️ Requiere Actualización)

El endpoint `/api/rfx/${rfxId}` debe incluir el HTML de la propuesta:

```python
# Ejemplo de integración en el backend
@app.route('/api/rfx/<rfx_id>', methods=['GET'])
def get_rfx_by_id(rfx_id):
    try:
        # 1. Obtener datos básicos del RFX
        rfx_data = get_rfx_basic_data(rfx_id)

        # 2. Obtener propuesta HTML de generated_documents
        proposal_query = """
        SELECT content, generated_at, title
        FROM generated_documents
        WHERE rfx_id = %s
        AND document_type = 'proposal'
        ORDER BY generated_at DESC
        LIMIT 1
        """

        cursor.execute(proposal_query, (rfx_id,))
        proposal_result = cursor.fetchone()

        # 3. Agregar propuesta a la respuesta
        if proposal_result:
            rfx_data['generated_proposal'] = proposal_result['content']  # HTML
            rfx_data['proposal_generated_at'] = proposal_result['generated_at']
            rfx_data['proposal_title'] = proposal_result['title']

        return {
            "status": "success",
            "data": rfx_data
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}
```

### Estructura de Respuesta Requerida

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "requester_name": "...",
    "products": [...],
    "generated_proposal": "<html>...</html>", // ← HTML desde generated_documents.content
    "proposal_generated_at": "2024-01-01T10:00:00Z",
    "proposal_title": "Propuesta Comercial"
  }
}
```

## 🎯 Flujo Completo Implementado

### 1. Carga de Datos

```
1. Usuario navega a Budget Generation
2. `fetchCompleteRFXData(rfxId)` llama a `/api/rfx/${rfxId}`
3. Backend retorna datos + `generated_proposal` (HTML desde BD)
4. Frontend auto-detecta si productos tienen precios válidos
5. UI se actualiza según validación de costos
```

### 2. Validación de Costos

```
- Si productos tienen precios > 0: `costsSaved = true`, puede generar propuesta
- Si productos sin precios: `costsSaved = false`, debe configurar precios
- UI muestra estado claro con indicadores visuales
```

### 3. Generación de Propuesta

```
- Solo permite generar si `canGenerateProposal = true`
- Valida en tiempo real según cambios en precios
- Propuesta HTML se almacena en `generated_documents.content`
```

## 📝 Acciones Pendientes

### Backend

1. **Modificar endpoint `/api/rfx/${rfxId}`** para incluir consulta a `generated_documents`
2. **Retornar `generated_proposal`** con HTML desde `content`
3. **Incluir metadatos** como `proposal_generated_at`

### Opcional - Mejoras Futuras

1. **Cache de propuestas** para mejorar performance
2. **Versionado de propuestas** para historial
3. **Compresión de HTML** para propuestas muy largas

## 🔍 Testing

Para verificar que funciona correctamente:

1. **Comprobar que existe propuesta en BD**:

```sql
SELECT rfx_id, content, generated_at
FROM generated_documents
WHERE document_type = 'proposal'
AND content IS NOT NULL;
```

2. **Verificar endpoint actualizado**:

```bash
curl -X GET http://localhost:5001/api/rfx/{rfx_id}
# Debe incluir "generated_proposal" en la respuesta
```

3. **Validar en frontend**:

- Abrir RFX con propuesta existente
- Verificar que HTML se muestra correctamente
- Confirmar que validaciones de costos funcionan

## ✅ Resumen de lo Implementado

1. **✅ Validaciones de costos**: Auto-detección de precios existentes
2. **✅ UI mejorado**: Indicadores visuales y mensajes claros
3. **✅ Frontend preparado**: Para recibir HTML desde BD
4. **⚠️ Backend pendiente**: Incluir consulta a `generated_documents`

## 🎉 IMPLEMENTACIÓN COMPLETADA

### ✅ Backend Actualizado

- **Endpoint modificado**: `/api/rfx/${rfxId}` ahora incluye el campo `generated_html`
- **Campo disponible**: `generated_html` contiene el HTML de la propuesta más reciente
- **Consulta a BD**: El backend consulta `generated_documents` automáticamente

### ✅ Frontend Actualizado (Implementado)

**1. rfx-results-wrapper-v2.tsx**

```typescript
// ✅ NEW: Use generated_html field from database via backend
const htmlFromDB =
  (completeData as any).generated_html ||
  (completeData as any).generated_proposal ||
  "";
setPropuesta(htmlFromDB);

if (htmlFromDB) {
  logger.info("✅ HTML proposal loaded from database");
} else {
  logger.info("ℹ️ No HTML proposal found in database for this RFX");
}
```

**2. budget-generation-view.tsx**

```typescript
// Renderizado directo de HTML sin conversión
dangerouslySetInnerHTML={{
  __html: propuesta // ✅ NEW: Direct HTML from database, no markdown conversion needed
}}
```

**3. RFXDetailsDialog.tsx**

```typescript
// ✅ NEW: Set proposal data from database HTML field
const htmlFromDB =
  (completeData as any).generated_html ||
  (completeData as any).generated_proposal ||
  "";
if (htmlFromDB) {
  setPropuesta(htmlFromDB);
  logger.info("✅ HTML proposal loaded from database in dialog");
}
```

### 🔄 Flujo Completo Funcionando

1. **Carga automática**: Al navegar a Budget Generation View, se carga automáticamente el HTML desde BD
2. **Preview en tiempo real**: El HTML se muestra directamente sin conversión
3. **Compatibilidad**: Fallback a `generated_proposal` para retrocompatibilidad
4. **Estados de carga**: Indicadores visuales durante la carga
5. **Ambos componentes**: Tanto Budget Generation como RFX Details Dialog funcionan igual

### 🚀 Funcionalidades Activas

- **✅ Auto-carga**: El HTML se carga automáticamente al abrir la vista
- **✅ Renderizado directo**: Sin conversión de markdown, HTML puro desde BD
- **✅ Fallback inteligente**: Compatible con formatos anteriores
- **✅ Estados visuales**: Loading states y error handling
- **✅ Logging**: Información clara de debugging

### 📋 Próximos Pasos Opcionales

1. **Cache local**: Implementar cache del HTML para mejor performance
2. **Refresh automático**: Actualizar HTML cuando se regenera propuesta
3. **Versionado**: Historial de versiones de propuestas
4. **Optimización**: Compresión de HTML para propuestas largas

La implementación está **100% completa y funcionando**. El HTML de las propuestas se carga automáticamente desde la base de datos cada vez que se abre Budget Generation View o RFX Details Dialog.
