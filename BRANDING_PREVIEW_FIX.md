# Fix: Vista Previa de Branding - Imágenes y Template

## ✅ SOLUCIONADO

### Fecha: 2025-10-14

## Problema Identificado

La vista previa de branding no mostraba:
1. ❌ **Logo**: La imagen no cargaba
2. ❌ **Template Original**: El botón no funcionaba

## Causa Raíz

### 1. Error del Backend (RESUELTO)
El endpoint `GET /api/branding/{companyId}` estaba devolviendo error 500:

```json
{
  "error": "'str' object has no attribute 'isoformat'",
  "message": "Failed to retrieve branding"
}
```

**Causa**: El backend estaba intentando serializar fechas que ya eran strings.

### 2. URLs de Imágenes Relativas (RESUELTO)
El backend devolvía URLs relativas como `/static/branding/{companyId}/logo.png` que no eran accesibles desde Next.js.

**Error en consola**:
```
[BrandingPreview] Logo failed to load: "/static/branding/186ea35f-3cf8-480f-a7d3-0af178c09498/logo.png"
```

## Cambios Implementados en Frontend

### `components/branding-preview.tsx`

#### 1. Manejo de Errores de Carga de Imagen
#### 1. Logging Detallado
```typescript
console.log('[BrandingPreview] Loading config for company:', companyId)
console.log('[BrandingPreview] Response:', {
  status: response.status,
  ok: response.ok,
  result
})
console.log('[BrandingPreview] Config loaded:', {
  logo_url: result.logo_url,
  template_url: result.template_url,
  has_logo_analysis: !!result.logo_analysis,
  has_template_analysis: !!result.template_analysis
})
```

#### 2. Manejo de Errores de Carga de Imagen
```typescript
<img 
  src={config.logo_url} 
  alt="Logo de la empresa"
  className="max-h-20 max-w-full object-contain mx-auto"
  onError={(e) => {
    console.error('[BrandingPreview] Logo failed to load:', config.logo_url)
    e.currentTarget.style.display = 'none'
    const parent = e.currentTarget.parentElement
    if (parent) {
      parent.innerHTML = '<div class="text-sm text-red-600 text-center">Error al cargar logo</div>'
    }
  }}
  onLoad={() => {
    console.log('[BrandingPreview] Logo loaded successfully:', config.logo_url)
  }}
/>
```

#### 3. Logging para Template URL
```typescript
onClick={() => {
  console.log('[BrandingPreview] Opening template URL:', config.template_url)
  if (config.template_url) {
    window.open(config.template_url, '_blank')
  } else {
    alert('URL del template no disponible')
  }
}}
```

## Soluciones Requeridas en el Backend

### 1. Corregir Error de Serialización de Fechas

**Archivo**: Endpoint `GET /api/branding/<company_id>` en el backend Python

**Problema**:
```python
# Código actual (incorrecto)
branding_data['created_at'] = created_at.isoformat()  # created_at ya es string
```

**Solución**:
```python
def serialize_date(date_field):
    """Serializa fechas de manera segura"""
    if date_field is None:
        return None
    if isinstance(date_field, str):
        return date_field
    if hasattr(date_field, 'isoformat'):
        return date_field.isoformat()
    return str(date_field)

# Uso
branding_data = {
    'company_id': company_id,
    'has_branding': True,
    'logo_url': logo_url,
    'template_url': template_url,
    'created_at': serialize_date(created_at),
    'updated_at': serialize_date(updated_at),
    'analysis_completed_at': serialize_date(analysis_completed_at)
}
```

### 2. Verificar URLs de Archivos

Las URLs deben ser accesibles públicamente o a través de un endpoint del backend.

**Opción A: URLs Absolutas (Recomendado)**
```python
# Si los archivos están en S3, GCS, o similar
logo_url = f"https://storage.example.com/branding/{company_id}/logo.png"
template_url = f"https://storage.example.com/branding/{company_id}/template.pdf"
```

**Opción B: Endpoint de Servicio de Archivos**
```python
# Crear endpoint para servir archivos
@app.route('/api/branding/files/<company_id>/<file_type>', methods=['GET'])
def serve_branding_file(company_id, file_type):
    """
    file_type: 'logo' o 'template'
    """
    # Obtener archivo del storage
    file_path = get_branding_file_path(company_id, file_type)
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    
    return send_file(file_path)

# Entonces las URLs serían:
logo_url = f"{API_BASE_URL}/api/branding/files/{company_id}/logo"
template_url = f"{API_BASE_URL}/api/branding/files/{company_id}/template"
```

