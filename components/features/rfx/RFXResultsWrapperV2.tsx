"use client"

import { useState, useEffect } from "react"
import { api, RFXResponse, ProposalRequest, useAPICall } from "@/lib/api"
import { useCurrency } from "@/hooks/use-currency"
import { useCredits } from "@/contexts/CreditsContext"
import { pricingApiV2, pricingConverter, pricingDefaults } from "@/lib/api-pricing-v2"
import {
  getFrontendPricingConfig,
  updateFrontendPricingConfig,
  handleBackendPricingError
} from "@/lib/api-pricing-backend-real"
import { validateAndSecureUUID } from "@/lib/utils"
import type {
  PricingConfigFormData,
  RfxPricingConfiguration,
  PricingCalculationResult,
  LegacyPricingConfig
} from "@/types/pricing-v2"
import RFXDataView from "@/components/features/rfx/RFXDataView"
import BudgetGenerationView from "@/components/budget/BudgetGenerationView"
import { RFXUpdateChatPanel, type RFXChange } from "@/components/features/rfx/update-chat"

interface ExtractedData {
  solicitante: string
  email: string
  productos: string
  fechaEntrega: string
  lugarEntrega: string
  // Datos de empresa
  nombreEmpresa: string
  emailEmpresa: string
  telefonoEmpresa: string
  telefonoSolicitante: string
  cargoSolicitante: string
  // Requirements específicos del cliente
  requirements: string
  requirementsConfidence: number
}

interface ProductoIndividual {
  id: string
  nombre: string
  cantidad: number
  cantidadOriginal: number
  cantidadEditada: number
  unidad: string
  precio: number
  isQuantityModified: boolean
  // Nuevos campos de ganancias
  costo_unitario?: number
  ganancia_unitaria?: number
  margen_ganancia?: number
  total_profit?: number // Campo adicional del backend
}

interface RfxResultsWrapperV2Props {
  onNewRfx: () => void
  onFinalize?: (data: ExtractedData, propuesta: string) => void
  onNavigateToHistory?: () => void
  backendData?: RFXResponse
  onProposalGenerated?: () => Promise<void>

  // V2.2 specific props
  enableAdvancedPricing?: boolean
  enableTaxConfiguration?: boolean
  useApiCalculations?: boolean

  // Real Backend Integration
  useRealBackend?: boolean // Toggle between mock and real backend V2.2
}

// Views enum
enum ViewMode {
  DATA = 'data',
  BUDGET = 'budget'
}

