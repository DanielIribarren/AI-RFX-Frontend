# Backend Branding API Bug

## Error Identificado
**Fecha**: 2025-10-10  
**Endpoint**: `GET /api/branding/{companyId}`  
**Status**: 500 Internal Server Error

## Mensaje de Error
```json
{
  "error": "'str' object has no attribute 'isoformat'",
  "message": "Failed to retrieve branding",
  "status": "error"
}
```

## Causa Raíz
El backend de Python está intentando llamar `.isoformat()` en un campo de fecha que ya es un string en lugar de un objeto `datetime`.

## Ubicación Probable del Bug
En el backend Python, buscar en el endpoint `/api/branding/<company_id>`:
- Serialización de campos de fecha (`created_at`, `updated_at`, etc.)
- Conversión de objetos de base de datos a JSON

## Solución Requerida en el Backend

### Opción 1: Verificar tipo antes de serializar
```python
# En el endpoint de branding
def serialize_date(date_field):
    if isinstance(date_field, str):
        return date_field
    elif hasattr(date_field, 'isoformat'):
        return date_field.isoformat()
    return None
```

### Opción 2: Asegurar que las fechas sean objetos datetime
```python
from datetime import datetime

# Al recuperar de la base de datos
if isinstance(branding_data['created_at'], str):
    branding_data['created_at'] = datetime.fromisoformat(branding_data['created_at'])
```

### Opción 3: Usar un serializador robusto
```python
import json
from datetime import datetime

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# Al retornar la respuesta
return jsonify(branding_data, cls=DateTimeEncoder)
```

## Campos Afectados
Probablemente:
- `created_at`
- `updated_at`
- `analysis_completed_at`
- Cualquier otro campo de timestamp

## Impacto
- Los usuarios no pueden ver su configuración de branding existente
- El componente de branding upload no puede cargar el estado actual
- Afecta al company_id: `186ea35f-3cf8-480f-a7d3-0af178c09498`

## Workaround Temporal (Frontend)
Ninguno disponible - el error debe corregirse en el backend.

## Próximos Pasos
1. Localizar el archivo del backend que maneja `GET /api/branding/<company_id>`
2. Identificar dónde se serializa la respuesta JSON
3. Agregar manejo de tipos para campos de fecha
4. Probar con el company_id afectado
5. Verificar que no afecte otros endpoints
