# 📁 Plan de Reorganización del Proyecto

**Fecha:** 5 de enero, 2026  
**Objetivo:** Organizar el proyecto de manera lógica y escalable sin romper referencias

---

## 🎯 Principios de Reorganización

1. **Agrupar por feature/dominio** - Componentes relacionados juntos
2. **Mantener imports funcionando** - Actualizar todas las referencias
3. **Separar UI base de lógica de negocio** - UI genérico vs específico
4. **Documentación clara** - Estructura fácil de entender

---

## 📊 Estructura Actual vs Propuesta

### Estructura Actual (Plana)
```
components/
├── RFXDetailsDialog.tsx
├── ai-model-selector.tsx
├── app-sidebar.tsx
├── branding-preview.tsx
├── branding-upload.tsx
├── budget/
├── budget-generation-view.tsx
├── budget-preview-card.tsx
├── credits/
├── dashboard.tsx (NO USADO)
├── data-extraction-content.tsx
├── delete-confirmation-dialog.tsx
├── file-uploader.tsx (NO USADO)
├── how-it-works.tsx
├── landing-page.tsx
├── mode-toggle.tsx (NO USADO)
├── navigation/
├── organization/
├── pricing-configuration-card.tsx (NO USADO)
├── processed-files-content.tsx
├── product-form-dialog.tsx
├── product-table.tsx
├── public-header.tsx
├── rfx-chat-input.tsx
├── rfx-data-view.tsx
├── rfx-history.tsx
├── rfx-results-wrapper-v2.tsx
├── rfx-update-chat/
├── shared/
├── sidebar-user.tsx
├── theme-provider.tsx
├── toast-notification.tsx
├── transformed-html-content.tsx
└── ui/
```

### Estructura Propuesta (Organizada)
```
components/
├── features/                    # Componentes por feature
│   ├── auth/                    # (futuro) Login, signup
│   ├── branding/                # Branding relacionados
│   │   ├── BrandingPreview.tsx
│   │   └── BrandingUpload.tsx
│   ├── budget/                  # Ya existe, mantener ✅
│   │   ├── tabs/
│   │   └── shared/
│   ├── credits/                 # Ya existe, mantener ✅
│   ├── organization/            # Ya existe, mantener ✅
│   ├── products/                # Productos relacionados
│   │   ├── ProductTable.tsx
│   │   ├── ProductFormDialog.tsx
│   │   └── DataExtractionContent.tsx
│   └── rfx/                     # RFX relacionados
│       ├── RFXDetailsDialog.tsx
│       ├── RFXChatInput.tsx
│       ├── RFXDataView.tsx
│       ├── RFXHistory.tsx
│       ├── RFXResultsWrapperV2.tsx
│       ├── ProcessedFilesContent.tsx
│       └── update-chat/
│           ├── RFXUpdateChatPanel.tsx
│           ├── MessageList.tsx
│           └── ChatInput.tsx
├── layout/                      # Layout y navegación
│   ├── AppSidebar.tsx
│   ├── PublicHeader.tsx
│   ├── SidebarUser.tsx
│   └── navigation/
│       └── Breadcrumbs.tsx
├── marketing/                   # Landing y marketing
│   ├── LandingPage.tsx
│   └── HowItWorks.tsx
├── shared/                      # Componentes compartidos ✅
│   ├── PlanBadge.tsx
│   ├── RoleBadge.tsx
│   ├── DeleteConfirmationDialog.tsx
│   ├── ToastNotification.tsx
│   ├── TransformedHtmlContent.tsx
│   └── AIModelSelector.tsx
├── ui/                          # Componentes UI base (shadcn) ✅
│   └── [54 componentes]
├── providers/                   # Providers y contextos
│   └── ThemeProvider.tsx
└── _deprecated/                 # Componentes obsoletos
    ├── dashboard.tsx
    ├── file-uploader.tsx
    ├── mode-toggle.tsx
    ├── budget-preview-card.tsx
    └── pricing-configuration-card.tsx
```

---

## 🔄 Mapeo de Cambios (Imports a Actualizar)

### Branding
- `@/components/branding-preview` → `@/components/features/branding/BrandingPreview`
- `@/components/branding-upload` → `@/components/features/branding/BrandingUpload`

### Products
- `@/components/product-table` → `@/components/features/products/ProductTable`
- `@/components/product-form-dialog` → `@/components/features/products/ProductFormDialog`
- `@/components/data-extraction-content` → `@/components/features/products/DataExtractionContent`

### RFX
- `@/components/RFXDetailsDialog` → `@/components/features/rfx/RFXDetailsDialog`
- `@/components/rfx-chat-input` → `@/components/features/rfx/RFXChatInput`
- `@/components/rfx-data-view` → `@/components/features/rfx/RFXDataView`
- `@/components/rfx-history` → `@/components/features/rfx/RFXHistory`
- `@/components/rfx-results-wrapper-v2` → `@/components/features/rfx/RFXResultsWrapperV2`
- `@/components/processed-files-content` → `@/components/features/rfx/ProcessedFilesContent`
- `@/components/rfx-update-chat/*` → `@/components/features/rfx/update-chat/*`

### Layout
- `@/components/app-sidebar` → `@/components/layout/AppSidebar`
- `@/components/public-header` → `@/components/layout/PublicHeader`
- `@/components/sidebar-user` → `@/components/layout/SidebarUser`
- `@/components/navigation/Breadcrumbs` → `@/components/layout/navigation/Breadcrumbs`

### Marketing
- `@/components/landing-page` → `@/components/marketing/LandingPage`
- `@/components/how-it-works` → `@/components/marketing/HowItWorks`

