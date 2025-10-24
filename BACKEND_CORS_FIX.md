# 🔧 Fix CORS para Endpoints PATCH y DELETE

## Problema

El frontend está recibiendo el error `TypeError: Failed to fetch` al intentar hacer peticiones PATCH y DELETE:

**Endpoints PATCH (Pricing Configuration):**
- `PATCH /api/pricing/config/{rfx_id}/coordination`
- `PATCH /api/pricing/config/{rfx_id}/cost-per-person`
- `PATCH /api/pricing/config/{rfx_id}/taxes`

**Endpoints DELETE (Product Management):**
- `DELETE /api/rfx/{rfx_id}/products/{product_id}`

Este error ocurre porque el navegador está bloqueando las peticiones PATCH y DELETE debido a la configuración de CORS del backend.

## Solución

El backend necesita permitir explícitamente el método `PATCH` en su configuración de CORS.

### Ubicación del archivo

Busca el archivo donde se configura CORS en el backend, probablemente:
- `backend/app.py` o `backend/main.py`
- `backend/api/__init__.py`
- O donde se inicializa Flask/FastAPI

### Configuración Requerida

#### Si usas Flask-CORS:

```python
from flask_cors import CORS

app = Flask(__name__)

# Configuración de CORS
CORS(app, 
     origins=["http://localhost:3000", "http://localhost:3001"],
     methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],  # ← Agregar PATCH
     allow_headers=["Content-Type", "Accept", "Authorization"],
     supports_credentials=True
)
```

#### Si usas FastAPI:

```python
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],  # ← Agregar PATCH
    allow_headers=["Content-Type", "Accept", "Authorization"],
)
```

#### Si usas decoradores @cross_origin:

```python
from flask_cors import cross_origin

@app.route('/api/pricing/config/<rfx_id>/coordination', methods=['PATCH'])
@cross_origin(methods=['PATCH'])  # ← Especificar PATCH
def update_coordination(rfx_id):
    # ...
```

### Verificación

Después de hacer el cambio:

1. Reinicia el servidor backend
2. Verifica que los headers de CORS incluyan PATCH:
   ```bash
   curl -X OPTIONS http://localhost:5001/api/pricing/config/test-uuid/coordination \
     -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: PATCH" \
     -v
   ```

3. Deberías ver en la respuesta:
   ```
   Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
   ```

## Workaround Temporal (Frontend)

Mientras se arregla el backend, el frontend ya está configurado para:
- ✅ No mostrar errores al usuario
- ✅ Mostrar "Guardado" aunque el backend no responda
- ✅ Continuar funcionando en modo offline
- ✅ Logs claros en consola para debugging

## Testing

Una vez arreglado CORS, deberías ver en la consola del navegador:

```
🔧 Pricing API Configuration: {...}
💾 Optimized update - detecting changed fields: ["cost_per_person_enabled"]
🎯 Using PATCH /cost-per-person endpoint
🌐 API Request: PATCH http://localhost:5001/api/pricing/config/{rfx_id}/cost-per-person
📡 Response status: 200 OK
📄 Response body: {"status":"success","data":{...}}
✅ API Success: {...}
✅ Cost per person update response: {...}
✅ Pricing configuration auto-saved successfully
```

En lugar de:
```
❌ Network error: TypeError: Failed to fetch
⚠️ Backend not available - changes saved locally only
```
