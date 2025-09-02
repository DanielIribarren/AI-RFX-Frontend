"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CurrencySelector } from "@/components/ui/currency-selector"
import { Download, RefreshCw, Plus, CheckCircle, History, DollarSign } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api, RFXResponse, ProposalRequest, useAPICall } from "@/lib/api"
import { useCurrency } from "@/hooks/use-currency"
import InlineEditableField from "@/components/ui/inline-editable-field"
import ProductTable from "@/components/product-table"
import ProductFormDialog from "@/components/product-form-dialog"
import PricingCalculator from "@/components/pricing-calculator"

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
  // 🆕 MVP: Requirements específicos del cliente
  requirements: string
  requirementsConfidence: number
}

interface ProductoIndividual {
  id: string
  nombre: string
  cantidad: number // Cantidad original del backend
  cantidadOriginal: number // Copia de la cantidad original
  cantidadEditada: number // Cantidad modificable por el usuario
  unidad: string
  precio: number
  isQuantityModified: boolean // Indica si la cantidad fue modificada
}

interface RfxResultsProps {
  onNewRfx: () => void
  onFinalize?: (data: ExtractedData, propuesta: string) => void
  onNavigateToHistory?: () => void
  backendData?: RFXResponse
  onProposalGenerated?: () => Promise<void>
}

// Simple logger helper to replace console.logs in production
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

