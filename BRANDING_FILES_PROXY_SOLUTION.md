# Solución: Proxy de Archivos de Branding

## ✅ IMPLEMENTADO - 2025-10-14

## Problema

El backend devolvía URLs relativas para logo y template:

```text
/static/branding/186ea35f-3cf8-480f-a7d3-0af178c09498/logo.png
```

Estas URLs no eran accesibles desde Next.js, causando errores al cargar las imágenes.

## Solución Implementada

### 1. Nuevo Endpoint API - Proxy de Archivos

**Archivo**: `app/api/branding/files/[companyId]/[fileType]/route.ts`

Este endpoint actúa como proxy entre Next.js y el backend Python:

```typescript
GET /api/branding/files/{companyId}/{fileType}
```

**Parámetros**:
- `companyId`: ID de la empresa
- `fileType`: `logo` o `template`

**Funcionalidad**:
1. Recibe request del frontend
2. Hace fetch al backend Python
3. Obtiene el archivo como blob
4. Lo sirve con los headers correctos
5. Incluye cache headers para optimización

**Características**:
- ✅ Validación de `fileType`
- ✅ Logging detallado
- ✅ Manejo de errores
- ✅ Headers de cache (`max-age=31536000`)
- ✅ Content-Type dinámico

### 2. Transformación de URLs en el Frontend

**Archivo**: `components/branding-preview.tsx`

**Función `transformFileUrl`**:

```typescript
const transformFileUrl = (backendUrl: string | undefined, fileType: 'logo' | 'template'): string | undefined => {
  if (!backendUrl) return undefined
  
  // Si ya es una URL completa (http/https), devolverla tal cual
  if (backendUrl.startsWith('http://') || backendUrl.startsWith('https://')) {
    return backendUrl
  }
  
  // Si es una ruta relativa del backend, convertirla a nuestra API
  return `/api/branding/files/${companyId}/${fileType}`
}
```

**Uso**:

```typescript
const transformedConfig = {
  ...result,
  logo_url: transformFileUrl(result.logo_url, 'logo'),
  template_url: transformFileUrl(result.template_url, 'template')
}
```

## Flujo Completo

### Carga de Logo

1. **Frontend** llama a `GET /api/branding/{companyId}`
2. **Backend** responde con `logo_url: "/static/branding/{companyId}/logo.png"`
3. **Frontend** transforma a `/api/branding/files/{companyId}/logo`
4. **Browser** solicita la imagen a `/api/branding/files/{companyId}/logo`
5. **Next.js API** hace proxy al backend Python
6. **Backend** devuelve el archivo
7. **Next.js API** sirve el archivo al browser
8. **Browser** muestra la imagen

### Ventajas de esta Solución

1. **Transparente**: El backend no necesita cambios
2. **Flexible**: Soporta URLs relativas y absolutas
3. **Cacheable**: Headers de cache optimizan rendimiento
4. **Seguro**: Validación de parámetros
5. **Debuggeable**: Logging completo en cada paso

## Archivos Modificados

### Nuevos Archivos

- `app/api/branding/files/[companyId]/[fileType]/route.ts`

### Archivos Modificados

- `components/branding-preview.tsx`
  - Agregada función `transformFileUrl`
  - Transformación de URLs en `loadBrandingConfig`
  - Logging mejorado

## Testing

### 1. Verificar Transformación de URLs

Abrir consola del navegador y buscar:

```text
[BrandingPreview] Config loaded: {
  original_logo_url: "/static/branding/186ea35f.../logo.png",
  transformed_logo_url: "/api/branding/files/186ea35f.../logo",
  ...
}
```

### 2. Verificar Carga de Archivos

Buscar en consola:

```text
[Branding Files] Fetching logo for company: 186ea35f...
[Branding Files] Backend URL: http://localhost:5001/api/branding/files/186ea35f.../logo
[Branding Files] Serving logo with content-type: image/png
[BrandingPreview] Logo loaded successfully: /api/branding/files/186ea35f.../logo
```

### 3. Verificar en Network Tab

En DevTools > Network:
- Request a `/api/branding/files/{companyId}/logo` debe devolver 200
- Content-Type debe ser `image/png` o similar
- Cache-Control debe estar presente

## Compatibilidad

### URLs Soportadas

✅ **Rutas relativas del backend**:
```text
/static/branding/{companyId}/logo.png
→ /api/branding/files/{companyId}/logo
```

✅ **URLs absolutas** (sin cambios):
```text
https://storage.example.com/logo.png
→ https://storage.example.com/logo.png
```

✅ **URLs del backend local**:
```text
http://localhost:5001/static/branding/{companyId}/logo.png
→ http://localhost:5001/static/branding/{companyId}/logo.png
```

## Próximos Pasos (Opcional)

### Optimizaciones Futuras

1. **Image Optimization**: Usar Next.js Image Optimization API
2. **CDN**: Cachear archivos en CDN
3. **Lazy Loading**: Cargar imágenes solo cuando sean visibles
4. **Thumbnails**: Generar versiones optimizadas de las imágenes

### Mejoras de Seguridad

1. **Rate Limiting**: Limitar requests por IP
2. **Authentication**: Verificar que el usuario tenga acceso a la empresa
3. **Signed URLs**: URLs con expiración temporal

## Notas

- El endpoint soporta cualquier tipo de archivo que el backend devuelva
- Los headers de cache son agresivos (`immutable`) porque los archivos no cambian
- Si se re-sube un archivo, se debe usar un nuevo nombre o invalidar cache