// Simple logger helper
const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`ℹ️ ${message}`, data ? data : '')
    }
  },
  error: (message: string, data?: any) => {
    console.error(`❌ ${message}`, data ? data : '')
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 ${message}`, data ? data : '')
    }
  }
}

export default function RfxResultsWrapperV2({
  onNewRfx,
  onFinalize,
  onNavigateToHistory,
  backendData,
  onProposalGenerated,
  enableAdvancedPricing = true,
  enableTaxConfiguration = false,
  useApiCalculations = true,
  useRealBackend = false
}: RfxResultsWrapperV2Props) {

  // Credits context
  const { credits, checkCredits, refreshCredits } = useCredits()

  // Current view state
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.DATA)

  // Chat panel state
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Estado para mostrar mensaje si no hay datos
  const [hasData, setHasData] = useState(false)

  // Helper function to safely extract data with validation - V2.0 with legacy fallback
  const safeExtractData = (data: any) => {
    if (!data || typeof data !== 'object') return null

    // Extract metadata with V2.0 and legacy fallback
    const metadata = data.metadata_json || data.metadatos || {}

    // Convert products array to display string
    const formatProducts = (products: any) => {
      if (Array.isArray(products)) {
        return products.map((p: any) => {
          const name = p?.product_name || p?.nombre || 'Producto'
          const quantity = p?.quantity || p?.cantidad || 1
          const unit = p?.unit || p?.unidad || 'unidades'
          return `${name} (${quantity} ${unit})`
        }).join(', ')
      }
      return ''
    }

    return {
      solicitante: (data as any).requester_name || (data as any).nombre_solicitante || (data as any).nombre_cliente || metadata.nombre_solicitante || '',
      email: data.email || metadata.email || '',
      productos: formatProducts((data as any).products) || formatProducts((data as any).productos) || '',
      fechaEntrega: (data as any).delivery_date || (data as any).fecha || metadata.fecha || '',
      lugarEntrega: (data as any).location || (data as any).lugar || metadata.lugar || '',

      // Company data - prefer direct fields, fallback to metadata
      nombreEmpresa: (data as any).company_name || (data as any).nombre_empresa || metadata.nombre_empresa || '',
      emailEmpresa: (data as any).email_empresa || metadata.email_empresa || '',
      telefonoEmpresa: (data as any).telefono_empresa || metadata.telefono_empresa || '',
      telefonoSolicitante: (data as any).telefono_solicitante || metadata.telefono_solicitante || '',
      cargoSolicitante: (data as any).cargo_solicitante || metadata.cargo_solicitante || '',

      // Requirements específicos del cliente
      requirements: (data as any).requirements || metadata.requirements || '',
      requirementsConfidence: (data as any).requirements_confidence || metadata.requirements_confidence || 0.0
    }
  }

  const [extractedData, setExtractedData] = useState<ExtractedData>(() => {
    logger.debug("RfxResultsWrapperV2 Initial State", backendData)

    if (backendData?.data) {
      const safData = safeExtractData(backendData.data)
      if (safData) {
        logger.info("Initial data found, setting up extractedData")
        logger.debug("Initial extracted data", safData)
        return safData
      }
    }

    logger.debug("No initial data found, using empty state")
    return {
      solicitante: "",
      email: "",
      productos: "",
      fechaEntrega: "",
      lugarEntrega: "",
      nombreEmpresa: "",
      emailEmpresa: "",
      telefonoEmpresa: "",
      telefonoSolicitante: "",
      cargoSolicitante: "",
      requirements: "",
      requirementsConfidence: 0.0
    }
  })

  // Estado para metadatos de validación
  const [validationMetadata, setValidationMetadata] = useState<any>(null)
  const [originalText, setOriginalText] = useState<string>("")

  // Estado para productos individuales (legacy - used by individual pages now)
  const [productosIndividuales, setProductosIndividuales] = useState<ProductoIndividual[]>([])

  // ===== V2.2 PRICING CONFIGURATION STATES =====
  const [pricingConfigV2, setPricingConfigV2] = useState<PricingConfigFormData>(() => {
    // Initialize with defaults
    return {
      // Coordination
      coordination_enabled: false,
      coordination_type: 'standard',
      coordination_rate: 0.18,
      coordination_description: 'Coordinación y logística',
      coordination_apply_to_subtotal: true,

      // Cost per person
      cost_per_person_enabled: false,
      headcount: 120,
      headcount_source: 'manual',
      calculation_base: 'final_total',
      display_in_proposal: true,
      cost_per_person_description: 'Cálculo de costo individual',

      // Tax
      taxes_enabled: false,
      tax_name: 'IVA',
      tax_rate: 0.16,
      tax_apply_to_subtotal: false,
      tax_apply_to_coordination: true
    }
  })

  const [pricingConfigId, setPricingConfigId] = useState<string | null>(null)
  const [apiCalculationResult, setApiCalculationResult] = useState<PricingCalculationResult | null>(null)
  const [isLoadingPricingConfig, setIsLoadingPricingConfig] = useState(false)
  const [isSavingPricingConfig, setIsSavingPricingConfig] = useState(false)

  // Legacy compatibility states
  const [legacyPricingConfig, setLegacyPricingConfig] = useState<LegacyPricingConfig>(() => {
    return pricingConverter.fromV2(pricingConfigV2)
  })

  // Estado para el total calculado
  const [calculatedTotal, setCalculatedTotal] = useState<number>(0)

  const [propuesta, setPropuesta] = useState("")
  const [costoTotal, setCostoTotal] = useState<number | null>(null)
  const [fechaCreacion, setFechaCreacion] = useState("")

  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isFinalized, setIsFinalized] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isSavingCosts, setIsSavingCosts] = useState(false)
  const [costsSaved, setCostsSaved] = useState(false)

  // Estado para controlar loading de primera generación de propuesta
  const [isLoadingProposal, setIsLoadingProposal] = useState(false)

  // Estados para datos REALES de la propuesta generada por el backend
  const [proposalMetadata, setProposalMetadata] = useState<any>(null)
  const [proposalCosts, setProposalCosts] = useState<any[]>([])
  const [proposalStatus, setProposalStatus] = useState<string>("")
  const [proposalGeneratedAt, setProposalGeneratedAt] = useState<string>("")

  // Use the new API error handler
  const { handleAPIError } = useAPICall()

  // Hook para manejo de monedas
  const {
    selectedCurrency,
    setCurrency,
    getCurrencyInfo,
    convertPrice,
    formatPrice,
    formatPriceWithSymbol
  } = useCurrency("EUR")


  // ===== V2.2 PRICING CONFIG FUNCTIONS =====

  // Load pricing configuration from API
  const loadPricingConfig = async (rfxId: string) => {
    if (!enableAdvancedPricing) return

    setIsLoadingPricingConfig(true)
    try {
      if (useRealBackend) {
        // Use real backend V2.2 API
        logger.info("🎯 Loading configuration from REAL backend V2.2", rfxId)
        const backendConfig = await getFrontendPricingConfig(rfxId)

        // Convert to component format
        const formData: PricingConfigFormData = {
          coordination_enabled: backendConfig.coordination_enabled,
          coordination_type: backendConfig.coordination_type,
          coordination_rate: backendConfig.coordination_rate,
          coordination_description: backendConfig.coordination_description || 'Coordinación y logística',
          coordination_apply_to_subtotal: true, // Default

          cost_per_person_enabled: backendConfig.cost_per_person_enabled,
          headcount: backendConfig.headcount,
          headcount_source: 'manual', // Default
          calculation_base: backendConfig.calculation_base,
          display_in_proposal: true, // Default
          cost_per_person_description: 'Cálculo de costo individual',

          taxes_enabled: backendConfig.taxes_enabled,
          tax_name: backendConfig.tax_name,
          tax_rate: backendConfig.tax_rate,
          tax_apply_to_subtotal: false, // Default
          tax_apply_to_coordination: true // Default
        }

        setPricingConfigV2(formData)
        setLegacyPricingConfig(pricingConverter.fromV2(formData))

        logger.info("✅ Real backend configuration loaded successfully", formData)
      } else {
        // Use legacy/mock API
        logger.info("💻 Loading configuration from legacy API", rfxId)
        const response = await pricingApiV2.getConfig(rfxId)

        if (response.success && response.data) {
          const config = response.data

          // Convert API response to form data
          const formData: PricingConfigFormData = {
            // Coordination
            coordination_enabled: config.coordination?.is_enabled || false,
            coordination_type: config.coordination?.coordination_type || 'standard',
            coordination_rate: config.coordination?.rate || 0.18,
            coordination_description: config.coordination?.description || 'Coordinación y logística',
            coordination_apply_to_subtotal: config.coordination?.apply_to_subtotal || true,

            // Cost per person
            cost_per_person_enabled: config.cost_per_person?.is_enabled || false,
            headcount: config.cost_per_person?.headcount || 120,
            headcount_source: config.cost_per_person?.headcount_source || 'manual',
            calculation_base: config.cost_per_person?.calculation_base || 'final_total',
            display_in_proposal: config.cost_per_person?.display_in_proposal || true,
            cost_per_person_description: config.cost_per_person?.description || 'Cálculo de costo individual',

            // Tax
            taxes_enabled: config.tax?.is_enabled || false,
            tax_name: config.tax?.tax_name || 'IVA',
            tax_rate: config.tax?.tax_rate || 0.16,
            tax_apply_to_subtotal: config.tax?.apply_to_subtotal || false,
            tax_apply_to_coordination: config.tax?.apply_to_subtotal_with_coordination || true
          }

          setPricingConfigV2(formData)
          setPricingConfigId(config.id || null)

          // Update legacy config for backward compatibility
          setLegacyPricingConfig(pricingConverter.fromV2(formData))

          logger.info("Legacy configuration loaded successfully", formData)
        } else {
          logger.info("No pricing configuration found, using defaults")
        }
      }
    } catch (error) {
      const errorMessage = useRealBackend
        ? handleBackendPricingError(error)
        : "Error loading pricing configuration"
      logger.error(errorMessage, error)
    } finally {
      setIsLoadingPricingConfig(false)
    }
  }

  // Save pricing configuration to API
  const savePricingConfig = async (): Promise<boolean> => {
    const rfxId = backendData?.data?.id
    if (!rfxId || !enableAdvancedPricing) return false

    setIsSavingPricingConfig(true)
    try {
      if (useRealBackend) {
        // Use real backend V2.2 API
        logger.info("🎯 Saving configuration to REAL backend V2.2", rfxId)

        // Convert to backend format (FrontendPricingFormData)
        const backendConfig = {
          coordination_enabled: pricingConfigV2.coordination_enabled,
          coordination_type: pricingConfigV2.coordination_type,
          coordination_rate: pricingConfigV2.coordination_rate,
          coordination_description: pricingConfigV2.coordination_description,

          cost_per_person_enabled: pricingConfigV2.cost_per_person_enabled,
          headcount: pricingConfigV2.headcount,
          calculation_base: pricingConfigV2.calculation_base,

          taxes_enabled: pricingConfigV2.taxes_enabled,
          tax_name: pricingConfigV2.tax_name,
          tax_rate: pricingConfigV2.tax_rate
        }

        const success = await updateFrontendPricingConfig(rfxId, backendConfig)

        if (success) {
          logger.info("✅ Real backend configuration saved successfully", backendConfig)
          return true
        } else {
          logger.error("❌ Error saving configuration to real backend")
          return false
        }
      } else {
        // Use legacy/mock API
        logger.info("💻 Saving configuration to legacy API", rfxId)

        // Convert form data to API format
        const configData = {
          rfx_id: rfxId,
          configuration_name: 'Main Configuration',
          coordination: {
            is_enabled: pricingConfigV2.coordination_enabled,
            coordination_type: pricingConfigV2.coordination_type,
            rate: pricingConfigV2.coordination_rate,
            description: pricingConfigV2.coordination_description,
            apply_to_subtotal: pricingConfigV2.coordination_apply_to_subtotal,
            apply_to_total: false
          },
          cost_per_person: {
            is_enabled: pricingConfigV2.cost_per_person_enabled,
            headcount: pricingConfigV2.headcount,
            headcount_source: pricingConfigV2.headcount_source,
            calculation_base: pricingConfigV2.calculation_base,
            display_in_proposal: pricingConfigV2.display_in_proposal,
            description: pricingConfigV2.cost_per_person_description
          },
          tax: enableTaxConfiguration ? {
            is_enabled: pricingConfigV2.taxes_enabled,
            tax_name: pricingConfigV2.tax_name,
            tax_rate: pricingConfigV2.tax_rate,
            apply_to_subtotal: pricingConfigV2.tax_apply_to_subtotal,
            apply_to_subtotal_with_coordination: pricingConfigV2.tax_apply_to_coordination
          } : undefined
        }

        // Use updateConfig for both create and update (upsert behavior)
        const response = await pricingApiV2.updateConfig(rfxId, configData)

        if (response.success && response.data) {
          setPricingConfigId(response.data.id || null)
          logger.info("Legacy configuration saved successfully", response.data)
          return true
        } else {
          logger.error("Error saving legacy configuration", response.error)
          return false
        }
      }
    } catch (error) {
      const errorMessage = useRealBackend
        ? handleBackendPricingError(error)
        : "Error saving pricing configuration"
      logger.error(errorMessage, error)
      return false
    } finally {
      setIsSavingPricingConfig(false)
    }
  }

  // Handle pricing config change (V2.2)
  const handlePricingConfigChange = (newConfig: PricingConfigFormData) => {
    setPricingConfigV2(newConfig)

    // Update legacy config for backward compatibility
    const legacyUpdate = pricingConverter.fromV2(newConfig)
    setLegacyPricingConfig(legacyUpdate)

    logger.debug("Pricing configuration V2.2 updated", newConfig)
  }

  // Handle API calculation result
  const handleCalculationUpdate = (result: PricingCalculationResult) => {
    setApiCalculationResult(result)
    setCostoTotal(result.final_total)

    logger.debug("API calculation result received", result)
  }


  // Nueva función para manejar guardado de campos editables
  const handleFieldSave = async (field: keyof typeof extractedData, value: string | number) => {
    try {
      // Actualizar estado local inmediatamente
      setExtractedData(prev => ({ ...prev, [field]: value }))

      // Persistir en backend si hay ID disponible
      if (!backendData?.data?.id) return
      // 'productos' no es actualizable en backend; mantener solo local
      if (field === "productos") return

      // Normalización específica por campo
      let normalizedValue: string | number = value
      if (field === "fechaEntrega" && typeof value === "string") {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          const yyyy = date.getFullYear()
          const mm = String(date.getMonth() + 1).padStart(2, '0')
          const dd = String(date.getDate()).padStart(2, '0')
          normalizedValue = `${yyyy}-${mm}-${dd}`
        }
      }

      await api.updateRFXField(backendData.data.id, field as string, String(normalizedValue))
      console.log(`✅ Field ${field} persisted to backend:`, normalizedValue)

    } catch (error) {
      console.error(`Error saving field ${field}:`, error)
      throw error
    }
  }

  // ===== COST VALIDATION FUNCTIONS =====

  // Function to check if products have valid existing prices
  const hasValidExistingPrices = (productos: ProductoIndividual[]): boolean => {
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

  // Función para extraer productos individuales del backend data
  const extractIndividualProducts = (data: any): ProductoIndividual[] => {
    if (!data) return []

    const products = (data as any).products || (data as any).productos || (data as any).requested_products || []

    return products.map((product: any, index: number) => {
      let originalQuantity = 1

      if (product.quantity !== undefined && product.quantity !== null) {
        originalQuantity = parseInt(String(product.quantity)) || 1
      } else if (product.cantidad !== undefined && product.cantidad !== null) {
        originalQuantity = parseInt(String(product.cantidad)) || 1
      } else if (product.qty !== undefined && product.qty !== null) {
        originalQuantity = parseInt(String(product.qty)) || 1
      }

      const productName = product.product_name || product.nombre || product.name || `Producto ${index + 1}`
      const productUnit = product.unit || product.unidad || product.measurement_unit || 'unidades'
      const productPrice = parseFloat(String(product.precio_unitario || product.estimated_unit_price || product.unit_price || product.price || 0)) || 0

      // Extraer nuevos campos de ganancias con nombres correctos del backend
      const costoUnitario = parseFloat(String(product.unit_cost || product.costo_unitario || 0)) || 0
      const gananciaUnitaria = parseFloat(String(product.unit_profit || product.ganancia_unitaria || 0)) || 0
      const margenGanancia = parseFloat(String(product.unit_margin || product.margen_ganancia || 0)) || 0
      const totalProfit = parseFloat(String(product.total_profit || 0)) || 0

      return {
        id: product.id || `product-${index}`,
        nombre: productName,
        cantidad: originalQuantity,
        cantidadOriginal: originalQuantity,
        cantidadEditada: originalQuantity,
        unidad: productUnit,
        precio: productPrice,
        isQuantityModified: false,
        // Nuevos campos de ganancias con nombres correctos
        costo_unitario: costoUnitario,
        ganancia_unitaria: gananciaUnitaria,
        margen_ganancia: margenGanancia,
        total_profit: totalProfit
      }
    })
  }







  // Función para obtener datos completos del RFX desde la BD
  const fetchCompleteRFXData = async (rfxId: string) => {
    try {
      // 1. Obtener datos básicos del RFX
      const rfxResponse = await api.getRFXById(rfxId)

      if (rfxResponse.status === "success" && rfxResponse.data) {
        // 2. Obtener productos con cálculos de ganancias del endpoint correcto
        const productsResponse = await api.getProductsWithProfits(rfxId)

        if (productsResponse.status === "success" && productsResponse.data) {
          // Combinar datos del RFX con productos que incluyen ganancias
          const completeData = {
            ...rfxResponse.data,
            products: productsResponse.data.products || productsResponse.data
          }

          return completeData
        } else {
          console.warn("Products endpoint returned no data, using basic RFX data")
          return rfxResponse.data
        }
      } else {
        console.error("RFX endpoint returned error status:", rfxResponse.message)
      }
    } catch (error) {
      console.error("Error fetching complete RFX data:", error)
    }
    return null
  }

  // Función para enviar costos unitarios al backend
  const saveProductCosts = async () => {
    if (!backendData?.data?.id) {
      alert("Error: No hay datos del RFX disponibles para guardar costos")
      return
    }

    setIsSavingCosts(true)
    const rfxId = backendData.data.id
    const productCosts = productosIndividuales.map(producto => ({
      product_id: producto.id,
      unit_price: producto.precio
    }))

    try {
      const result = await api.updateProductCosts(rfxId, productCosts)

      // ✅ NEW: Verify costs are valid after saving
      const hasValidPrices = hasValidExistingPrices(productosIndividuales)
      setCostsSaved(hasValidPrices)

      if (hasValidPrices) {
        const total = calculateProductsTotal(productosIndividuales)
        alert(`Costos guardados exitosamente para ${result.data.updated_products.length} productos (Total: €${total.toFixed(2)}). Ahora puede generar la propuesta.`)
      } else {
        alert(`Costos guardados, pero algunos productos necesitan precios válidos antes de generar la propuesta.`)
      }

      // Refresco automático de datos después de actualizar costos
      await fetchCompleteRFXData(rfxId)
    } catch (error) {
      console.error("Error saving product costs:", error)

      const errorInfo = handleAPIError(error)

      if (error instanceof Error && error.message.includes("404")) {
        alert("RFX no encontrado. Por favor recargue la página e intente nuevamente.")
      } else if (error instanceof Error && error.message.includes("400")) {
        alert("Datos de costos inválidos. Verifique que todos los precios sean válidos.")
      } else {
        alert("No se pudo guardar los costos de los productos. Por favor, intente nuevamente.")
      }
    } finally {
      setIsSavingCosts(false)
    }
  }

  const handleRegenerate = async () => {
    if (!backendData?.data) return

    // Determinar si es primera generación o regeneración
    const isFirstGeneration = !propuesta || propuesta.trim().length === 0
    
    // Determinar costo de créditos según tipo de operación
    const GENERATION_COST = 50 // Costo de generar propuesta
    const REGENERATION_COST = 30 // Costo de regenerar propuesta
    const requiredCredits = isFirstGeneration ? GENERATION_COST : REGENERATION_COST

    // Validar créditos suficientes
    if (credits && !checkCredits(requiredCredits)) {
      alert(`Créditos insuficientes. Necesitas ${requiredCredits} créditos para ${isFirstGeneration ? 'generar' : 'regenerar'} la propuesta. Tienes ${credits.available_credits} disponibles.`)
      return
    }

    if (isFirstGeneration) {
      setIsLoadingProposal(true)
    } else {
      setIsRegenerating(true)
    }

    try {
      // Verificar si los costos ya están guardados en BD
      if (productosIndividuales.length > 0) {
        const hasCosts = productosIndividuales.some(p => p.precio > 0)
        if (!hasCosts) {
          alert("Por favor ingrese y guarde los costos unitarios primero usando el botón 'Guardar Costos'")
          // Resetear el estado correspondiente
          if (isFirstGeneration) {
            setIsLoadingProposal(false)
          } else {
            setIsRegenerating(false)
          }
          return
        }
      }

      // Guardar configuración de pricing V2.2 antes de generar propuesta
      if (enableAdvancedPricing) {
        await savePricingConfig()
      }

      // Enviar costos para cumplir validación Pydantic
      const costsForValidation = productosIndividuales.length > 0
        ? productosIndividuales.map(p => p.precio || 0)
        : [1]

      const proposalRequest: ProposalRequest = {
        rfx_id: backendData.data.id,
        costs: costsForValidation,
        history: "Propuesta generada con costos reales proporcionados por el usuario",
        notes: {
          modality: "buffet",
          modality_description: "Servicio de buffet completo",
          coordination: "Coordinación incluida en el servicio",
          additional_notes: "Propuesta generada con costos reales del usuario"
        }
      }

      const response = await api.generateProposal(proposalRequest)

      if (response.proposal) {
        // Invalidar cache del sidebar (la propuesta actualiza el estado del RFX)
        const SIDEBAR_CACHE_KEY = 'sidebar-recent-rfx'
        localStorage.removeItem(SIDEBAR_CACHE_KEY)
        console.log('🔄 Sidebar cache invalidated - proposal generated')
        
        // Actualizar con TODOS los datos reales del backend GenerateProposalService
        setPropuesta(response.proposal.content_markdown || response.proposal.content_html)

        // CRÍTICO: Actualizar costo total REAL calculado por el backend
        setCostoTotal(response.proposal.total_cost)

        // Actualizar TODOS los datos reales de la propuesta del backend
        setProposalMetadata(response.proposal.metadata || {})
        setProposalCosts(response.proposal.itemized_costs || [])
        setProposalStatus(response.proposal.status || "")
        setProposalGeneratedAt(response.proposal.created_at || "")

        // Call the callback to refresh sidebar and history
        if (onProposalGenerated) {
          await onProposalGenerated()
        }

        // Refrescar créditos después de generar propuesta
        await refreshCredits()
      }
    } catch (error) {
      console.error("Error regenerating proposal:", error)

      const errorInfo = handleAPIError(error)

      if (error instanceof Error && error.message.includes("404")) {
        alert("RFX no encontrado. Por favor recargue la página e intente nuevamente.")
      } else if (error instanceof Error && error.message.includes("500")) {
        alert("Error del servidor al generar la propuesta. Verifique que los costos estén guardados e intente nuevamente.")
      } else {
        alert("Error al generar la propuesta. Por favor intente nuevamente.")
      }
    } finally {
      // Resetear el estado correspondiente
      if (isFirstGeneration) {
        setIsLoadingProposal(false)
      } else {
        setIsRegenerating(false)
      }
    }
  }

  const handleDownloadPDF = async () => {
    try {
      // Validar que hay propuesta generada
      if (!propuesta || propuesta.trim().length === 0) {
        alert("No hay propuesta generada para descargar.\n\nPor favor usa el botón 'Regenerar con IA' primero para crear una propuesta.")
        return
      }

      // Validar datos del cliente para el nombre del archivo
      const clientName = extractedData.solicitante || 'cliente'
      const rfxId = backendData?.data?.id || 'unknown'

      logger.info("🎯 Enviando HTML del preview directamente al backend para conversión a PDF")
      logger.debug("📄 HTML content length:", propuesta.length)

      // Preparar datos estructurados adicionales para el backend
      const structuredData = {
        client_info: {
          name: extractedData.solicitante,
          email: extractedData.email,
          company: extractedData.nombreEmpresa,
          delivery_date: extractedData.fechaEntrega,
          location: extractedData.lugarEntrega
        },
        costs: {
          total: costoTotal,
          products: productosIndividuales
        },
        pricing_config: enableAdvancedPricing ? pricingConfigV2 : undefined,
        metadata: {
          rfx_id: rfxId,
          generated_at: proposalGeneratedAt,
          status: proposalStatus
        }
      }

      // Enviar HTML directamente al endpoint de conversión
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/download/html-to-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html_content: propuesta,
          document_id: rfxId,
          client_name: clientName,
          structured_data: structuredData
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || `Error del servidor: ${response.status}`)
      }

      const blob = await response.blob()

      if (blob.size === 0) {
        throw new Error("El archivo descargado está vacío")
      }

      // Crear link de descarga
      const url = URL.createObjectURL(blob)
      const element = document.createElement("a")
      element.href = url

      // Determinar extensión basada en el tipo de contenido
      const isHTML = blob.type.includes('html') || blob.type.includes('text')
      const extension = isHTML ? 'html' : 'pdf'
      const fileName = `propuesta-${clientName.replace(/\s+/g, "-").toLowerCase()}.${extension}`

      element.download = fileName
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      URL.revokeObjectURL(url)

      // Mostrar mensaje apropiado
      if (isHTML) {
        alert(`PDF no disponible temporalmente. Se descargó como HTML: ${fileName}\n\nPara convertir a PDF:\n1. Abre el archivo HTML en tu navegador\n2. Presiona Ctrl+P (o Cmd+P en Mac)\n3. Selecciona "Guardar como PDF"\n4. Ajusta configuración para A4 si es necesario`)
      } else {
        alert(`Propuesta descargada exitosamente como PDF: ${fileName}`)
      }

    } catch (error) {
      console.error("❌ Error downloading proposal:", error)

      let errorMessage = "Error desconocido al descargar la propuesta"

      if (error instanceof Error) {
        if (error.message.includes("html_content is required")) {
          errorMessage = "No se encontró contenido HTML. Genere la propuesta primero."
        } else if (error.message.includes("PDF conversion methods failed")) {
          errorMessage = "Error de conversión a PDF. Se intentará descargar como HTML."
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "Error de conexión. Verifica tu conexión a internet."
        } else {
          errorMessage = error.message
        }
      }

      alert(`No se pudo descargar la propuesta\n\nError: ${errorMessage}\n\nSoluciones:\n1. Verifica que la propuesta esté generada (visible en pantalla)\n2. Revisa tu conexión a internet\n3. Si persiste, contacta al administrador`)
    }
  }

  const handleFinalize = async () => {
    console.log("🚀 Iniciando finalización de análisis...")
    setIsFinalized(true)
    setShowConfirmation(true)

    try {
      // Guardar TODOS los datos editados antes de finalizar
      if (backendData?.data?.id) {
        console.log("💾 Guardando todos los datos editados...")

        // 1. Guardar configuración de pricing V2.2
        if (enableAdvancedPricing) {
          await savePricingConfig()
        }

        // 2. Guardar datos generales del RFX
        const updatableFields = [
          "solicitante",
          "email",
          "nombreEmpresa",
          "emailEmpresa",
          "telefonoEmpresa",
          "telefonoSolicitante",
          "cargoSolicitante",
          "fechaEntrega",
          "lugarEntrega",
          "requirements"
        ]

        console.log("📝 Guardando datos generales permitidos:", extractedData)
        for (const [field, value] of Object.entries(extractedData)) {
          if (updatableFields.includes(field) && value && value.toString().trim()) {
            try {
              await api.updateRFXField(backendData.data.id, field, value.toString())
              console.log(`✅ Campo ${field} guardado:`, value)
            } catch (error) {
              console.error(`❌ Error guardando campo ${field}:`, error)
            }
          } else if (!updatableFields.includes(field)) {
            console.log(`ℹ️ Campo ${field} omitido (no actualizable):`, value)
          }
        }

        // 3. Guardar productos con cantidades editadas
        console.log("📦 Guardando productos:", productosIndividuales)
        try {
          await saveProductCosts()
          console.log("✅ Productos guardados exitosamente")
        } catch (error) {
          console.error("❌ Error guardando productos:", error)
        }

        // 4. Guardar moneda seleccionada
        console.log("💱 Guardando moneda seleccionada:", selectedCurrency)

        // 5. Finalizar RFX en el backend
        await api.finalizeRFX(backendData.data.id)
        console.log("✅ RFX finalizado exitosamente en backend")
      }

      if (onFinalize) {
        onFinalize(extractedData, propuesta)
      }

      await new Promise((resolve) => setTimeout(resolve, 2000))
      setIsRedirecting(true)
      setShowConfirmation(false)
      await new Promise((resolve) => setTimeout(resolve, 1500))
      onNewRfx()
    } catch (error) {
      console.error("❌ Error finalizando RFX:", error)

      // Continuar con el flujo aunque falle la finalización
      if (onFinalize) {
        onFinalize(extractedData, propuesta)
      }

      await new Promise((resolve) => setTimeout(resolve, 2000))
      setIsRedirecting(true)
      setShowConfirmation(false)
      await new Promise((resolve) => setTimeout(resolve, 1500))
      onNewRfx()
    }
  }

  // Inicializar datos cuando el componente se monta o backendData cambia
  useEffect(() => {
    console.log("🔄 DEBUG: useEffect triggered in RfxResultsWrapperV2")
    console.log("📦 DEBUG: backendData in useEffect:", backendData)
    console.log("📊 DEBUG: backendData status:", backendData?.status)

    if (backendData?.status === "success" && backendData.data) {
      const data = backendData.data

      // Fetch complete data with real product IDs if this is initial processing
      const initializeData = async () => {
        let completeData = data

        // If we have an RFX ID, fetch complete data to get real product IDs
        if (data.id) {
          // ✅ Verificar autenticación antes de hacer peticiones
          const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
          if (!token) {
            console.warn('⚠️ No access token found in rfx-results-wrapper-v2, skipping data fetch');
            return; // Use data passed as prop instead
          }

          const fetchedData = await fetchCompleteRFXData(data.id)
          if (fetchedData) {
            completeData = fetchedData
            console.log("✅ DEBUG: Using complete data with real product IDs")
          }

          // Load pricing configuration V2.2
          if (enableAdvancedPricing) {
            await loadPricingConfig(data.id)
          }
        }

        console.log("✅ DEBUG: Success data found, updating extractedData...")
        console.log("📦 DEBUG: Success backend data object:", completeData)

        // Extract validation metadata from V2.0 structure
        const metadataV2 = (completeData as any).metadata_json || (completeData as any).metadatos || {}
        const validationStatus = metadataV2.validation_status || {}
        const textoOriginal = metadataV2.texto_original_relevante || ""

        console.log("📊 DEBUG: Validation status:", validationStatus)
        console.log("📄 DEBUG: Original text:", textoOriginal)

        setValidationMetadata(validationStatus)
        setOriginalText(textoOriginal)

        // Extract real data from V2.0 backend
        const metadata = metadataV2
        const newExtractedData = {
          solicitante: (completeData as any).requester_name || (completeData as any).nombre_solicitante || (completeData as any).nombre_cliente || metadata.nombre_solicitante || "",
          email: completeData.email || metadata.email || "",
          productos: ((completeData as any).products?.map((p: any) => `${p.product_name || p.nombre} (${p.quantity || p.cantidad} ${p.unit || p.unidad})`).join(', '))
            || ((completeData as any).productos?.map((p: any) => `${p.nombre} (${p.cantidad} ${p.unidad})`).join(', ')) || "",
          fechaEntrega: (completeData as any).delivery_date || (completeData as any).fecha || metadata.fecha || "",
          lugarEntrega: (completeData as any).location || (completeData as any).lugar || metadata.lugar || "",
          // Company data with fallbacks
          nombreEmpresa: (completeData as any).company_name || (completeData as any).nombre_empresa || metadata.nombre_empresa || "",
          emailEmpresa: (completeData as any).email_empresa || metadata.email_empresa || "",
          telefonoEmpresa: (completeData as any).telefono_empresa || metadata.telefono_empresa || "",
          telefonoSolicitante: (completeData as any).telefono_solicitante || metadata.telefono_solicitante || "",
          cargoSolicitante: (completeData as any).cargo_solicitante || metadata.cargo_solicitante || "",
          // Requirements específicos del cliente
          requirements: (completeData as any).requirements || metadata.requirements || "",
          requirementsConfidence: (completeData as any).requirements_confidence || metadata.requirements_confidence || 0.0
        }

        console.log("🔄 DEBUG: New extracted data to set:", newExtractedData)
        setExtractedData(newExtractedData)

        // Extract individual products for pricing inputs
        const individualProducts = extractIndividualProducts(completeData)

        console.log("✅ DEBUG: Setting productos individuales:", {
          completeDataProducts: (completeData as any).products,
          extractedProducts: individualProducts,
          productsCount: individualProducts.length
        })

        setProductosIndividuales(individualProducts)

        // ✅ NEW: Auto-detect if costs are already saved based on existing prices
        const hasExistingPrices = hasValidExistingPrices(individualProducts)
        setCostsSaved(hasExistingPrices)

        if (hasExistingPrices) {
          const total = calculateProductsTotal(individualProducts)
          logger.info(`✅ Products already have valid prices (Total: €${total.toFixed(2)}), marking costs as saved`)
        } else {
          logger.info("⚠️ Products need pricing configuration before generating proposal")
        }

        // Configure other data with V2.0 and legacy fallbacks
        // ✅ NEW: Use generated_html field from database via backend
        console.log("🔍 DEBUG: Complete backend data keys:", Object.keys(completeData))
        console.log("🔍 DEBUG: generated_html field:", (completeData as any).generated_html)
        console.log("🔍 DEBUG: generated_proposal field:", (completeData as any).generated_proposal)
        console.log("🔍 DEBUG: Full completeData object:", JSON.stringify(completeData, null, 2))

        const htmlFromDB = (completeData as any).generated_html || (completeData as any).generated_proposal || ""
        setPropuesta(htmlFromDB)

        if (htmlFromDB) {
          console.log("✅ HTML proposal loaded from database, length:", htmlFromDB.length)
          logger.info("✅ HTML proposal loaded from database")
        } else {
          console.log("⚠️ No HTML content found in response")
          logger.info("ℹ️ No HTML proposal found in database for this RFX")
        }

        setCostoTotal((completeData as any).actual_cost ?? (completeData as any).estimated_budget ?? (completeData as any).costo_total ?? null)
        setFechaCreacion((completeData as any).received_at ?? (completeData as any).created_at ?? (completeData as any).fecha_recepcion ?? new Date().toISOString())

        setHasData(true)

        console.log("✅ DEBUG: State updated - hasData set to true")
        console.log("📊 DEBUG: Validation metadata set:", validationStatus)
      }

      // Call the async function
      initializeData()
    } else {
      console.log("❌ DEBUG: No success data found or invalid status")
      console.log("📊 DEBUG: Status:", backendData?.status)
      console.log("📦 DEBUG: Data exists:", !!backendData?.data)
      setHasData(false)
      setValidationMetadata(null)
      setOriginalText("")
    }
  }, [backendData, enableAdvancedPricing])

  // Navigation handlers
  const handleNavigateToData = () => {
    setCurrentView(ViewMode.DATA)
  }

  const handleNavigateToBudget = () => {
    setCurrentView(ViewMode.BUDGET)
  }

  // Mostrar mensaje si no hay datos
  if (!hasData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12 bg-background rounded-lg border border">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Aún no se ha procesado ningún RFX
          </h2>
          <p className="text-muted-foreground mb-6">
            Carga un documento para ver los resultados del análisis aquí.
          </p>
          <button
            onClick={onNewRfx}
            className="bg-primary hover:bg-primary-dark text-background px-6 py-2 rounded-lg font-medium"
          >
            Procesar Nuevo RFX
          </button>
        </div>
      </div>
    )
  }

  // Función para aplicar cambios del chat
  const handleChatUpdate = async (changes: RFXChange[]) => {
    console.log('🔄 Applying chat changes:', changes)
    
    // Detectar tipos de cambios
    const changeTypes = new Set(changes.map(c => c.type))
    
    for (const change of changes) {
      switch (change.type) {
        case "add_product":
          // Agregar producto al estado local
          const cantidad = change.data.cantidad || change.data.quantity || 1
          const newProduct: ProductoIndividual = {
            id: change.data.id || crypto.randomUUID(),
            nombre: change.data.nombre || change.data.name,
            cantidad: cantidad,
            cantidadOriginal: cantidad,
            cantidadEditada: cantidad,
            precio: change.data.precio || change.data.price || 0,
            unidad: change.data.unidad || change.data.unit || 'unidades',
            isQuantityModified: false
          }
          setProductosIndividuales(prev => [...prev, newProduct])
          console.log('✅ Product added to local state:', newProduct)
          
          // Persistir en backend
          if (backendData?.data?.id) {
            try {
              await api.addProduct(backendData.data.id, newProduct)
              console.log('✅ Product persisted to backend')
            } catch (error) {
              console.error('❌ Error persisting product:', error)
            }
          }
          break

        case "update_product":
          // Actualizar producto en estado local
          const { product_id, field, value } = change.data
          setProductosIndividuales(prev =>
            prev.map(p => p.id === product_id ? { ...p, [field]: value } : p)
          )
          console.log('✅ Product updated in local state:', { product_id, field, value })
          
          // Persistir en backend
          if (backendData?.data?.id) {
            try {
              await api.updateProductField(backendData.data.id, product_id, field, value)
              console.log('✅ Product update persisted to backend')
            } catch (error) {
              console.error('❌ Error persisting product update:', error)
            }
          }
          break

        case "delete_product":
          // Eliminar producto del estado local
          const productId = change.data?.product_id || change.target
          setProductosIndividuales(prev => prev.filter(p => p.id !== productId))
          console.log('✅ Product deleted from local state:', productId)
          
          // Persistir en backend
          if (backendData?.data?.id) {
            try {
              await api.deleteProduct(backendData.data.id, productId)
              console.log('✅ Product deletion persisted to backend')
            } catch (error) {
              console.error('❌ Error persisting product deletion:', error)
            }
          }
          break

        case "update_field":
          // Actualizar campo del RFX
          const fieldName = change.data?.field || change.target
          const fieldValue = change.data?.value || change.data?.newValue
          
          setExtractedData(prev => ({ ...prev, [fieldName]: fieldValue }))
          console.log('✅ RFX field updated in local state:', { fieldName, fieldValue })
          
          // Persistir en backend
          try {
            await handleFieldSave(fieldName as keyof ExtractedData, fieldValue)
            console.log('✅ RFX field update persisted to backend')
          } catch (error) {
            console.error('❌ Error persisting field update:', error)
          }
          break
      }
    }
    
    // Solo refrescar datos completos si hubo cambios en productos (para recalcular ganancias)
    if (changeTypes.has('add_product') || 
        changeTypes.has('update_product') || 
        changeTypes.has('delete_product')) {
      console.log('🔄 Refreshing products data for profit calculations')
      if (backendData?.data?.id) {
        try {
          // Recargar productos con ganancias actualizadas
          const productsResponse = await api.getProductsWithProfits(backendData.data.id)
          const updatedProducts = extractIndividualProducts(productsResponse.data.products || productsResponse.data)
          setProductosIndividuales(updatedProducts)
          console.log('✅ Products data refreshed')
        } catch (error) {
          console.error('❌ Error refreshing products data:', error)
        }
      }
    } else {
      console.log('ℹ️ No product changes, skipping full refresh')
    }
  }

  // Render the appropriate view
  if (currentView === ViewMode.DATA) {
    return (
      <>
        <RFXDataView
          extractedData={extractedData}
          onFieldSave={handleFieldSave}
          onGenerateBudget={handleNavigateToBudget}
          onNavigateToHistory={onNavigateToHistory}
          rfxId={backendData?.data?.id}
          rfxTitle={(backendData?.data as any)?.title || extractedData.nombreEmpresa || "Datos Extraídos"}
          fechaCreacion={fechaCreacion}
          validationMetadata={validationMetadata}
          originalText={originalText}
          isFinalized={isFinalized}
          // Product management props - handled by individual pages
          productosIndividuales={productosIndividuales}
          // Chat panel control
          isChatOpen={isChatOpen}
          onChatToggle={() => setIsChatOpen(!isChatOpen)}
        />

        {/* Chat Panel - rendered at wrapper level for full-screen access */}
        {backendData?.data?.id && (
          <RFXUpdateChatPanel
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            rfxId={backendData.data.id}
            rfxData={{
              productos: productosIndividuales,
              total: productosIndividuales.reduce((sum, p) => sum + (p.precio * p.cantidad), 0),
              fechaEntrega: extractedData.fechaEntrega,
              lugarEntrega: extractedData.lugarEntrega,
              solicitante: extractedData.solicitante,
              emailSolicitante: extractedData.email
            }}
            onUpdate={handleChatUpdate}
          />
        )}
      </>
    )
  }

  // ✅ FIX: Validate UUID at wrapper level to prevent invalid API calls
  console.log('🔍 RfxResultsWrapperV2 UUID validation:', {
    backendData_exists: !!backendData,
    backendData_data_exists: !!backendData?.data,
    backendData_data_id: backendData?.data?.id,
    id_type: typeof backendData?.data?.id,
    id_length: backendData?.data?.id?.length,
    id_stringified: JSON.stringify(backendData?.data?.id)
  })

  const safeRfxId = validateAndSecureUUID(backendData?.data?.id, 'RfxResultsWrapperV2');

  console.log('🔍 RfxResultsWrapperV2 safeRfxId result:', {
    safeRfxId: safeRfxId,
    safeRfxId_type: typeof safeRfxId,
    safeRfxId_stringified: JSON.stringify(safeRfxId)
  })

  return (
    <BudgetGenerationView
      extractedData={extractedData}
      productosIndividuales={productosIndividuales}
      propuesta={propuesta}
      costoTotal={costoTotal}
      rfxId={safeRfxId} // ✅ FIX: Pass validated UUID (null becomes undefined in child)
      onBackToData={handleNavigateToData}
      onGenerateProposal={handleRegenerate}
      onDownloadPDF={handleDownloadPDF}
      onFinalize={handleFinalize}
      // Product management props - handled by individual pages
      isRegenerating={isRegenerating}
      isFinalized={isFinalized}
      // V2.2 specific props
      pricingConfigV2={pricingConfigV2}
      onPricingConfigChange={handlePricingConfigChange}
      onSavePricingConfig={savePricingConfig}
      isLoadingPricingConfig={isLoadingPricingConfig}
      isSavingPricingConfig={isSavingPricingConfig}
      enableAdvancedPricing={enableAdvancedPricing}
      enableTaxConfiguration={enableTaxConfiguration}
      useApiCalculations={useApiCalculations}
      onCalculationUpdate={handleCalculationUpdate}
      // Real Backend Integration
      useRealBackend={useRealBackend}
      isLoadingProposal={isLoadingProposal}
    />
  )
}