export default function RfxResults({ onNewRfx, onFinalize, onNavigateToHistory, backendData, onProposalGenerated }: RfxResultsProps) {
  // Estado para mostrar mensaje si no hay datos
  const [hasData, setHasData] = useState(false)
  
  // Estados dinámicos basados en datos reales del backend
  // Helper function to safely extract data with validation - V2.0 with legacy fallback
  const safeExtractData = (data: any) => {
    if (!data || typeof data !== 'object') return null
    
    // Extract metadata with V2.0 and legacy fallback
    const metadata = data.metadata_json || data.metadatos || {}
    
    // Convert products array to display string
    const formatProducts = (products: any) => {
      if (Array.isArray(products)) {
        return products.map((p: any) => {
          // Handle both V2.0 structure and legacy structure
          const name = p?.product_name || p?.nombre || 'Producto'
          const quantity = p?.quantity || p?.cantidad || 1
          const unit = p?.unit || p?.unidad || 'unidades'
          return `${name} (${quantity} ${unit})`
        }).join(', ')
      }
      return ''
    }
    
    return {
      // V2.0 fields with legacy fallback (using type assertion for compatibility)
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
      
      // 🆕 MVP: Requirements específicos del cliente
      requirements: (data as any).requirements || metadata.requirements || '',
      requirementsConfidence: (data as any).requirements_confidence || metadata.requirements_confidence || 0.0
    }
  }

  const [extractedData, setExtractedData] = useState<ExtractedData>(() => {
    // 🔍 DEBUG: Log initial state setup
    logger.debug("RfxResults Initial State", backendData)
    
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
      // Datos de empresa
      nombreEmpresa: "",
      emailEmpresa: "",
      telefonoEmpresa: "",
      telefonoSolicitante: "",
      cargoSolicitante: "",
      // 🆕 MVP: Requirements específicos del cliente
      requirements: "",
      requirementsConfidence: 0.0
    }
  })

  // Estado para metadatos de validación
  const [validationMetadata, setValidationMetadata] = useState<any>(null)
  const [originalText, setOriginalText] = useState<string>("")

  // Estado para productos individuales
  const [productosIndividuales, setProductosIndividuales] = useState<ProductoIndividual[]>([])
  
  // Estados para el diálogo de agregar producto
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  
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
  
  // ✅ Estados para datos REALES de la propuesta generada por el backend
  const [proposalMetadata, setProposalMetadata] = useState<any>(null)
  const [proposalCosts, setProposalCosts] = useState<any[]>([])
  const [proposalStatus, setProposalStatus] = useState<string>("")
  const [proposalGeneratedAt, setProposalGeneratedAt] = useState<string>("")

  // Use the new API error handler
  const { handleAPIError } = useAPICall()

  // ✅ NUEVO: Hook para manejo de monedas
  const { 
    selectedCurrency, 
    setCurrency, 
    getCurrencyInfo, 
    convertPrice, 
    formatPrice, 
    formatPriceWithSymbol 
  } = useCurrency((backendData?.data as any)?.currency || "EUR")

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

  // Función para extraer productos individuales del backend data
  const extractIndividualProducts = (data: any): ProductoIndividual[] => {
    if (!data) return []
    
    // ✅ MEJORADO: Extraer productos de múltiples posibles ubicaciones
    const products = (data as any).products || (data as any).productos || (data as any).requested_products || []
    
    console.log("🔍 DEBUG: Extracting products from backend data:", {
      dataKeys: Object.keys(data),
      productsLength: products.length,
      firstProduct: products[0],
      rawData: data
    })
    
    return products.map((product: any, index: number) => {
      // ✅ MEJORADO: Extraer cantidad con múltiples fallbacks y conversión robusta
      let originalQuantity = 1 // Default fallback
      
      // Intentar extraer cantidad de diferentes campos
      if (product.quantity !== undefined && product.quantity !== null) {
        originalQuantity = parseInt(String(product.quantity)) || 1
      } else if (product.cantidad !== undefined && product.cantidad !== null) {
        originalQuantity = parseInt(String(product.cantidad)) || 1
      } else if (product.qty !== undefined && product.qty !== null) {
        originalQuantity = parseInt(String(product.qty)) || 1
      }
      
      // ✅ MEJORADO: Extraer nombre con múltiples fallbacks
      const productName = product.product_name || product.nombre || product.name || `Producto ${index + 1}`
      
      // ✅ MEJORADO: Extraer unidad con múltiples fallbacks
      const productUnit = product.unit || product.unidad || product.measurement_unit || 'unidades'
      
      // ✅ MEJORADO: Extraer precio con múltiples fallbacks
      const productPrice = parseFloat(String(product.precio_unitario || product.estimated_unit_price || product.unit_price || product.price || 0)) || 0
      
      const productData = {
        id: product.id || `product-${index}`, // ✅ Use real database ID when available
        nombre: productName,
        cantidad: originalQuantity, // Cantidad original del backend
        cantidadOriginal: originalQuantity, // Copia de la cantidad original
        cantidadEditada: originalQuantity, // ✅ INICIALMENTE igual a la cantidad extraída por IA
        unidad: productUnit,
        precio: productPrice,
        isQuantityModified: false // Inicialmente no modificada
      }
      
      console.log(`🔍 DEBUG: Product ${index + 1} extracted:`, {
        originalProduct: product,
        extractedProduct: productData,
        quantitySource: product.quantity !== undefined ? 'quantity' : 
                       product.cantidad !== undefined ? 'cantidad' : 
                       product.qty !== undefined ? 'qty' : 'default'
      })
      
      return productData
    })
  }

  // Función para manejar cambios en precios de productos
  const handleProductPriceChange = async (productId: string, newPrice: number) => {
    try {
      // 1. Actualizar estado local inmediatamente para UX
      setProductosIndividuales(prev => 
        prev.map(product => 
          product.id === productId 
            ? { ...product, precio: newPrice }
            : product
        )
      )

      // 2. Persistir en backend inmediatamente si hay RFX ID
      if (backendData?.data?.id) {
        console.log(`🔄 Saving product price: ${productId} = ${newPrice}`)
        await api.updateProductField(backendData.data.id, productId, "precio_unitario", newPrice)
        console.log(`✅ Product price saved to backend: ${productId}`)
        
        // 3. Refresh datos para asegurar consistencia
        await refreshRFXData()
      }
    } catch (error) {
      console.error(`❌ Error saving product price:`, error)
      // Revertir cambio local si falla el backend
      setProductosIndividuales(prev => 
        prev.map(product => 
          product.id === productId 
            ? { ...product, precio: product.precio } // mantener precio anterior
            : product
        )
      )
    }
  }

  // ✅ NUEVO: Función para manejar cambios en unidad de productos
  const handleUnitChange = async (productId: string, newUnit: string) => {
    try {
      const trimmed = (newUnit || '').trim()
      if (!trimmed) return

      // 1. Actualizar estado local inmediatamente
      setProductosIndividuales(prev => 
        prev.map(product => 
          product.id === productId 
            ? { ...product, unidad: trimmed }
            : product
        )
      )

      // 2. Persistir en backend inmediatamente si hay RFX ID
      if (backendData?.data?.id) {
        console.log(`🔄 Saving product unit: ${productId} = ${trimmed}`)
        await api.updateProductField(backendData.data.id, productId, "unidad", trimmed)
        console.log(`✅ Product unit saved to backend: ${productId}`)
        
        // 3. Refresh datos para asegurar consistencia
        await refreshRFXData()
      }
    } catch (error) {
      console.error(`❌ Error saving product unit:`, error)
      // Revertir cambio local si falla el backend
      setProductosIndividuales(prev => 
        prev.map(product => 
          product.id === productId 
            ? { ...product, unidad: product.unidad } // mantener unidad anterior
            : product
        )
      )
    }
  }

  // ✅ NUEVO: Función para manejar cambios en cantidades de productos
  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    try {
      console.log(`🔄 handleQuantityChange called:`, { productId, newQuantity })
      
      // 1. Actualizar estado local inmediatamente
      setProductosIndividuales(prev => {
        const updated = prev.map(product => {
          if (product.id === productId) {
            const updatedProduct = { 
              ...product, 
              cantidadEditada: newQuantity,
              isQuantityModified: newQuantity !== product.cantidadOriginal
            }
            console.log(`✅ Updated product ${productId}:`, {
              before: product,
              after: updatedProduct
            })
            return updatedProduct
          }
          return product
        })
        
        console.log(`📦 New productos individuales state:`, updated)
        return updated
      })

      // 2. Persistir en backend inmediatamente si hay RFX ID
      if (backendData?.data?.id) {
        console.log(`🔄 Saving product quantity: ${productId} = ${newQuantity}`)
        await api.updateProductField(backendData.data.id, productId, "cantidad", newQuantity)
        console.log(`✅ Product quantity saved to backend: ${productId}`)
        
        // 3. Refresh datos para asegurar consistencia
        await refreshRFXData()
      }
    } catch (error) {
      console.error(`❌ Error saving product quantity:`, error)
      // Revertir cambio local si falla el backend
      setProductosIndividuales(prev => 
        prev.map(product => 
          product.id === productId 
            ? { 
                ...product, 
                cantidadEditada: product.cantidadOriginal,
                isQuantityModified: false
              }
            : product
        )
      )
    }
  }

  // Función para agregar nuevo producto
  const handleAddProduct = async (productData: any) => {
    try {
      const newProduct: ProductoIndividual = {
        id: `new-product-${Date.now()}`, // ID temporal
        nombre: productData.nombre,
        cantidad: productData.cantidad,
        cantidadOriginal: productData.cantidad,
        cantidadEditada: productData.cantidad,
        unidad: productData.unidad,
        precio: productData.precio,
        isQuantityModified: false
      }
      
      setProductosIndividuales(prev => [...prev, newProduct])
      console.log('✅ Product added:', newProduct)
      
    } catch (error) {
      console.error('❌ Error adding product:', error)
      throw error
    }
  }
  
  // Función para eliminar producto
  const handleDeleteProduct = (productId: string) => {
    setProductosIndividuales(prev => prev.filter(p => p.id !== productId))
    console.log('🗑️ Product deleted:', productId)
  }

  // Función para convertir markdown simple a HTML
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
      
      // Párrafos (líneas que no son headers ni listas)
      .replace(/^(?!<[h|l])(.*$)/gm, (match, p1) => {
        const trimmed = p1.trim()
        if (trimmed === '' || trimmed === '---') {
          return '<br>'
        }
        if (trimmed.startsWith('<')) {
          return match // Ya es HTML
        }
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

  // Función para obtener datos completos del RFX desde la BD
  const fetchCompleteRFXData = async (rfxId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/rfx/${rfxId}`)
      if (response.ok) {
        const result = await response.json()
        if (result.status === "success") {
          return result.data
        }
      }
    } catch (error) {
      console.error("Error fetching complete RFX data:", error)
    }
    return null
  }

  // 🔄 Función para refrescar datos del RFX después de actualizaciones
  const refreshRFXData = async () => {
    if (!backendData?.data?.id) {
      console.warn("No hay RFX ID para refrescar")
      return
    }

    try {
      console.log("🔄 Refrescando datos del RFX:", backendData.data.id)
      const refreshedData = await fetchCompleteRFXData(backendData.data.id)
      
      if (refreshedData) {
        // Crear nuevo objeto backendData con datos actualizados
        const updatedBackendData = {
          ...backendData,
          data: refreshedData
        }
        
        // Esto trigger el useEffect que recalcula todos los estados
        console.log("✅ Datos del RFX refrescados exitosamente")
        
        // Forzar re-renderizado con datos frescos
        // Este approach simula recibir datos del backend nuevamente
        if (refreshedData) {
          const newExtractedData = safeExtractData(refreshedData)
          if (newExtractedData) {
            setExtractedData(newExtractedData)
          }
          
          const newIndividualProducts = extractIndividualProducts(refreshedData)
          setProductosIndividuales(newIndividualProducts)
          
          console.log("🔄 Estados actualizados con datos frescos")
        }
      } else {
        console.error("❌ No se pudieron obtener datos actualizados")
      }
    } catch (error) {
      console.error("❌ Error refrescando datos del RFX:", error)
    }
  }

  // Inicializar datos cuando el componente se monta o backendData cambia
  useEffect(() => {
    // 🔍 DEBUG: Log useEffect trigger
    console.log("🔄 DEBUG: useEffect triggered in RfxResults")
    console.log("📦 DEBUG: backendData in useEffect:", backendData)
    console.log("📊 DEBUG: backendData status:", backendData?.status)
    
    if (backendData?.status === "success" && backendData.data) {
      const data = backendData.data
      
      // Fetch complete data with real product IDs if this is initial processing
      const initializeData = async () => {
        let completeData = data
        
        // If we have an RFX ID, fetch complete data to get real product IDs
        if (data.id) {
          const fetchedData = await fetchCompleteRFXData(data.id)
          if (fetchedData) {
            completeData = fetchedData
            console.log("✅ DEBUG: Using complete data with real product IDs")
          }
        }
      
        console.log("✅ DEBUG: Success data found, updating extractedData...")
        console.log("📦 DEBUG: Success backend data object:", completeData)
        console.log("👤 DEBUG: requester_name:", (completeData as any).requester_name)
        console.log("🏢 DEBUG: company_name:", (completeData as any).company_name)
        console.log("📧 DEBUG: email:", completeData.email)
        console.log("📦 DEBUG: products array:", (completeData as any).products)
        console.log("📦 DEBUG: requested_products array:", (completeData as any).requested_products)
        console.log("📅 DEBUG: delivery_date:", (completeData as any).delivery_date)
        console.log("🕐 DEBUG: delivery_time:", (completeData as any).delivery_time)
        console.log("📍 DEBUG: location:", (completeData as any).location)
        console.log("💰 DEBUG: estimated_budget:", (completeData as any).estimated_budget)
        console.log("💰 DEBUG: actual_cost:", (completeData as any).actual_cost)
        console.log("📅 DEBUG: received_at:", (completeData as any).received_at)
        console.log("🔧 DEBUG: metadata_json completos:", (completeData as any).metadata_json)
        
        // Extract validation metadata from V2.0 structure
        const metadataV2 = (completeData as any).metadata_json || (completeData as any).metadatos || {}
        const validationStatus = metadataV2.validation_status || {}
        const textoOriginal = metadataV2.texto_original_relevante || ""
        
        // 🔍 DEBUG: Log company data specifically from V2.0 metadata
        console.log("🏢 DEBUG: company_name direct:", (completeData as any).company_name)
        console.log("🏢 DEBUG: nombre_empresa en metadata:", metadataV2.nombre_empresa)
        console.log("🏢 DEBUG: email_empresa en metadata:", metadataV2.email_empresa)
        console.log("🏢 DEBUG: telefono_empresa en metadata:", metadataV2.telefono_empresa)
        console.log("👤 DEBUG: telefono_solicitante en metadata:", metadataV2.telefono_solicitante)
        console.log("👤 DEBUG: cargo_solicitante en metadata:", metadataV2.cargo_solicitante)
        
        console.log("📊 DEBUG: Validation status:", validationStatus)
        console.log("📄 DEBUG: Original text:", textoOriginal)
        
        setValidationMetadata(validationStatus)
        setOriginalText(textoOriginal)
        
        // Extract real data from V2.0 backend (use same metadata variable)
        const metadata = metadataV2
        const newExtractedData = {
          // V2.0 with legacy fallback (using type assertions for compatibility)
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
          // 🆕 MVP: Requirements específicos del cliente
          requirements: (completeData as any).requirements || metadata.requirements || "",
          requirementsConfidence: (completeData as any).requirements_confidence || metadata.requirements_confidence || 0.0
        }
        
        console.log("🔄 DEBUG: New extracted data to set:", newExtractedData)
        setExtractedData(newExtractedData)
        
        // Extract individual products for pricing inputs (using complete data with real IDs)
        const individualProducts = extractIndividualProducts(completeData)
        
        console.log("✅ DEBUG: Setting productos individuales:", {
          completeDataProducts: (completeData as any).products,
          extractedProducts: individualProducts,
          productsCount: individualProducts.length
        })
        
        setProductosIndividuales(individualProducts)
        
        // Configure other data with V2.0 and legacy fallbacks
        setPropuesta("") // Initialize empty, will be set below if needed
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
  }, [backendData])

  // Formatear fecha de creación
  const formatFechaCreacion = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString("es-ES", {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return new Date().toLocaleDateString("es-ES")
    }
  }

  // Formatear costo total usando la moneda seleccionada
  const formatCostoTotal = (costo: number) => {
    return formatPrice(costo, selectedCurrency)
  }

  const handleEdit = (field: string) => {
    // setEditingField(field) // Removed
  }

  const handleSave = (field: string, value: string) => {
    // setExtractedData((prev) => ({ ...prev, [field]: value })) // Removed
    // setEditingField(null) // Removed
    // setSavedField(field) // Removed
    // setTimeout(() => setSavedField(null), 2000) // Removed
  }

  const handleRegenerate = async () => {
    if (!backendData?.data) return
    
    setIsRegenerating(true)
    
    try {
      // Verificar si los costos ya están guardados en BD
      if (productosIndividuales.length > 0) {
        const hasCosts = productosIndividuales.some(p => p.precio > 0)
        if (!hasCosts) {
          alert("⚠️ Por favor ingrese y guarde los costos unitarios primero usando el botón 'Guardar Costos'")
          setIsRegenerating(false)
          return
        }
      }
      
      // ✅ Enviar costos para cumplir validación Pydantic (el backend usará los de la BD)
      // Obtener costos actuales de los productos individuales o usar costos por defecto
      const costsForValidation = productosIndividuales.length > 0 
        ? productosIndividuales.map(p => p.precio || 0) 
        : [1]; // Array con al menos un elemento para cumplir min_items=1
      
      const proposalRequest: ProposalRequest = {
        rfx_id: backendData.data.id,
        costs: costsForValidation, // Cumple validación - backend usará costos reales de la BD
        history: "Propuesta generada con costos reales proporcionados por el usuario",
        notes: {
          modality: "buffet",
          modality_description: "Servicio de buffet completo",
          coordination: "Coordinación incluida en el servicio",
          additional_notes: "Propuesta generada con costos reales del usuario"
        }
      }
      
      console.log("🎯 Generating proposal with real costs from database for RFX:", backendData.data.id)
      console.log("📝 Costs sent for validation (backend will use DB costs):", costsForValidation)
      const response = await api.generateProposal(proposalRequest)
      
      if (response.proposal) {
        // ✅ Actualizar con TODOS los datos reales del backend GenerateProposalService
        setPropuesta(response.proposal.content_markdown || response.proposal.content_html)
        
        // ✅ CRÍTICO: Actualizar costo total REAL calculado por el backend
        setCostoTotal(response.proposal.total_cost)
        
        // ✅ Actualizar TODOS los datos reales de la propuesta del backend
        setProposalMetadata(response.proposal.metadata || {})
        setProposalCosts(response.proposal.itemized_costs || [])
        setProposalStatus(response.proposal.status || "")
        setProposalGeneratedAt(response.proposal.created_at || "")
        
        // ✅ Log detallado de datos reales recibidos del backend
        console.log("✅ Proposal generated successfully with real costs")
        console.log("💰 Real total cost from backend:", response.proposal.total_cost)
        console.log("📋 Real itemized costs:", response.proposal.itemized_costs)
        console.log("📊 Proposal metadata:", response.proposal.metadata)
        console.log("🎯 Proposal status:", response.proposal.status)
        console.log("📅 Generated at:", response.proposal.created_at)
        
        // Call the callback to refresh sidebar and history
        if (onProposalGenerated) {
          await onProposalGenerated()
        }
      }
    } catch (error) {
      console.error("Error regenerating proposal:", error)
      
      // Use enhanced error handling
      const errorInfo = handleAPIError(error)
      
      // Show user-friendly error message
      if (error instanceof Error && error.message.includes("404")) {
        alert("❌ RFX no encontrado. Por favor recargue la página e intente nuevamente.")
      } else if (error instanceof Error && error.message.includes("500")) {
        alert("❌ Error del servidor al generar la propuesta. Verifique que los costos estén guardados e intente nuevamente.")
      } else {
        alert("❌ Error al generar la propuesta. Por favor intente nuevamente.")
      }
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      // ✅ Validar que hay propuesta generada (HTML en el preview)
      if (!propuesta || propuesta.trim().length === 0) {
        alert("⚠️ No hay propuesta generada para descargar.\n\nPor favor usa el botón 'Regenerar con IA' primero para crear una propuesta.")
        return
      }

      // ✅ Validar datos del cliente para el nombre del archivo
      const clientName = extractedData.solicitante || 'cliente'
      const rfxId = backendData?.data?.id || 'unknown'
      
      logger.info("🎯 Enviando HTML del preview directamente al backend para conversión a PDF")
      logger.debug("📄 HTML content length:", propuesta.length)
      
      // ✅ Preparar datos estructurados adicionales para el backend
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
        metadata: {
          rfx_id: rfxId,
          generated_at: proposalGeneratedAt,
          status: proposalStatus
        }
      }

      // ✅ Enviar HTML directamente al endpoint de conversión
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
      
      // ✅ Crear link de descarga
      const url = URL.createObjectURL(blob)
      const element = document.createElement("a")
      element.href = url
      
      // ✅ Determinar extensión basada en el tipo de contenido
      const isHTML = blob.type.includes('html') || blob.type.includes('text')
      const extension = isHTML ? 'html' : 'pdf'
      const fileName = `propuesta-${clientName.replace(/\s+/g, "-").toLowerCase()}.${extension}`
      
      element.download = fileName
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      URL.revokeObjectURL(url)
      
      // ✅ Mostrar mensaje apropiado
      if (isHTML) {
        alert(`⚠️ PDF no disponible temporalmente. Se descargó como HTML: ${fileName}\n\nPara convertir a PDF:\n1. Abre el archivo HTML en tu navegador\n2. Presiona Ctrl+P (o Cmd+P en Mac)\n3. Selecciona "Guardar como PDF"\n4. Ajusta configuración para A4 si es necesario`)
      } else {
        alert(`✅ Propuesta descargada exitosamente como PDF: ${fileName}`)
      }
      
    } catch (error) {
      console.error("❌ Error downloading proposal:", error)
      
      // ✅ Mensajes de error específicos y útiles
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
      
      alert(`❌ No se pudo descargar la propuesta\n\nError: ${errorMessage}\n\nSoluciones:\n1. Verifica que la propuesta esté generada (visible en pantalla)\n2. Revisa tu conexión a internet\n3. Si persiste, contacta al administrador`)
    }
  }

  const handleFinalize = async () => {
    console.log("🚀 Iniciando finalización de análisis...")
    setIsFinalized(true)
    setShowConfirmation(true)

    try {
      // ✅ NUEVO: Guardar TODOS los datos editados antes de finalizar
      if (backendData?.data?.id) {
        console.log("💾 Guardando todos los datos editados...")
        
        // 1. Guardar datos generales del RFX (empresa, cliente, solicitud, etc.)
        // ✅ CRÍTICO: Solo actualizar campos que están permitidos en el backend
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
          // NOTA: 'productos' NO es actualizable según backend field_mapping
        ]
        
        console.log("📝 Guardando datos generales permitidos:", extractedData)
        for (const [field, value] of Object.entries(extractedData)) {
          if (updatableFields.includes(field) && value && value.toString().trim()) {
            try {
              await api.updateRFXField(backendData.data.id, field, value.toString())
              console.log(`✅ Campo ${field} guardado:`, value)
            } catch (error) {
              console.error(`❌ Error guardando campo ${field}:`, error)
              // Continuar con otros campos aunque uno falle
            }
          } else if (!updatableFields.includes(field)) {
            console.log(`ℹ️ Campo ${field} omitido (no actualizable):`, value)
          }
        }

        // 2. Guardar productos con cantidades editadas
        console.log("📦 Guardando productos:", productosIndividuales)
        try {
          await saveProductCosts()
          console.log("✅ Productos guardados exitosamente")
        } catch (error) {
          console.error("❌ Error guardando productos:", error)
        }

        // 3. Guardar moneda seleccionada
        console.log("💱 Guardando moneda seleccionada:", selectedCurrency)
        
        // 4. Finalizar RFX en el backend
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

  // Mostrar mensaje si no hay datos
  if (!hasData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Aún no se ha procesado ningún RFX
              </h2>
              <p className="text-gray-500 mb-6">
                Carga un documento para ver los resultados del análisis aquí.
              </p>
              <Button onClick={onNewRfx} className="gap-2">
                <Plus className="h-4 w-4" />
                Procesar Nuevo RFX
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
      // NOTA: quantity no se envía porque el backend no lo maneja actualmente
      // TODO: Implementar actualización de cantidades en endpoint separado
    }))

    try {
      console.log("🔄 Saving product costs:", productCosts)
      
      // Use the new API client method
      const result = await api.updateProductCosts(rfxId, productCosts)
      
      console.log("✅ Product costs saved successfully:", result)
      setCostsSaved(true)
      alert(`✅ Costos guardados exitosamente para ${result.data.updated_products.length} productos. Ahora puede generar la propuesta.`)
      
      // 🔄 NUEVO: Refresco automático de datos después de actualizar costos
      await refreshRFXData()
    } catch (error) {
      console.error("Error saving product costs:", error)
      
      // Use enhanced error handling
      const errorInfo = handleAPIError(error)
      
      if (error instanceof Error && error.message.includes("404")) {
        alert("❌ RFX no encontrado. Por favor recargue la página e intente nuevamente.")
      } else if (error instanceof Error && error.message.includes("400")) {
        alert("❌ Datos de costos inválidos. Verifique que todos los precios sean válidos.")
      } else {
        alert("❌ No se pudo guardar los costos de los productos. Por favor, intente nuevamente.")
      }
    } finally {
      setIsSavingCosts(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* ✅ NUEVO: Panel de debugging temporal */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <details>
            <summary className="text-sm font-medium text-yellow-800 cursor-pointer">
              🐛 DEBUG Panel - Auto-Save Status
            </summary>
            <div className="mt-2 text-xs font-mono text-yellow-700 space-y-1">
              <div><strong>RFX ID:</strong> {backendData?.data?.id || 'No ID'}</div>
              <div><strong>Has Backend Data:</strong> {backendData?.data ? 'Sí' : 'No'}</div>
              <div><strong>Extracted Data Keys:</strong> {Object.keys(extractedData).join(', ')}</div>
              <div><strong>Current URL:</strong> {window.location.href}</div>
              <div><strong>API Base:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}</div>
            </div>
          </details>
        </div>
      )}

      {/* Propuesta Generada Alert */}
      {backendData?.propuesta_id && (
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            🎯 Propuesta comercial generada automáticamente. Use el botón "Descargar Propuesta" para obtener el documento.
          </AlertDescription>
        </Alert>
      )}

      {/* Data Quality Alert */}
      {validationMetadata && (
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            📊 Calidad de extracción: {validationMetadata.has_original_data ? 
              "Datos extraídos del documento" : 
              "Algunos datos usan valores predeterminados"}
            {originalText && (
              <div className="mt-2 text-xs">
                <strong>Texto relevante encontrado:</strong> "{originalText.slice(0, 150)}{originalText.length > 150 ? '...' : ''}"
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Confirmation Alert */}
      {showConfirmation && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Análisis finalizado exitosamente. El RFX ha sido guardado en tu historial.
          </AlertDescription>
        </Alert>
      )}

      {/* Redirecting Alert */}
      {isRedirecting && (
        <Alert className="border-blue-200 bg-blue-50">
          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertDescription className="text-blue-800">
            Redirigiendo a la página principal para continuar procesando RFX...
          </AlertDescription>
        </Alert>
      )}

      {/* Page Header with Dynamic Data */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isFinalized ? "RFX Finalizado" : "RFX Procesado Exitosamente"}
          </h1>
          <p className="text-lg text-gray-600 mt-1">
            {extractedData.solicitante} • {formatFechaCreacion(fechaCreacion)}
          </p>
        </div>
        <div className="flex gap-2">
          {onNavigateToHistory && (
            <Button onClick={onNavigateToHistory} variant="outline" className="gap-2" disabled={isRedirecting}>
              <History className="h-4 w-4" />
              Ver Historial
            </Button>
          )}
          <Button onClick={onNewRfx} variant="outline" className="gap-2" disabled={isRedirecting}>
            <Plus className="h-4 w-4" />
            Procesar Nuevo RFX
          </Button>
        </div>
      </div>

            {/* Datos del Solicitante */}
      <Card className={isRedirecting ? "opacity-50" : ""} style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", transition: "box-shadow 0.3s ease" }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Datos del Solicitante
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-4">
          <div className="space-y-0">
            <InlineEditableField 
                  value={extractedData.solicitante} 
              onSave={(value) => handleFieldSave("solicitante", value)}
                  label="Nombre" 
                  originalText={originalText}
              placeholder="Nombre del solicitante"
                />
            <InlineEditableField 
                  value={extractedData.email} 
              onSave={(value) => handleFieldSave("email", value)}
              type="email"
                  label="Email" 
              placeholder="email@empresa.com"
                />
                {extractedData.telefonoSolicitante && (
              <InlineEditableField 
                    value={extractedData.telefonoSolicitante} 
                onSave={(value) => handleFieldSave("telefonoSolicitante", value)}
                type="tel"
                    label="Teléfono" 
                placeholder="Teléfono del solicitante"
                  />
                )}
                {extractedData.cargoSolicitante && (
              <InlineEditableField 
                    value={extractedData.cargoSolicitante} 
                onSave={(value) => handleFieldSave("cargoSolicitante", value)}
                    label="Cargo" 
                placeholder="Cargo del solicitante"
                  />
                )}
              </div>
        </CardContent>
      </Card>

            {/* Datos de la Empresa */}
      <Card className={isRedirecting ? "opacity-50" : ""} style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", transition: "box-shadow 0.3s ease" }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Datos de la Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-4">
          <div className="space-y-0">
            {extractedData.nombreEmpresa ? (
              <InlineEditableField 
                    value={extractedData.nombreEmpresa} 
                onSave={(value) => handleFieldSave("nombreEmpresa", value)}
                    label="Nombre de la Empresa" 
                placeholder="Nombre de la empresa"
              />
            ) : (
              <InlineEditableField 
                value=""
                onSave={(value) => handleFieldSave("nombreEmpresa", value)}
                label="Nombre de la Empresa"
                placeholder="Haz clic para agregar..."
              />
            )}
            {extractedData.emailEmpresa ? (
              <InlineEditableField 
                    value={extractedData.emailEmpresa} 
                onSave={(value) => handleFieldSave("emailEmpresa", value)}
                type="email"
                    label="Email de la Empresa" 
                placeholder="contacto@empresa.com"
              />
            ) : (
              <InlineEditableField 
                value=""
                onSave={(value) => handleFieldSave("emailEmpresa", value)}
                type="email"
                label="Email de la Empresa"
                placeholder="Haz clic para agregar..."
              />
            )}
            {extractedData.telefonoEmpresa ? (
              <InlineEditableField 
                    value={extractedData.telefonoEmpresa} 
                onSave={(value) => handleFieldSave("telefonoEmpresa", value)}
                type="tel"
                    label="Teléfono de la Empresa" 
                placeholder="Teléfono de la empresa"
              />
            ) : (
              <InlineEditableField 
                value=""
                onSave={(value) => handleFieldSave("telefonoEmpresa", value)}
                type="tel"
                label="Teléfono de la Empresa"
                placeholder="Haz clic para agregar..."
                  />
                )}
                {!extractedData.nombreEmpresa && !extractedData.emailEmpresa && !extractedData.telefonoEmpresa && (
              <div className="text-sm text-gray-500 italic py-4">
                📝 No se encontraron datos específicos de la empresa en el documento. Puede agregarlos manualmente.
                  </div>
                )}
              </div>
        </CardContent>
      </Card>

            {/* Datos del Evento */}
      <Card className={isRedirecting ? "opacity-50" : ""} style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", transition: "box-shadow 0.3s ease" }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            Datos del Evento
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-4">
          <div className="space-y-0">
            <InlineEditableField 
                  value={extractedData.productos} 
              onSave={(value) => handleFieldSave("productos", value)}
                  label="Productos" 
              placeholder="Productos solicitados"
              type="textarea"
                />
            <InlineEditableField 
                  value={extractedData.fechaEntrega} 
              onSave={(value) => handleFieldSave("fechaEntrega", value)}
              type="date"
                  label="Fecha Entrega" 
              placeholder="Fecha de entrega"
                />
            <InlineEditableField 
                  value={extractedData.lugarEntrega} 
              onSave={(value) => handleFieldSave("lugarEntrega", value)}
                  label="Lugar Entrega" 
              placeholder="Lugar de entrega"
            />
          </div>
        </CardContent>
      </Card>

      {/* Requirements Específicos */}
      <Card className={isRedirecting ? "opacity-50" : ""} style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", transition: "box-shadow 0.3s ease" }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            Requirements Específicos
                    {extractedData.requirementsConfidence > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
                        Confianza: {(extractedData.requirementsConfidence * 100).toFixed(0)}%
                      </span>
                    )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-4">
          <div className="space-y-0">
                  {extractedData.requirements ? (
              <InlineEditableField 
                      value={extractedData.requirements} 
                onSave={(value) => handleFieldSave("requirements", value)}
                      label="Instrucciones Específicas del Cliente" 
                placeholder="Ej: Personal con más de 5 años de experiencia, sin frutos secos por alergias..."
                type="textarea"
                    />
                  ) : (
              <InlineEditableField 
                value=""
                onSave={(value) => handleFieldSave("requirements", value)}
                label="Instrucciones Específicas del Cliente"
                placeholder="Haz clic para agregar requirements..."
                type="textarea"
              />
            )}
            {!extractedData.requirements && (
              <div className="text-xs text-gray-500 mt-2">
                💡 Ejemplos: "Personal con +5 años experiencia", "Sin frutos secos por alergias", "Presupuesto máximo €500"
                    </div>
                  )}
                </div>
        </CardContent>
      </Card>

      {/* Configuración de Precios de Productos */}
      <Card className={isRedirecting ? "opacity-50" : ""} style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", transition: "box-shadow 0.3s ease" }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            <span>Configurar Precios de Productos</span>
            
            {/* Controles en la derecha */}
            <div className="ml-auto flex items-center gap-3">
              {/* Selector de moneda */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Moneda:</span>
              <CurrencySelector 
                value={selectedCurrency} 
                onValueChange={setCurrency}
                className="w-[140px]"
              />
              </div>
              
              {/* Botón agregar */}
              <Button 
                onClick={() => setIsAddingProduct(true)}
                className="gap-2 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-800 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Haga clic en cualquier campo para editarlo. Use Enter para confirmar o Escape para cancelar. 
            {productosIndividuales.some(p => p.isQuantityModified) && (
              <span className="block mt-1 text-blue-600 font-medium">
                ✏️ {productosIndividuales.filter(p => p.isQuantityModified).length} producto(s) con cantidades modificadas
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-4 space-y-4">
          <ProductTable
            productos={productosIndividuales}
                currencySymbol={getCurrencyInfo()?.symbol || "€"}
                selectedCurrency={selectedCurrency}
                onQuantityChange={handleQuantityChange}
                onPriceChange={handleProductPriceChange}
                onUnitChange={handleUnitChange}
            onDeleteProduct={handleDeleteProduct}
            isEditable={true}
            // Optional: price review tracking (stub functions for compatibility)
            isProductPriceUnreviewed={() => false}
            markProductPriceAsReviewed={() => {}}
          />
          
          {/* Botón para guardar costos */}
          <div className="pt-4 border-t border-gray-200">
            <Button 
              onClick={saveProductCosts} 
              className="gap-2 bg-gray-800 hover:bg-gray-900 text-white shadow-sm"
              disabled={isRedirecting || productosIndividuales.length === 0 || isSavingCosts}
            >
              {isSavingCosts ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Guardando Costos...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4" />
                  Guardar Costos
                </>
              )}
            </Button>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Los cambios se guardan automáticamente al editar cada campo
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Calculadora de Precios */}
      {productosIndividuales.length > 0 && (
        <PricingCalculator
          productos={productosIndividuales}
          currencySymbol={getCurrencyInfo()?.symbol || "€"}
          selectedCurrency={selectedCurrency}
          onTotalChange={setCalculatedTotal}
        />
      )}

      {/* Costo Total (si existe) - DATOS REALES DEL BACKEND */}
      {costoTotal !== null && (
        <Card className={isRedirecting ? "opacity-50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {proposalGeneratedAt ? "💰 Costo Total REAL (Calculado por IA)" : "Costo Total Estimado"}
            </CardTitle>
            <CardDescription>
              {proposalGeneratedAt ? (
                <>
                  ✅ Costo real calculado por GenerateProposalService con los precios que configuraste
                  <br />
                  📅 Generado: {new Date(proposalGeneratedAt).toLocaleString("es-ES")}
                  {proposalStatus && <span className="ml-2">• Estado: {proposalStatus}</span>}
                </>
              ) : (
                "Costo estimado inicial del RFX"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCostoTotal(costoTotal)}
            </div>
            
            {/* Mostrar costos desglosados reales si están disponibles */}
            {proposalCosts.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  📋 Costos Desglosados Reales (del Backend):
                </h4>
                <div className="space-y-1 text-sm">
                  {proposalCosts.map((cost, index) => (
                    <div key={index} className="flex justify-between border-b border-gray-100 pb-1">
                      <span>{cost.product_name} ({cost.quantity} {cost.unit || 'unidades'})</span>
                      <span className="font-medium">
                        {formatPriceWithSymbol(cost.unit_price)} × {cost.quantity} = {formatPriceWithSymbol(cost.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Mostrar metadatos reales de generación */}
            {proposalMetadata && Object.keys(proposalMetadata).length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  🔍 Metadatos de Generación (Backend Real):
                </h4>
                <div className="text-xs text-blue-700 space-y-1">
                  {proposalMetadata.generation_method && (
                    <div><strong>Método:</strong> {proposalMetadata.generation_method}</div>
                  )}
                  {proposalMetadata.ai_model && (
                    <div><strong>Modelo IA:</strong> {proposalMetadata.ai_model}</div>
                  )}
                  {proposalMetadata.generation_version && (
                    <div><strong>Versión:</strong> {proposalMetadata.generation_version}</div>
                  )}
                  {proposalMetadata.client_name && (
                    <div><strong>Cliente:</strong> {proposalMetadata.client_name}</div>
                  )}
                  {proposalMetadata.products_count && (
                    <div><strong>Productos procesados:</strong> {proposalMetadata.products_count}</div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Propuesta Comercial - Contenido Dinámico */}
      <Card className={isRedirecting ? "opacity-50" : ""} style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", transition: "box-shadow 0.3s ease" }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
            Paso 2: Generar Propuesta Comercial
            {costsSaved && <span className="text-green-600 text-sm">✅ Costos guardados</span>}
            {proposalGeneratedAt && <span className="text-blue-600 text-sm">🤖 IA Generada</span>}
          </CardTitle>
          <CardDescription>
            {proposalGeneratedAt ? (
              <>
                ✅ <strong>Propuesta REAL generada por GenerateProposalService</strong> con los costos que configuraste.
                <br />
                📅 Generada: {new Date(proposalGeneratedAt).toLocaleString("es-ES")}
                {proposalStatus && <span className="ml-2">• Estado: {proposalStatus}</span>}
                <br />
                🔍 El contenido HTML mostrado abajo es exactamente el que generó la IA del backend.
              </>
            ) : costsSaved ? (
              "Propuesta lista para generar con los costos reales que configuró."
            ) : (
              "Primero debe guardar los costos de productos en el Paso 1 para generar la propuesta con precios reales."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vista previa formateada de la propuesta */}
          {propuesta ? (
            <div className="relative">
              {/* Header visual para indicar contenido real del backend */}
              {proposalGeneratedAt && (
                <div className="bg-blue-50 border border-blue-200 rounded-t-lg px-4 py-2 text-sm">
                  <div className="flex items-center gap-2 text-blue-800">
                    <span className="font-medium">🤖 CONTENIDO REAL DEL BACKEND</span>
                    <span className="text-blue-600">•</span>
                    <span>GenerateProposalService</span>
                    <span className="text-blue-600">•</span>
                    <span>{new Date(proposalGeneratedAt).toLocaleString("es-ES")}</span>
                  </div>
                </div>
              )}
              
              <div className={`min-h-[400px] max-h-[600px] overflow-y-auto border border-gray-200 ${proposalGeneratedAt ? 'rounded-b-lg border-t-0' : 'rounded-lg'} p-6 bg-white prose prose-sm max-w-none`}>
                {/* ✅ Renderizar contenido REAL del backend sin alteración */}
                <div 
                  className="proposal-content"
                  dangerouslySetInnerHTML={{ 
                    __html: proposalGeneratedAt ? propuesta : convertMarkdownToHTML(propuesta)
                  }}
                />
                
                {/* Indicador de contenido real del backend */}
                {proposalGeneratedAt && (
                  <div className="mt-4 text-xs text-gray-500 italic border-t pt-2">
                    ⚠️ Este contenido HTML fue generado exactamente como aparece por el GenerateProposalService del backend usando IA.
                    No se ha modificado por el frontend.
                  </div>
                )}
              </div>
              {isRegenerating && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Regenerando propuesta...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="min-h-[400px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                {!costsSaved ? (
                  <>
                    <p className="text-gray-500 mb-2">⚠️ Debe guardar los costos primero</p>
                    <p className="text-sm text-gray-400">Complete el Paso 1 para continuar</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500">✅ Costos guardados. Llame al GenerateProposalService del backend.</p>
                    <Button 
                      onClick={handleRegenerate} 
                      className="mt-4 gap-2"
                      disabled={isRegenerating || !costsSaved}
                    >
                      <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
                      🤖 Generar con IA del Backend
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons según diseño */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-3">
              {/* Regenerar */}
              <Button
                onClick={handleRegenerate}
                disabled={isRegenerating || isFinalized || isRedirecting || !costsSaved}
                className="gap-2 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-800 shadow-sm"
                title={!costsSaved ? "Debe guardar los costos primero" : "Llamar al GenerateProposalService del backend con costos reales"}
              >
                <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
                🤖 Regenerar Propuesta
              </Button>
              
              {/* Descargar */}
              <Button 
                onClick={handleDownloadPDF} 
                disabled={isRedirecting || !propuesta} 
                className="gap-2 bg-gray-800 hover:bg-gray-900 text-white shadow-sm"
              >
                <Download className="h-4 w-4" />
                Descargar Propuesta
              </Button>
            </div>

            {/* Finalizar */}
            {!isFinalized && !isRedirecting && (
              <Button
                onClick={handleFinalize}
                className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm sm:ml-auto"
              >
                <CheckCircle className="h-4 w-4" />
                Finalizar Análisis
              </Button>
            )}

            {isFinalized && !isRedirecting && (
              <div className="flex items-center gap-2 text-green-600 sm:ml-auto">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Análisis Finalizado</span>
              </div>
            )}

            {isRedirecting && (
              <div className="flex items-center gap-2 text-blue-600 sm:ml-auto">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Redirigiendo...</span>
              </div>
            )}
          </div>

          {/* Finalized State Message */}
          {isFinalized && !isRedirecting && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">Análisis Completado</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Este RFX ha sido finalizado y guardado en tu historial. Serás redirigido a la página principal para
                    continuar procesando más RFX.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para agregar producto */}
      <ProductFormDialog
        isOpen={isAddingProduct}
        onClose={() => setIsAddingProduct(false)}
        onSubmit={handleAddProduct}
        currencySymbol={getCurrencyInfo()?.symbol || "€"}
        mode="create"
      />
    </div>
  )
}
