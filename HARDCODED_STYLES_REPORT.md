# 📊 Reporte de Estilos Hardcoded

**Fecha:** 13/1/2026

---

## 📈 Resumen

- **Archivos analizados:** 145
- **Archivos con issues:** 84
- **Archivos limpios:** 61

---

## 🔍 Issues por Tipo

### Colores hardcoded (bg-black, text-gray-600, etc.)

- **Ocurrencias:** 593
- **Archivos afectados:** 66
- **Sugerencia:** Usar tokens semánticos (bg-foreground, text-muted-foreground, etc.)

### Valores arbitrarios ([#8B5CF6], [347px], etc.)

- **Ocurrencias:** 56
- **Archivos afectados:** 26
- **Sugerencia:** Usar valores de la escala de Tailwind o tokens CSS

### Patrones repetidos que deberían ser utilidades

- **Ocurrencias:** 227
- **Archivos afectados:** 59
- **Sugerencia:** Crear utilidad CSS o componente reutilizable

---

## 📋 Archivos Prioritarios para Refactoring

### 1. `components/app-sidebar.tsx` (36 issues)

- **Colores hardcoded (bg-black, text-gray-600, etc.):** 17 ocurrencias
  ```tsx
  className="h-3 w-3 text-gray-500 flex-shrink-0 mt-0.5 group-data-[collapsible=icon]:hidden"
  ```
- **Valores arbitrarios ([#8B5CF6], [347px], etc.):** 16 ocurrencias
  ```tsx
  className="h-3 w-3 text-gray-500 flex-shrink-0 mt-0.5 group-data-[collapsible=icon]:hidden"
  ```
- **Patrones repetidos que deberían ser utilidades:** 3 ocurrencias
  ```tsx
  className="flex items-center justify-between"
  ```

### 2. `components/processed-files-content.tsx` (36 issues)

- **Colores hardcoded (bg-black, text-gray-600, etc.):** 23 ocurrencias
  ```tsx
  className="bg-green-100 text-green-800"
  ```
- **Patrones repetidos que deberían ser utilidades:** 13 ocurrencias
  ```tsx
  className="text-lg font-semibold text-gray-800 flex items-center gap-2"
  ```

### 3. `components/rfx-history.tsx` (36 issues)

- **Colores hardcoded (bg-black, text-gray-600, etc.):** 27 ocurrencias
  ```tsx
  className="text-2xl font-semibold text-gray-900"
  ```
- **Valores arbitrarios ([#8B5CF6], [347px], etc.):** 1 ocurrencias
  ```tsx
  className="text-[10px] bg-green-100 text-green-700"
  ```
- **Patrones repetidos que deberían ser utilidades:** 8 ocurrencias
  ```tsx
  className="flex items-center justify-between mb-6"
  ```

### 4. `components/budget-preview-card.tsx` (32 issues)

- **Colores hardcoded (bg-black, text-gray-600, etc.):** 25 ocurrencias
  ```tsx
  className="text-lg font-semibold text-gray-800 flex items-center gap-2"
  ```
- **Patrones repetidos que deberían ser utilidades:** 7 ocurrencias
  ```tsx
  className="text-lg font-semibold text-gray-800 flex items-center gap-2"
  ```

### 5. `components/landing-page.tsx` (31 issues)

- **Colores hardcoded (bg-black, text-gray-600, etc.):** 27 ocurrencias
  ```tsx
  className="min-h-screen bg-white"
  ```
- **Patrones repetidos que deberían ser utilidades:** 4 ocurrencias
  ```tsx
  className="inline-flex items-center rounded-full border-2 border-gray-200 px-4 py-1.5 text-sm"
  ```

### 6. `app/(workspace)/profile/page.tsx` (31 issues)

- **Colores hardcoded (bg-black, text-gray-600, etc.):** 20 ocurrencias
  ```tsx
  className="h-8 w-8 animate-spin text-gray-400"
  ```
- **Patrones repetidos que deberían ser utilidades:** 11 ocurrencias
  ```tsx
  className="flex items-center gap-2"
  ```

### 7. `app/(workspace)/plans/page.tsx` (29 issues)

- **Colores hardcoded (bg-black, text-gray-600, etc.):** 27 ocurrencias
  ```tsx
  className="text-2xl font-bold text-gray-900"
  ```
- **Patrones repetidos que deberían ser utilidades:** 2 ocurrencias
  ```tsx
  className="flex items-center gap-2"
  ```

### 8. `components/branding-preview.tsx` (28 issues)

- **Colores hardcoded (bg-black, text-gray-600, etc.):** 14 ocurrencias
  ```tsx
  className="flex items-center gap-2 text-gray-600"
  ```
- **Patrones repetidos que deberían ser utilidades:** 14 ocurrencias
  ```tsx
  className="flex items-center justify-center p-8"
  ```

### 9. `components/RFXDetailsDialog.tsx` (27 issues)

- **Colores hardcoded (bg-black, text-gray-600, etc.):** 21 ocurrencias
  ```tsx
  className="h-4 w-4 text-gray-500"
  ```
- **Valores arbitrarios ([#8B5CF6], [347px], etc.):** 2 ocurrencias
  ```tsx
  className="max-w-4xl w-full max-h-[90vh] overflow-hidden"
  ```
- **Patrones repetidos que deberían ser utilidades:** 4 ocurrencias
  ```tsx
  className="flex items-center justify-center py-8"
  ```

### 10. `components/product-table.tsx` (27 issues)

- **Colores hardcoded (bg-black, text-gray-600, etc.):** 19 ocurrencias
  ```tsx
  className="text-sm text-gray-900"
  ```
- **Patrones repetidos que deberían ser utilidades:** 8 ocurrencias
  ```tsx
  className="relative inline-flex items-center w-full justify-center"
  ```

---

## 💡 Próximos Pasos

1. ✅ Revisar `STYLE_GUIDE.md` para tokens disponibles
2. 🔄 Refactorizar archivos prioritarios uno por uno
3. 🎨 Crear componentes reutilizables para patrones comunes
4. 📝 Actualizar documentación con ejemplos
