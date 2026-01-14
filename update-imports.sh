#!/bin/bash

# Script para actualizar imports después de reorganización de componentes
# Fase 3: Actualización masiva de imports

echo "🔄 Actualizando imports de componentes reorganizados..."

# Función para reemplazar imports en todos los archivos
update_imports() {
  local old_path=$1
  local new_path=$2
  
  echo "  📝 $old_path → $new_path"
  
  # Buscar y reemplazar en archivos .tsx y .ts
  find app components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' "s|from \"@/components/$old_path\"|from \"@/components/$new_path\"|g" {} +
}

# Layout components
update_imports "app-sidebar" "layout/AppSidebar"
update_imports "public-header" "layout/PublicHeader"
update_imports "sidebar-user" "layout/SidebarUser"
update_imports "navigation/Breadcrumbs" "layout/navigation/Breadcrumbs"

# RFX components
update_imports "RFXDetailsDialog" "features/rfx/RFXDetailsDialog"
update_imports "rfx-chat-input" "features/rfx/RFXChatInput"
update_imports "rfx-data-view" "features/rfx/RFXDataView"
update_imports "rfx-history" "features/rfx/RFXHistory"
update_imports "rfx-results-wrapper-v2" "features/rfx/RFXResultsWrapperV2"
update_imports "processed-files-content" "features/rfx/ProcessedFilesContent"
update_imports "rfx-update-chat" "features/rfx/update-chat"

# Marketing components
update_imports "landing-page" "marketing/LandingPage"
update_imports "how-it-works" "marketing/HowItWorks"

# Shared components
update_imports "delete-confirmation-dialog" "shared/DeleteConfirmationDialog"
update_imports "toast-notification" "shared/ToastNotification"
update_imports "transformed-html-content" "shared/TransformedHtmlContent"
update_imports "ai-model-selector" "shared/AIModelSelector"

# Providers
update_imports "theme-provider" "providers/ThemeProvider"

# Budget
update_imports "budget-generation-view" "budget/BudgetGenerationView"

echo "✅ Imports actualizados correctamente"
