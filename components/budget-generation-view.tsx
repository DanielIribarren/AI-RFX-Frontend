"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Download, CheckCircle, Eye, Settings, FileText } from "lucide-react"
import type { PricingConfigFormData } from "@/types/pricing-v2"
import { useRFXCurrencyCompatible } from "@/contexts/RFXCurrencyContext"
import { useAuth } from "@/contexts/AuthContext"
import { transformHtmlUrls } from "@/utils/transform-html-urls"

// Import tab components
import { PreviewTab } from "./budget/tabs/PreviewTab"
import { PricingTab } from "./budget/tabs/PricingTab"
import { ProposalTab } from "./budget/tabs/ProposalTab"

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
  rfxId?: string | null
  onBackToData: () => void
  onGenerateProposal: () => void | Promise<void>
  onDownloadPDF: () => void | Promise<void>
  onFinalize: () => void | Promise<void>
  onAddProduct?: (productData: any) => void
  onDeleteProduct?: (productId: string) => void
  onQuantityChange?: (productId: string, newQuantity: number) => void
  onPriceChange?: (productId: string, newPrice: number) => void
  onCostChange?: (productId: string, newCost: number) => void
  onUnitChange?: (productId: string, newUnit: string) => void
  onSaveProductCosts?: () => void
  isRegenerating?: boolean
  isFinalized?: boolean
  isSavingCosts?: boolean
  costsSaved?: boolean
  
  // V2.2 specific props
  pricingConfigV2?: PricingConfigFormData
  onPricingConfigChange?: (config: PricingConfigFormData) => void
  onSavePricingConfig?: () => Promise<boolean>
  onAutoSave?: (partialConfig: any) => Promise<void>
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error'
  isLoadingPricingConfig?: boolean
  isSavingPricingConfig?: boolean
  enableAdvancedPricing?: boolean
  enableTaxConfiguration?: boolean
  useApiCalculations?: boolean
  onCalculationUpdate?: (result: any) => void
  
  // Real Backend Integration
  useRealBackend?: boolean
  defaultCurrency?: string

  // Loading state for initial proposal generation
  isLoadingProposal?: boolean
}

export default function BudgetGenerationView({
  extractedData,
  productosIndividuales,
  propuesta,
  costoTotal,
  rfxId,
  onBackToData,
  onGenerateProposal,
  onDownloadPDF,
  onFinalize,
  isRegenerating = false,
  isFinalized = false,
  pricingConfigV2,
  onPricingConfigChange,
  onSavePricingConfig,
  onAutoSave,
  saveStatus = 'idle',
  isLoadingPricingConfig = false,
  isSavingPricingConfig = false,
  defaultCurrency = "EUR",
  isLoadingProposal = false
}: BudgetGenerationViewProps) {
  
  const [activeTab, setActiveTab] = useState("preview")
  
  // Auth context for company ID
  const { user } = useAuth()
  const companyId = user?.id
  
  // Currency hook
  const { 
    selectedCurrency, 
    getCurrencyInfo, 
    formatPrice 
  } = useRFXCurrencyCompatible(defaultCurrency)

  // Use V2.2 pricing configuration from wrapper or fallback to default
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

  // Transform HTML URLs if we have both propuesta and companyId
  const transformedPropuesta = companyId && propuesta ? 
    transformHtmlUrls(propuesta, companyId) : propuesta

  // Removed validation: Users can generate proposals without pre-saved prices

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Header Sticky */}
      <div className="sticky top-0 z-40 bg-background border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                onClick={onBackToData} 
                variant="outline" 
                size="sm"
                className="gap-2"
                disabled={isRegenerating || isFinalized}
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
              <div>
                <h1 className="text-xl font-bold">
                  Configuración de Presupuesto
                </h1>
                <p className="text-sm text-muted-foreground">
                  Personaliza y genera tu propuesta comercial
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={onDownloadPDF}
                disabled={!transformedPropuesta || isFinalized}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
              
              {!isFinalized && (
                <Button
                  onClick={onFinalize}
                  size="sm"
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Finalizar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content con Tabs */}
      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 !flex-none">
            <TabsTrigger value="preview" className="gap-2 flex-1">
              <Eye className="h-4 w-4" />
              Vista Previa
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2 flex-1">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="proposal" className="gap-2 flex-1">
              <FileText className="h-4 w-4" />
              Propuesta
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Vista Previa de Costos */}
          <TabsContent value="preview" className="space-y-6 mt-6">
            <PreviewTab
              productos={productosIndividuales}
              config={currentPricingConfig}
              formatPrice={(amount: number) => formatPrice(amount, selectedCurrency)}
              currencySymbol={getCurrencyInfo()?.symbol || "€"}
            />
          </TabsContent>

          {/* Tab 2: Configuración de Pricing */}
          <TabsContent value="pricing" className="space-y-6 mt-6">
            <PricingTab
              config={currentPricingConfig}
              onConfigChange={onPricingConfigChange || (() => {})}
              onSave={onSavePricingConfig}
              onAutoSave={onAutoSave}
              saveStatus={saveStatus}
              isDisabled={isFinalized}
              isLoading={isLoadingPricingConfig || isSavingPricingConfig}
            />
          </TabsContent>

          {/* Tab 3: Propuesta Comercial */}
          <TabsContent value="proposal" className="space-y-6 mt-6">
            <ProposalTab
              htmlContent={transformedPropuesta || ""}
              isRegenerating={isRegenerating}
              isLoadingProposal={isLoadingProposal}
              onRegenerate={onGenerateProposal}
              onDownload={onDownloadPDF}
            />
          </TabsContent>
        </Tabs>

        {/* Alert de finalizado */}
        {isFinalized && (
          <Alert className="mt-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Análisis finalizado:</strong> Este análisis ha sido guardado exitosamente en tu historial.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