### Shared
- `@/components/delete-confirmation-dialog` → `@/components/shared/DeleteConfirmationDialog`
- `@/components/toast-notification` → `@/components/shared/ToastNotification`
- `@/components/transformed-html-content` → `@/components/shared/TransformedHtmlContent`
- `@/components/ai-model-selector` → `@/components/shared/AIModelSelector`

### Providers
- `@/components/theme-provider` → `@/components/providers/ThemeProvider`

### Budget Generation View
- `@/components/budget-generation-view` → `@/components/features/budget/BudgetGenerationView`

---

## ⚠️ Consideraciones Importantes

### 1. **Archivos a NO Mover (Ya bien organizados)**
- ✅ `components/budget/*` - Ya está organizado por feature
- ✅ `components/credits/*` - Ya está organizado por feature
- ✅ `components/organization/*` - Ya está organizado por feature
- ✅ `components/shared/*` - Ya está organizado
- ✅ `components/ui/*` - Componentes base de shadcn/ui

### 2. **Archivos a Mover a _deprecated**
- `dashboard.tsx` - No usado
- `file-uploader.tsx` - No usado
- `mode-toggle.tsx` - No usado
- `budget-preview-card.tsx` - No usado
- `pricing-configuration-card.tsx` - No usado

### 3. **Renombrar Archivos (PascalCase)**
Al mover, renombrar a PascalCase para consistencia:
- `branding-preview.tsx` → `BrandingPreview.tsx`
- `branding-upload.tsx` → `BrandingUpload.tsx`
- `product-table.tsx` → `ProductTable.tsx`
- etc.

---

## 🚀 Plan de Ejecución (Paso a Paso)

### Fase 1: Crear Estructura de Carpetas
```bash
mkdir -p components/features/branding
mkdir -p components/features/products
mkdir -p components/features/rfx/update-chat
mkdir -p components/layout/navigation
mkdir -p components/marketing
mkdir -p components/providers
mkdir -p components/_deprecated
```

### Fase 2: Mover Componentes Deprecated (Sin actualizar imports)
```bash
mv components/dashboard.tsx components/_deprecated/
mv components/file-uploader.tsx components/_deprecated/
mv components/mode-toggle.tsx components/_deprecated/
mv components/budget-preview-card.tsx components/_deprecated/
mv components/pricing-configuration-card.tsx components/_deprecated/
```

### Fase 3: Mover y Renombrar Componentes (Actualizar imports después)

**Branding:**
```bash
mv components/branding-preview.tsx components/features/branding/BrandingPreview.tsx
mv components/branding-upload.tsx components/features/branding/BrandingUpload.tsx
```

**Products:**
```bash
mv components/product-table.tsx components/features/products/ProductTable.tsx
mv components/product-form-dialog.tsx components/features/products/ProductFormDialog.tsx
mv components/data-extraction-content.tsx components/features/products/DataExtractionContent.tsx
```

**RFX:**
```bash
mv components/RFXDetailsDialog.tsx components/features/rfx/RFXDetailsDialog.tsx
mv components/rfx-chat-input.tsx components/features/rfx/RFXChatInput.tsx
mv components/rfx-data-view.tsx components/features/rfx/RFXDataView.tsx
mv components/rfx-history.tsx components/features/rfx/RFXHistory.tsx
mv components/rfx-results-wrapper-v2.tsx components/features/rfx/RFXResultsWrapperV2.tsx
mv components/processed-files-content.tsx components/features/rfx/ProcessedFilesContent.tsx
mv components/rfx-update-chat components/features/rfx/update-chat
```

**Layout:**
```bash
mv components/app-sidebar.tsx components/layout/AppSidebar.tsx
mv components/public-header.tsx components/layout/PublicHeader.tsx
mv components/sidebar-user.tsx components/layout/SidebarUser.tsx
mv components/navigation components/layout/navigation
```

**Marketing:**
```bash
mv components/landing-page.tsx components/marketing/LandingPage.tsx
mv components/how-it-works.tsx components/marketing/HowItWorks.tsx
```

**Shared:**
```bash
mv components/delete-confirmation-dialog.tsx components/shared/DeleteConfirmationDialog.tsx
mv components/toast-notification.tsx components/shared/ToastNotification.tsx
mv components/transformed-html-content.tsx components/shared/TransformedHtmlContent.tsx
mv components/ai-model-selector.tsx components/shared/AIModelSelector.tsx
```

**Providers:**
```bash
mv components/theme-provider.tsx components/providers/ThemeProvider.tsx
```

**Budget:**
```bash
mv components/budget-generation-view.tsx components/features/budget/BudgetGenerationView.tsx
```

### Fase 4: Actualizar Imports en Todo el Proyecto

Usar búsqueda y reemplazo global para actualizar todas las importaciones según el mapeo definido arriba.

---

## 📝 Notas Finales

- **Backup recomendado:** Hacer commit antes de reorganizar
- **Testing:** Verificar que la app compile después de cada fase
- **Imports dinámicos:** Revisar si hay imports dinámicos que necesiten actualización
- **TypeScript:** Verificar que no haya errores de tipos después de mover

---

## ✅ Beneficios de la Nueva Estructura

1. **Escalabilidad:** Fácil agregar nuevos features
2. **Mantenibilidad:** Componentes relacionados juntos
3. **Claridad:** Estructura intuitiva y lógica
4. **Separación de concerns:** UI base vs lógica de negocio
5. **Onboarding:** Nuevos desarrolladores entienden rápido la estructura
