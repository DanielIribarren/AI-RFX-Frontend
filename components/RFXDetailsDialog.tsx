"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { TransformedHtmlContent } from "@/components/transformed-html-content"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, CheckCircle, Clock, FileText, XCircle, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api, APIError, useAPICall } from "@/lib/api"

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
  // Estado del RFX
  estado: string
}

interface ProductoIndividual {
  id: string
  nombre: string
  cantidad: number
  unidad: string
  precio: number
}

interface RFXDetailsDialogProps {
  rfxId: string;
  isOpen: boolean;
  onClose: () => void;
  rfxData?: any; // Optional - will fetch if not provided
  onViewFullAnalysis?: (rfxId: string, rfxData: any) => void; // 🆕 Callback para ver análisis completo
}

// Simple logger helper (same as RfxResults)
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

// Función utilitaria para mapear estados de base de datos a estados de frontend
const mapDatabaseStatusToDisplay = (dbStatus: string): string => {
  const status = dbStatus?.toLowerCase() || 'in_progress';
  
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'in_progress':
      return 'In progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'expired':
      return 'Expired';
    default:
      return 'In progress';
  }
}

// Función utilitaria para obtener icono y estilo del estado
const getStatusDisplay = (status: string) => {
  switch (status) {
    case 'Draft':
      return {
        icon: <FileText className="h-4 w-4 text-gray-500" />,
        className: 'text-gray-700 bg-gray-100 border-gray-200',
        label: 'Borrador'
      };
    case 'In progress':
      return {
        icon: <Clock className="h-4 w-4 text-primary-light" />,
        className: 'text-primary-dark bg-primary/10 border-primary/20',
        label: 'En Progreso'
      };
    case 'Completed':
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        className: 'text-green-700 bg-green-100 border-green-200',
        label: 'Completado'
      };
    case 'Cancelled':
      return {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        className: 'text-red-700 bg-red-100 border-red-200',
        label: 'Cancelado'
      };
    case 'Expired':
      return {
        icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
        className: 'text-orange-700 bg-orange-100 border-orange-200',
        label: 'Expirado'
      };
    default:
      return {
        icon: <Clock className="h-4 w-4 text-gray-500" />,
        className: 'text-gray-700 bg-gray-100 border-gray-200',
        label: 'En Progreso'
      };
  }
}

