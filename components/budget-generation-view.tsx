"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CurrencySelector } from "@/components/ui/currency-selector"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Download, RefreshCw, CheckCircle, Settings, FileText, DollarSign } from "lucide-react"
import PricingConfigurationCard from "@/components/pricing-configuration-card"
import type { PricingConfigFormData, LegacyPricingConfig, PricingCalculationResult } from "@/types/pricing-v2"
import BudgetPreviewCard from "@/components/budget-preview-card"
import ChatInputCard from "@/components/chat-input-card"
import { useRFXCurrencyCompatible } from "@/contexts/RFXCurrencyContext"
import { StatusBadge } from "@/components/ui/status-badge"

interface ProductoIndividual {
  id: string
  nombre: string
  cantidad: number
  cantidadOriginal: number
  cantidadEditada: number
  unidad: string
  precio: number
  isQuantityModified: boolean
}

interface ExtractedData {
  solicitante: string
  email: string
  productos: string
  fechaEntrega: string
  lugarEntrega: string
  nombreEmpresa: string
  emailEmpresa: string
  telefonoEmpresa: string
  telefonoSolicitante: string
  cargoSolicitante: string
  requirements: string
  requirementsConfidence: number
}

interface BudgetGenerationViewProps {
  extractedData: ExtractedData
  productosIndividuales: ProductoIndividual[]
  propuesta: string
  costoTotal: number | null
  rfxId?: string | null // ✅ FIX: Accept validated UUID from wrapper (null if invalid)
  onBackToData: () => void
  onGenerateProposal: () => void | Promise<void>
  onDownloadPDF: () => void | Promise<void>
  onFinalize: () => void | Promise<void>
  onAddProduct: (productData: any) => void
  onDeleteProduct: (productId: string) => void
  onQuantityChange: (productId: string, newQuantity: number) => void
  onPriceChange: (productId: string, newPrice: number) => void
  onUnitChange: (productId: string, newUnit: string) => void
  onSaveProductCosts: () => void
  isRegenerating?: boolean
  isFinalized?: boolean
  isSavingCosts?: boolean
  costsSaved?: boolean
  
  // V2.2 specific props
  pricingConfigV2?: PricingConfigFormData
  onPricingConfigChange?: (config: PricingConfigFormData) => void
  onSavePricingConfig?: () => Promise<boolean>
  isLoadingPricingConfig?: boolean
  isSavingPricingConfig?: boolean
  enableAdvancedPricing?: boolean
  enableTaxConfiguration?: boolean
  useApiCalculations?: boolean
  onCalculationUpdate?: (result: PricingCalculationResult) => void
  
  // Real Backend Integration
  useRealBackend?: boolean
  // Seed currency from backend RFX
  defaultCurrency?: string
}