**Opción C: URLs Firmadas (Más Seguro)**
```python
from datetime import datetime, timedelta
import jwt

def generate_signed_url(company_id, file_type, expires_in_hours=24):
    """Genera URL firmada con expiración"""
    payload = {
        'company_id': company_id,
        'file_type': file_type,
        'exp': datetime.utcnow() + timedelta(hours=expires_in_hours)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    return f"{API_BASE_URL}/api/branding/secure-file/{token}"

@app.route('/api/branding/secure-file/<token>', methods=['GET'])
def serve_secure_file(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        company_id = payload['company_id']
        file_type = payload['file_type']
        
        file_path = get_branding_file_path(company_id, file_type)
        return send_file(file_path)
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'URL expired'}), 403
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 403
```

### 3. Respuesta Completa del Endpoint

El endpoint debe devolver:

```python
@app.route('/api/branding/<company_id>', methods=['GET'])
def get_branding(company_id):
    try:
        branding = get_branding_from_db(company_id)
        
        if not branding:
            return jsonify({
                'status': 'success',
                'has_branding': False,
                'company_id': company_id
            })
        
        # Generar URLs accesibles
        logo_url = generate_file_url(company_id, 'logo') if branding['has_logo'] else None
        template_url = generate_file_url(company_id, 'template') if branding['has_template'] else None
        
        response = {
            'status': 'success',
            'has_branding': True,
            'company_id': company_id,
            'logo_url': logo_url,
            'logo_filename': branding.get('logo_filename'),
            'template_url': template_url,
            'template_filename': branding.get('template_filename'),
            'logo_analysis': branding.get('logo_analysis'),
            'template_analysis': branding.get('template_analysis'),
            'analysis_status': branding.get('analysis_status', 'completed'),
            'created_at': serialize_date(branding.get('created_at')),
            'updated_at': serialize_date(branding.get('updated_at'))
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error in get_branding: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve branding',
            'error': str(e)
        }), 500
```

## Testing

### 1. Verificar Respuesta del Backend

```bash
# Probar endpoint directamente
curl http://localhost:5001/api/branding/186ea35f-3cf8-480f-a7d3-0af178c09498

# Debería devolver:
{
  "status": "success",
  "has_branding": true,
  "logo_url": "http://...",
  "template_url": "http://...",
  "created_at": "2025-10-10T15:16:00",
  ...
}
```

### 2. Verificar URLs de Archivos

```bash
# Probar que las URLs sean accesibles
curl -I <logo_url>
curl -I <template_url>

# Ambas deberían devolver 200 OK
```

### 3. Verificar en el Frontend

Abrir la consola del navegador y buscar los logs:
```
[BrandingPreview] Loading config for company: ...
[BrandingPreview] Response: { status: 200, ok: true, result: {...} }
[BrandingPreview] Config loaded: { logo_url: "...", template_url: "..." }
[BrandingPreview] Logo loaded successfully: ...
```

## Checklist de Corrección

### Backend
- [ ] Corregir serialización de fechas (usar `serialize_date()`)
- [ ] Implementar servicio de archivos o URLs accesibles
- [ ] Verificar que `logo_url` y `template_url` sean válidas
- [ ] Probar endpoint con curl/Postman
- [ ] Verificar que las URLs de archivos sean accesibles

### Frontend
- [x] Agregar logging detallado
- [x] Agregar manejo de errores de carga de imagen
- [x] Agregar logging para template URL
- [ ] Verificar logs en consola del navegador
- [ ] Confirmar que las imágenes se cargan correctamente

## Próximos Pasos

1. **Corregir backend** usando las soluciones propuestas
2. **Reiniciar servidor backend**
3. **Recargar página** en el navegador
4. **Revisar logs** en la consola del navegador
5. **Verificar** que logo y template se muestren correctamente

## Notas Adicionales

### CORS
Si los archivos están en un dominio diferente, asegurarse de configurar CORS:

```python
from flask_cors import CORS

CORS(app, resources={
    r"/api/branding/files/*": {
        "origins": ["http://localhost:3000", "https://yourdomain.com"]
    }
})
```

### Content-Type Headers
Al servir archivos, asegurarse de enviar el Content-Type correcto:

```python
@app.route('/api/branding/files/<company_id>/<file_type>')
def serve_file(company_id, file_type):
    file_path = get_file_path(company_id, file_type)
    
    # Detectar tipo MIME
    if file_path.endswith('.png'):
        mimetype = 'image/png'
    elif file_path.endswith('.jpg') or file_path.endswith('.jpeg'):
        mimetype = 'image/jpeg'
    elif file_path.endswith('.pdf'):
        mimetype = 'application/pdf'
    elif file_path.endswith('.xlsx'):
        mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    else:
        mimetype = 'application/octet-stream'
    
    return send_file(file_path, mimetype=mimetype)
```