const RFXDetailsDialog = ({ rfxId, isOpen, onClose, rfxData, onViewFullAnalysis }: RFXDetailsDialogProps) => {
  // Clean state management - simple data display only:
  const [extractedData, setExtractedData] = useState<ExtractedData>({
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
    estado: "In progress"
  })
  const [productosIndividuales, setProductosIndividuales] = useState<ProductoIndividual[]>([])
  const [propuesta, setPropuesta] = useState("")
  const [costoTotal, setCostoTotal] = useState<number | null>(null)
  const [proposalCosts, setProposalCosts] = useState<any[]>([])
  const [proposalGeneratedAt, setProposalGeneratedAt] = useState<string>("")
  const [fechaCreacion, setFechaCreacion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ✅ DEBUG: Log propuesta state changes
  console.log("🔍 DEBUG RFXDetailsDialog: Current propuesta state:", propuesta)
  console.log("🔍 DEBUG RFXDetailsDialog: Dialog isOpen:", isOpen)
  console.log("🔍 DEBUG RFXDetailsDialog: rfxId:", rfxId)

  const { handleAPIError } = useAPICall()

  // Helper function to safely extract data with validation - V2.0 with legacy fallback (EXACT COPY from RfxResults)
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
      
      // Estado del RFX - mapear de base de datos a display
      estado: mapDatabaseStatusToDisplay((data as any).status || (data as any).estado || 'in_progress')
    }
  }

  // Extract individual products function (robust to non-array inputs and multiple schemas)
  const extractIndividualProducts = (data: any): ProductoIndividual[] => {
    if (!data) return []
    
    const possibleProducts = (data as any).products 
      ?? (data as any).productos 
      ?? (data as any).requested_products 
      ?? []
    
    const productsArray = Array.isArray(possibleProducts) ? possibleProducts : []
    
    return productsArray.map((product: any, index: number) => {
      const id = product?.id ?? `product-${index}`
      const nombre = product?.product_name ?? product?.nombre ?? product?.name ?? `Producto ${index + 1}`
      const cantidad = parseInt(String(product?.quantity ?? product?.cantidad ?? product?.qty ?? 1)) || 1
      const unidad = product?.unit ?? product?.unidad ?? product?.measurement_unit ?? 'unidades'
      const precio = parseFloat(String(product?.precio_unitario ?? product?.estimated_unit_price ?? product?.unit_price ?? product?.price ?? 0)) || 0
      
      return { id, nombre, cantidad, unidad, precio }
    })
  }

  // Fetch complete RFX data function with debugging
  const fetchCompleteRFXData = async (rfxId: string) => {
    try {
      // ✅ Verificar autenticación antes de hacer peticiones
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      console.log("🔍 DEBUG RFXDetailsDialog: Token check:", {
        hasWindow: typeof window !== 'undefined',
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'null'
      });
      
      if (!token) {
        console.warn('⚠️ No access token found in RFXDetailsDialog, cannot fetch data');
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
        return null;
      }

      console.log("🔍 DEBUG RFXDetailsDialog: Fetching RFX data for ID:", rfxId)
      console.log("🔍 DEBUG RFXDetailsDialog: About to call api.getRFXById() with token present")
      
      // ✅ Usar api.getRFXById() que incluye el token automáticamente
      const result = await api.getRFXById(rfxId)
      console.log("🔍 DEBUG RFXDetailsDialog: Response status:", result.status)
      console.log("🔍 DEBUG RFXDetailsDialog: Response data keys:", result.data ? Object.keys(result.data) : 'no data')
      console.log("🔍 DEBUG RFXDetailsDialog: generated_html in response:", result.data?.generated_html)
      
      if (result.status === "success" && result.data) {
        return result.data
      } else {
        console.error("❌ RFXDetailsDialog API returned error status:", result.message)
        setError(result.message || "Error al cargar datos del RFX")
      }
    } catch (error) {
      console.error("❌ RFXDetailsDialog Error fetching complete RFX data:", error)
      if (error instanceof APIError && error.status === 401) {
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.")
      } else {
        setError("Error al cargar la información del RFX")
      }
    }
    return null
  }

  // Format date function (EXACT COPY from RfxResults)
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

  // Format cost function (EXACT COPY from RfxResults)
  const formatCostoTotal = (costo: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(costo)
  }

  // Simple read-only field component - clean display without validation indicators
  const ReadOnlyField = ({ value, label }: { value: string, label: string }) => {
    return (
      <div className="py-3 px-3 rounded-lg bg-gray-50 border border-gray-200">
        <dt className="text-sm font-medium text-gray-600 mb-1">{label}</dt>
        <dd className={`text-sm font-medium ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {value || "No disponible"}
        </dd>
      </div>
    )
  }

  // Data fetching effect
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      setError(null)
      
      const initializeData = async () => {
        try {
          let completeData = rfxData
          
          if (rfxData) {
            // Use provided data
            if (rfxData.id) {
              const fetchedData = await fetchCompleteRFXData(rfxData.id)
              if (fetchedData) completeData = fetchedData
            }
          } else {
            // Fetch data by ID
            completeData = await fetchCompleteRFXData(rfxId)
            if (!completeData) {
              setError("No se pudo cargar la información del RFX")
              return
            }
          }
          
          // Apply EXACT same data extraction logic as RfxResults
          const newExtractedData = safeExtractData(completeData)
          if (newExtractedData) {
            setExtractedData(newExtractedData)
          }
          
          const individualProducts = extractIndividualProducts(completeData)  
          setProductosIndividuales(individualProducts)
          
          // Set other data
          setCostoTotal((completeData as any).actual_cost ?? (completeData as any).estimated_budget ?? (completeData as any).costo_total ?? null)
          setFechaCreacion((completeData as any).received_at ?? (completeData as any).created_at ?? (completeData as any).fecha_recepcion ?? new Date().toISOString())
          
          // ✅ NEW: Set proposal data from database HTML field
          console.log("🔍 DEBUG RFXDetailsDialog: Complete backend data keys:", Object.keys(completeData))
          console.log("🔍 DEBUG RFXDetailsDialog: generated_html field:", (completeData as any).generated_html)
          console.log("🔍 DEBUG RFXDetailsDialog: generated_proposal field:", (completeData as any).generated_proposal)
          
          const htmlFromDB = (completeData as any).generated_html || (completeData as any).generated_proposal || ""
          if (htmlFromDB) {
            console.log("✅ HTML found in RFXDetailsDialog, length:", htmlFromDB.length)
            setPropuesta(htmlFromDB)
            setProposalGeneratedAt((completeData as any).proposal_generated_at || "")
            setProposalCosts((completeData as any).proposal_costs || [])
            logger.info("✅ HTML proposal loaded from database in dialog")
          } else {
            console.log("⚠️ No HTML content found in RFXDetailsDialog")
            setPropuesta("")
            logger.info("ℹ️ No HTML proposal found in database for this RFX")
          }
          
        } catch (err) {
          logger.error("Error initializing RFX details dialog data", err)
          setError("Error al cargar los datos del RFX")
        } finally {
          setIsLoading(false)
        }
      }
      
      initializeData()
    }
  }, [isOpen, rfxId, rfxData])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            RFX Details
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="text-gray-600 mt-2">Cargando detalles del RFX...</p>
            </div>
          </div>
        ) : error ? (
          <div className="py-8">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <ScrollArea className="max-h-[75vh] w-full">
            <div className="space-y-6 pr-6">
              {/* Page Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Detalles del RFX</h2>
                  <p className="text-lg text-gray-600 mt-1">
                    {extractedData.solicitante} • {formatFechaCreacion(fechaCreacion)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const statusDisplay = getStatusDisplay(extractedData.estado);
                    return (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${statusDisplay.className}`}>
                        {statusDisplay.icon}
                        <span className="text-sm font-medium">{statusDisplay.label}</span>
                      </div>
                    );
                  })()}
                  
                  {/* 🆕 Botón Ver Análisis Completo */}
                  {onViewFullAnalysis && (
                    <Button 
                      onClick={() => {
                        onViewFullAnalysis(rfxId, rfxData)
                        onClose()
                      }}
                      className="gap-2 bg-primary hover:bg-primary-dark text-white"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Ver Análisis Completo
                    </Button>
                  )}
                </div>
              </div>

              {/* Información del Solicitante */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información del Solicitante</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ReadOnlyField value={extractedData.solicitante} label="Nombre" />
                    <ReadOnlyField value={extractedData.email} label="Email" />
                    {extractedData.telefonoSolicitante && (
                      <ReadOnlyField value={extractedData.telefonoSolicitante} label="Teléfono" />
                    )}
                    {extractedData.cargoSolicitante && (
                      <ReadOnlyField value={extractedData.cargoSolicitante} label="Cargo" />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Información de la Empresa */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información de la Empresa</CardTitle>
                </CardHeader>
                <CardContent>
                  {extractedData.nombreEmpresa || extractedData.emailEmpresa || extractedData.telefonoEmpresa ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {extractedData.nombreEmpresa && (
                        <ReadOnlyField value={extractedData.nombreEmpresa} label="Nombre" />
                      )}
                      {extractedData.emailEmpresa && (
                        <ReadOnlyField value={extractedData.emailEmpresa} label="Email" />
                      )}
                      {extractedData.telefonoEmpresa && (
                        <ReadOnlyField value={extractedData.telefonoEmpresa} label="Teléfono" />
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No se encontraron datos específicos de la empresa
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Detalles del Evento */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detalles del Evento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <ReadOnlyField value={extractedData.productos} label="Productos" />
                    </div>
                    <ReadOnlyField value={extractedData.fechaEntrega} label="Fecha de Entrega" />
                    <ReadOnlyField value={extractedData.lugarEntrega} label="Lugar de Entrega" />
                  </div>
                </CardContent>
              </Card>

              {/* Product Costs (Clean Design) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Costos de Productos</CardTitle>
                  <CardDescription>Precios unitarios configurados para este RFX</CardDescription>
                </CardHeader>
                <CardContent>
                  {productosIndividuales.length > 0 ? (
                    <div className="space-y-3">
                      {productosIndividuales.map(producto => (
                        <div key={producto.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{producto.nombre}</h4>
                            <p className="text-xs text-gray-500">
                              {producto.cantidad} {producto.unidad}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              €{producto.precio.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              por {producto.unidad}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No hay productos con costos configurados
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Cost Summary (Minimalist) */}
              {costoTotal !== null && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumen de Costos</CardTitle>
                    {proposalGeneratedAt && (
                      <CardDescription>
                        Generado el {new Date(proposalGeneratedAt).toLocaleString("es-ES")}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-4 border-b">
                        <span className="text-base font-medium">Total</span>
                        <span className="text-2xl font-bold">{formatCostoTotal(costoTotal)}</span>
                      </div>
                      
                      {proposalCosts.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-600 mb-3">Desglose</h4>
                          {proposalCosts.map((cost, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {cost.product_name} ({cost.quantity} {cost.unit || 'unidades'})
                              </span>
                              <span className="font-medium">€{cost.subtotal}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Generated Proposal Preview (Clean Design) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Propuesta Comercial</CardTitle>
                  <CardDescription>
                    {proposalGeneratedAt 
                      ? `Generada el ${new Date(proposalGeneratedAt).toLocaleString("es-ES")}`
                      : "Vista previa de la propuesta generada"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {propuesta ? (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="mb-2 text-xs text-primary bg-primary/5 p-2 rounded">
                        DEBUG RFXDetailsDialog: Propuesta encontrada, longitud: {propuesta.length} caracteres
                      </div>
                      <ScrollArea className="h-96">
                        <div className="p-4 prose prose-sm max-w-none">
                          <TransformedHtmlContent html={propuesta} />
                        </div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No hay propuesta generada para este RFX</p>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default RFXDetailsDialog