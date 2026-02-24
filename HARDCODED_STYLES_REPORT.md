# 📊 Reporte de Estilos Hardcoded

**Fecha:** 19/2/2026

---

## 📈 Resumen

- **Archivos analizados:** 155
- **Archivos con issues:** 85
- **Archivos limpios:** 70

---

## 🔍 Issues por Tipo

### Valores arbitrarios ([#8B5CF6], [347px], etc.)

- **Ocurrencias:** 140
- **Archivos afectados:** 31
- **Sugerencia:** Usar valores de la escala de Tailwind o tokens CSS

### Patrones repetidos que deberían ser utilidades

- **Ocurrencias:** 245
- **Archivos afectados:** 63
- **Sugerencia:** Crear utilidad CSS o componente reutilizable

### Colores hardcoded (bg-black, text-gray-600, etc.)

- **Ocurrencias:** 271
- **Archivos afectados:** 59
- **Sugerencia:** Usar tokens semánticos (bg-foreground, text-muted-foreground, etc.)

---

## 📋 Archivos Prioritarios para Refactoring

### 1. `components/marketing/LandingPage.tsx` (51 issues)

- **Colores hardcoded (bg-black, text-gray-600, etc.):** 9 ocurrencias
  ```tsx
  className="h-8 w-8 text-white stroke-[2]"
  ```
- **Valores arbitrarios ([#8B5CF6], [347px], etc.):** 42 ocurrencias
  ```tsx
  className="text-4xl md:text-6xl font-bold text-[#0B0B0F] leading-tight tracking-tight"
  ```

### 2. `app/(workspace)/product-inventory/page.tsx` (44 issues)

- **Colores hardcoded (bg-black, text-gray-600, etc.):** 28 ocurrencias
  ```tsx
  className="h-6 w-6 text-white"
  ```
- **Patrones repetidos que deberían ser utilidades:** 16 ocurrencias
  ```tsx
  className="flex items-center justify-between mb-2"
  ```

### 3. `components/layout/AppSidebar.tsx` (31 issues)

- **Colores hardcoded (bg-black, text-gray-600, etc.):** 10 ocurrencias
  ```tsx
  className="border-r border-gray-200/60 bg-background"
  ```
- **Valores arbitrarios ([#8B5CF6], [347px], etc.):** 18 ocurrencias
  ```tsx
  className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5 group-data-[collapsible=icon]:hidden"
  ```
- **Patrones repetidos que deberían ser utilidades:** 3 ocurrencias
  ```tsx
  className="flex items-center justify-between"
  ```

### 4. `components/features/products/ProductTable.tsx` (25 issues)

- **Colores hardcoded (bg-black, text-gray-600, etc.):** 10 ocurrencias
  ```tsx
  className="text-sm text-gray-900"
  ```
- **Patrones repetidos que deberían ser utilidades:** 15 ocurrencias
  ```tsx
  className="relative inline-flex items-center w-full justify-center"
  ```

### 5. `components/features/rfx/ProcessedFilesContent.tsx` (25 issues)

- **Colores hardcoded (bg-black, text-gray-600, etc.):** 12 ocurrencias
  ```tsx
  className="bg-green-100 text-green-800"
  ```
- **Patrones repetidos que deberían ser utilidades:** 13 ocurrencias
  ```tsx
  className="text-lg font-semibold text-gray-800 flex items-center gap-2"
  ```

### 6. `app/casos-de-estudio/page.tsx` (25 issues)

- **Colores hardcoded (bg-black, text-gray-600, etc.):** 1 ocurrencias
  ```tsx
  className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-lg px-8 shadow-lg transition-all duration-200"
  ```
- **Valores arbitrarios ([#8B5CF6], [347px], etc.):** 21 ocurrencias
  ```tsx
  className="min-h-screen bg-[#FAFAFA] relative overflow-hidden"
  ```
- **Patrones repetidos que deberían ser utilidades:** 3 ocurrencias
  ```tsx
  className="text-sm text-[#475569] flex items-center gap-2"
  ```

### 7. `components/budget-preview-card.tsx` (19 issues)

- **Colores hardcoded (bg-black, text-gray-600, etc.):** 12 ocurrencias
  ```tsx
  className="text-lg font-semibold text-gray-800 flex items-center gap-2"
  ```
- **Patrones repetidos que deberían ser utilidades:** 7 ocurrencias
  ```tsx
  className="text-lg font-semibold text-gray-800 flex items-center gap-2"
  ```

### 8. `components/features/rfx/RFXHistory.tsx` (19 issues)

- **Colores hardcoded (bg-black, text-gray-600, etc.):** 10 ocurrencias
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

### 9. `components/pricing-configuration-card.tsx` (19 issues)

- **Colores hardcoded (bg-black, text-gray-600, etc.):** 5 ocurrencias
  ```tsx
  className="text-lg font-semibold text-gray-800 flex items-center gap-2"
  ```
- **Patrones repetidos que deberían ser utilidades:** 14 ocurrencias
  ```tsx
  className="text-lg font-semibold text-gray-800 flex items-center gap-2"
  ```

### 10. `app/(workspace)/profile/page.tsx` (19 issues)

- **Colores hardcoded (bg-black, text-gray-600, etc.):** 8 ocurrencias
  ```tsx
  className="text-sm text-gray-900 pl-6"
  ```
- **Patrones repetidos que deberían ser utilidades:** 11 ocurrencias
  ```tsx
  className="flex items-center gap-2"
  ```

---

## 💡 Próximos Pasos

1. ✅ Revisar `STYLE_GUIDE.md` para tokens disponibles
2. 🔄 Refactorizar archivos prioritarios uno por uno
3. 🎨 Crear componentes reutilizables para patrones comunes
4. 📝 Actualizar documentación con ejemplos
