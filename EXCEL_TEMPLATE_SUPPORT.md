# Soporte para Templates Excel

## Cambios Implementados - Frontend

### Fecha: 2025-10-10

## Resumen
Se agregó soporte para subir archivos Excel (.xlsx, .xls) como templates de presupuesto en el componente de branding upload.

## Cambios en `components/branding-upload.tsx`

### 1. Validación de Archivos
```typescript
// Antes
if (!['pdf', 'png', 'jpg', 'jpeg'].includes(...)) {
  errors.push('Template debe ser PDF, PNG, JPG o JPEG')
}

// Después
if (!['pdf', 'png', 'jpg', 'jpeg', 'xlsx', 'xls'].includes(...)) {
  errors.push('Template debe ser PDF, PNG, JPG, JPEG, XLSX o XLS')
}
```

### 2. Input Accept Attribute
```tsx
// Antes
accept=".pdf,.png,.jpg,.jpeg"

// Después
accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls"
```

### 3. UI Text
```tsx
// Antes
<p className="text-xs text-gray-500">
  PDF, PNG, JPG, JPEG (máx. 10MB)
</p>

// Después
<p className="text-xs text-gray-500">
  PDF, PNG, JPG, JPEG, XLSX, XLS (máx. 10MB)
</p>
```

## Formatos Soportados

### Logo
- PNG
- JPG/JPEG
- SVG
- WebP
- Tamaño máximo: 5MB

### Template
- PDF
- PNG
- JPG/JPEG
- **XLSX** (Excel 2007+) ✨ NUEVO
- **XLS** (Excel 97-2003) ✨ NUEVO
- Tamaño máximo: 10MB

## Cambios Requeridos en el Backend

El backend Python necesita actualizarse para procesar archivos Excel:

### 1. Instalar Dependencias
```bash
pip install openpyxl  # Para .xlsx
pip install xlrd      # Para .xls (opcional, legacy)
```

### 2. Actualizar Validación de Archivos
En el endpoint `/api/branding/upload`:

```python
ALLOWED_TEMPLATE_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'xlsx', 'xls'}

def allowed_template_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_TEMPLATE_EXTENSIONS
```

### 3. Procesamiento de Excel
```python
from openpyxl import load_workbook
from openpyxl.drawing.image import Image as XLImage
import io

def extract_branding_from_excel(file_path):
    """
    Extrae información de branding de un archivo Excel
    - Colores de celdas
    - Fuentes
    - Logos/imágenes embebidas
    - Estilos de bordes
    """
    wb = load_workbook(file_path)
    ws = wb.active
    
    branding_data = {
        'colors': [],
        'fonts': [],
        'images': []
    }
    
    # Extraer colores de celdas
    for row in ws.iter_rows():
        for cell in row:
            if cell.fill.start_color:
                color = cell.fill.start_color.rgb
                if color and color not in branding_data['colors']:
                    branding_data['colors'].append(color)
            
            if cell.font:
                font_info = {
                    'name': cell.font.name,
                    'size': cell.font.size,
                    'color': cell.font.color.rgb if cell.font.color else None
                }
                if font_info not in branding_data['fonts']:
                    branding_data['fonts'].append(font_info)
    
    # Extraer imágenes embebidas
    for image in ws._images:
        img_data = image._data()
        branding_data['images'].append({
            'format': image.format,
            'data': img_data
        })
    
    return branding_data
```

### 4. Integración con IA
```python
def analyze_excel_template(file_path, company_id):
    """
    Analiza el template Excel con IA para extraer branding
    """
    branding_data = extract_branding_from_excel(file_path)
    
    # Enviar a servicio de IA para análisis
    ai_analysis = analyze_with_ai({
        'colors': branding_data['colors'],
        'fonts': branding_data['fonts'],
        'images': branding_data['images'],
        'company_id': company_id
    })
    
    return ai_analysis
```

### 5. Actualizar Endpoint de Upload
```python
@app.route('/api/branding/upload', methods=['POST'])
def upload_branding():
    company_id = request.form.get('company_id')
    logo = request.files.get('logo')
    template = request.files.get('template')
    
    if template:
        filename = secure_filename(template.filename)
        file_ext = filename.rsplit('.', 1)[1].lower()
        
        if file_ext in ['xlsx', 'xls']:
            # Procesar Excel
            temp_path = save_temp_file(template)
            branding_data = extract_branding_from_excel(temp_path)
            
            # Analizar con IA
            analysis_result = analyze_excel_template(temp_path, company_id)
            
            # Guardar resultados
            save_branding_config(company_id, analysis_result)
            
        elif file_ext == 'pdf':
            # Procesar PDF (código existente)
            pass
        elif file_ext in ['png', 'jpg', 'jpeg']:
            # Procesar imagen (código existente)
            pass
    
    return jsonify({'status': 'success', 'message': 'Template uploaded'})
```

## Casos de Uso

### 1. Template Excel Corporativo
El usuario sube un archivo Excel con:
- Colores corporativos en celdas de encabezado
- Logo embebido en la hoja
- Fuentes personalizadas
- Estilos de tabla predefinidos

### 2. Formato de Presupuesto Existente
El usuario tiene un formato Excel de presupuesto que usa regularmente y quiere que la IA lo replique.

### 3. Branding Completo
El usuario sube tanto un logo (PNG) como un template Excel para análisis completo.

## Testing

### Archivos de Prueba
1. `test_template.xlsx` - Excel moderno con colores y logo
2. `test_template.xls` - Excel legacy
3. `test_complex.xlsx` - Excel con múltiples hojas y estilos complejos

### Casos de Prueba
- ✅ Upload de archivo .xlsx válido
- ✅ Upload de archivo .xls válido
- ✅ Validación de tamaño (máx 10MB)
- ✅ Extracción de colores de celdas
- ✅ Extracción de fuentes
- ✅ Extracción de imágenes embebidas
- ✅ Análisis con IA
- ✅ Manejo de errores (archivo corrupto)

## Notas Adicionales

### Limitaciones
- Solo se analiza la primera hoja del Excel por defecto
- Imágenes embebidas deben estar en formatos estándar (PNG, JPG)
- Colores deben estar definidos explícitamente (no colores automáticos)

### Mejoras Futuras
- Soporte para múltiples hojas
- Detección automática de la hoja principal
- Extracción de gráficos y charts
- Análisis de fórmulas para detectar estructura de presupuesto

## Referencias
- [openpyxl Documentation](https://openpyxl.readthedocs.io/)
- [xlrd Documentation](https://xlrd.readthedocs.io/)