export default function BudgetGenerationView({
  extractedData,
  productosIndividuales,
  propuesta,
  costoTotal,
  rfxId, // ✅ FIX: Receive rfxId prop with correct UUID
  onBackToData,
  onGenerateProposal,
  onDownloadPDF,
  onFinalize,
  onAddProduct,
  onDeleteProduct,
  onQuantityChange,
  onPriceChange,
  onUnitChange,
  onSaveProductCosts,
  isRegenerating = false,
  isFinalized = false,
  isSavingCosts = false,
  costsSaved = false,
  // V2.2 specific props
  pricingConfigV2,
  onPricingConfigChange,
  onSavePricingConfig,
  isLoadingPricingConfig = false,
  isSavingPricingConfig = false,
  enableAdvancedPricing = true,
  enableTaxConfiguration = false,
  useApiCalculations = true,
  onCalculationUpdate,
  // Real Backend Integration
  useRealBackend = false,
  defaultCurrency
}: BudgetGenerationViewProps) {
  
  // ✅ FIX: rfxId is already validated at wrapper level, just convert null to undefined for components
  const safeRfxId = rfxId || undefined;
  
  // Use V2.2 pricing configuration from wrapper or fallback to legacy format
  const currentPricingConfig = pricingConfigV2 || {
    coordination_enabled: true,
    coordination_type: 'standard' as const,
    coordination_rate: 0.18,
    coordination_description: 'Coordinación y logística',
    coordination_apply_to_subtotal: true,
    cost_per_person_enabled: false,
    headcount: 120,
    headcount_source: 'manual' as const,
    calculation_base: 'final_total' as const,
    display_in_proposal: true,
    cost_per_person_description: 'Cálculo de costo individual',
    taxes_enabled: false,
    tax_name: 'IVA',
    tax_rate: 0.16,
    tax_apply_to_subtotal: false,
    tax_apply_to_coordination: true
  }

  // Legacy format for backward compatibility
  const legacyPricingConfig: LegacyPricingConfig = {
    includeCoordination: currentPricingConfig.coordination_enabled,
    coordinationRate: currentPricingConfig.coordination_rate * 100, // Convert to percentage
    includeCostPerPerson: currentPricingConfig.cost_per_person_enabled,
    headcount: currentPricingConfig.headcount
  }

  // State for configuration loading
  const [isSavingConfig, setIsSavingConfig] = useState(false)
  
  // State for proposal loading from database
  const [isLoadingProposal, setIsLoadingProposal] = useState(false)

  // Currency hook (uses context if available, fallback to local)
  const { 
    selectedCurrency, 
    setCurrency, 
    getCurrencyInfo, 
    formatPrice, 
    formatPriceWithSymbol 
  } = useRFXCurrencyCompatible(defaultCurrency || "EUR")

  // ===== COST VALIDATION FUNCTIONS =====
  
  // Function to check if products have valid existing prices
  const hasValidProductPrices = (productos: ProductoIndividual[]): boolean => {
    if (productos.length === 0) return false
    
    // Check if all products have prices > 0
    const allHavePrices = productos.every(producto => producto.precio && producto.precio > 0)
    
    // Calculate total to ensure it's meaningful
    const total = productos.reduce((sum, producto) => {
      return sum + (producto.cantidad * (producto.precio || 0))
    }, 0)
    
    return allHavePrices && total > 0
  }
  
  // Function to calculate products total
  const calculateProductsTotal = (productos: ProductoIndividual[]): number => {
    return productos.reduce((sum, producto) => {
      return sum + (producto.cantidad * (producto.precio || 0))
    }, 0)
  }
  
  // Check if can generate proposal based on costs
  const canGenerateProposal = hasValidProductPrices(productosIndividuales) || costsSaved
  const productsTotal = calculateProductsTotal(productosIndividuales)

  // ✅ DEBUG: Log propuesta prop to verify it's being received
  console.log("🔍 DEBUG BudgetGenerationView: propuesta prop received:", propuesta)
  console.log("🔍 DEBUG BudgetGenerationView: propuesta length:", propuesta?.length || 0)
  console.log("🔍 DEBUG BudgetGenerationView: propuesta type:", typeof propuesta)
  console.log("🔍 DEBUG BudgetGenerationView: isFinalized:", isFinalized)
  console.log("🔍 DEBUG BudgetGenerationView: isRegenerating:", isRegenerating)
  console.log("🔍 DEBUG BudgetGenerationView: button disabled state:", !propuesta || isRegenerating || isFinalized)

  // Handle configuration save
  const handleSaveConfig = async () => {
    setIsSavingConfig(true)
    try {
      // TODO: Implement API call to save pricing configuration
      console.log("Saving pricing configuration:", currentPricingConfig)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log("✅ Pricing configuration saved successfully")
    } catch (error) {
      console.error("❌ Error saving pricing configuration:", error)
    } finally {
      setIsSavingConfig(false)
    }
  }

  // Handle custom instruction submission
  const handleCustomInstruction = (instruction: string) => {
    console.log("Custom instruction:", instruction)
    // TODO: Implement logic to process custom instructions
    // This could modify the proposal generation parameters
  }

  // Handle custom instruction clear
  const handleClearInstructions = () => {
    console.log("Clearing custom instructions")
    // TODO: Implement logic to clear custom instructions
  }



  const convertMarkdownToHTML = (markdown: string): string => {
    return markdown
      // Headers
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 text-gray-900">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3 text-gray-800 mt-6">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2 text-gray-700 mt-4">$1</h3>')
      
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      
      // Lista con viñetas
      .replace(/^- (.*$)/gm, '<li class="mb-1">$1</li>')
      
      // Párrafos
      .replace(/^(?!<[h|l])(.*$)/gm, (match, p1) => {
        const trimmed = p1.trim()
        if (trimmed === '' || trimmed === '---') return '<br>'
        if (trimmed.startsWith('<')) return match
        return `<p class="mb-3 text-gray-700 leading-relaxed">${trimmed}</p>`
      })
      
      // Agrupar listas
      .replace(/(<li.*?<\/li>)/g, '<ul class="list-disc list-inside mb-4 space-y-1">$1</ul>')
      .replace(/<\/ul>\s*<ul class="list-disc list-inside mb-4 space-y-1">/g, '')
      
      // Separadores
      .replace(/^---$/gm, '<hr class="my-6 border-gray-200">')
      
      // Limpiar párrafos vacíos
      .replace(/<p class="mb-3 text-gray-700 leading-relaxed"><\/p>/g, '')
      .replace(/<p class="mb-3 text-gray-700 leading-relaxed"><br><\/p>/g, '<br>')
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={onBackToData} 
            variant="outline" 
            className="gap-2"
            disabled={isRegenerating || isFinalized}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Resultados
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Configuración de Presupuesto
            </h1>
            <p className="text-lg text-gray-600 mt-1">
              Personaliza tu presupuesto antes de generar
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Plantilla
          </Button>
          <Button 
            onClick={() => {
              console.log("🔥 Download PDF button clicked!");
              console.log("🔥 onDownloadPDF function:", onDownloadPDF);
              console.log("🔥 propuesta available:", !!propuesta);
              onDownloadPDF();
            }}
            disabled={!propuesta || isRegenerating || isFinalized}
            className="gap-2 bg-gray-800 hover:bg-gray-900 text-white"
            title={!propuesta ? "No hay propuesta para descargar" : "Descargar propuesta como PDF"}
          >
            <FileText className="h-4 w-4" />
            Generar PDF
          </Button>
        </div>
      </div>

      {/* Main Layout - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          {/* Pricing Configuration V2.2 with Real Backend Integration */}
          <PricingConfigurationCard
            config={currentPricingConfig}
            onConfigChange={onPricingConfigChange || (() => {})}
            onSave={onSavePricingConfig}
            legacyConfig={legacyPricingConfig}
            isLoading={isLoadingPricingConfig || isSavingPricingConfig}
            isDisabled={isFinalized}
            showAdvancedOptions={enableAdvancedPricing}
            showTaxConfiguration={enableTaxConfiguration}
            rfxId={safeRfxId} // ✅ Validated UUID from wrapper level
            useRealBackend={true} // ✅ ACTIVADO: Conectar con Backend Real V2.2
          />

          {/* Custom Instructions */}
          <ChatInputCard
            onSubmit={handleCustomInstruction}
            onClear={handleClearInstructions}
            isDisabled={isFinalized}
          />
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          <BudgetPreviewCard
            productos={productosIndividuales}
            config={currentPricingConfig}
            currencySymbol={getCurrencyInfo()?.symbol || "€"}
            formatPrice={(amount) => formatPrice(amount, selectedCurrency)}
            rfxId={safeRfxId} // ✅ Validated UUID from wrapper level  
            useApiCalculations={false} // ❌ DESACTIVADO: Usar cálculos locales por ahora
            onCalculationUpdate={onCalculationUpdate}
            useRealBackend={false} // ❌ DESACTIVADO: API devuelve valores en 0
          />
        </div>
      </div>



      {/* Proposal Generation Section */}
      <Card className={isFinalized ? "opacity-50" : ""}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${canGenerateProposal ? 'bg-teal-500' : 'bg-amber-500'}`}></div>
            Generar Propuesta Comercial
            {canGenerateProposal && (
              <StatusBadge variant="success">Lista para generar</StatusBadge>
            )}
          </CardTitle>
          <CardDescription>
            {canGenerateProposal ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <StatusBadge variant="success">Productos configurados</StatusBadge>
                  <span className="text-sm text-gray-600">Total: €{productsTotal.toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-600">Puede generar la propuesta directamente o actualizar precios si lo desea.</p>
              </div>
            ) : (
              <div className="space-y-1">
                <StatusBadge variant="warning">Configure precios de productos para generar la propuesta</StatusBadge>
                <p className="text-sm text-gray-600">Los productos necesitan precios válidos antes de generar la propuesta comercial.</p>
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Proposal preview */}
          {propuesta ? (
            <div className="min-h-[400px] max-h-[600px] overflow-y-auto border border-gray-200 rounded-lg p-6 bg-white prose prose-sm max-w-none relative">
              <div 
                className="proposal-content"
                dangerouslySetInnerHTML={{ 
                  __html: propuesta // ✅ NEW: Direct HTML from database, no markdown conversion needed
                }}
              />
              {/* Loading overlay for regeneration */}
              {isRegenerating && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Regenerando propuesta...</span>
                  </div>
                </div>
              )}
              {/* Loading overlay for database fetch */}
              {isLoadingProposal && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Cargando propuesta desde base de datos...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="min-h-[400px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                {!canGenerateProposal ? (
                  <>
                    <StatusBadge variant="warning">Configure precios de productos</StatusBadge>
                    <p className="text-sm text-gray-500 mb-3 mt-2">Los productos necesitan precios válidos para generar la propuesta</p>
                    <p className="text-xs text-gray-400">Vaya a la configuración de pricing para establecer los precios</p>
                  </>
                ) : (
                  <>
                    <div className="mb-2">
                      <StatusBadge variant="success">Productos configurados</StatusBadge>
                      <p className="text-sm text-gray-600 mt-1">Total: €{productsTotal.toFixed(2)}</p>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">Listo para generar la propuesta comercial</p>
                    <Button 
                      onClick={onGenerateProposal} 
                      className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isRegenerating || isFinalized}
                    >
                      <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
                      Generar con IA
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-3">
              <Button
                onClick={onGenerateProposal}
                disabled={isRegenerating || isFinalized || !canGenerateProposal}
                className="gap-2 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-800 shadow-sm"
                title={!canGenerateProposal ? "Configure precios de productos primero" : "Generar propuesta con IA"}
              >
                <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
                Regenerar Propuesta
              </Button>
              
              <Button 
                onClick={() => {
                  console.log("🔥 MAIN Download button clicked!");
                  console.log("🔥 onDownloadPDF function:", onDownloadPDF);
                  console.log("🔥 propuesta available:", !!propuesta);
                  console.log("🔥 isFinalized:", isFinalized);
                  onDownloadPDF();
                }}
                disabled={isFinalized || !propuesta} 
                className="gap-2 bg-gray-800 hover:bg-gray-900 text-white shadow-sm"
                title={!propuesta ? "No hay propuesta para descargar" : isFinalized ? "Análisis finalizado" : "Descargar propuesta como PDF"}
              >
                <Download className="h-4 w-4" />
                Descargar Propuesta
              </Button>
            </div>

            {/* Finalize button */}
            {!isFinalized && (
              <Button
                onClick={() => {
                  console.log("🔥 Finalize button clicked!");
                  console.log("🔥 onFinalize function:", onFinalize);
                  onFinalize();
                }}
                className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm sm:ml-auto"
                title="Finalizar análisis y guardar en historial"
              >
                <CheckCircle className="h-4 w-4" />
                Finalizar Análisis
              </Button>
            )}
          </div>
        </CardContent>
      </Card>



      {/* Finalized state alert */}
      {isFinalized && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <StatusBadge variant="success">Análisis finalizado</StatusBadge>
            <span className="ml-2">Este análisis ha sido finalizado exitosamente y guardado en tu historial.</span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
