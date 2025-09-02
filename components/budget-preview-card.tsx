"use client"

import { useMemo, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Calculator, TrendingUp, Users, Receipt, AlertTriangle } from "lucide-react"
import type { 
  PricingConfigFormData, 
  PricingCalculationResult,
  CoordinationType,
  CalculationBase 
} from "@/types/pricing-v2"
import { 
  calculateFrontendPricing,
  handleBackendPricingError 
} from "@/lib/api-pricing-backend-real"
import { pricingApiV2 } from "@/lib/api-pricing-v2"

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

interface BudgetPreviewCardProps {
  productos: ProductoIndividual[]
  config: PricingConfigFormData
  currencySymbol?: string
  formatPrice?: (amount: number) => string
  rfxId?: string // For API calculations
  useApiCalculations?: boolean // Toggle between client and server calculations
  onCalculationUpdate?: (result: PricingCalculationResult) => void
  
  // Real Backend Integration
  useRealBackend?: boolean // Toggle between mock and real backend
}

export default function BudgetPreviewCard({
  productos,
  config,
  currencySymbol = "€",
  formatPrice = (amount) => `${currencySymbol}${amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
  rfxId,
  useApiCalculations = false,
  onCalculationUpdate,
  useRealBackend = false
}: BudgetPreviewCardProps) {
  
  // State for API calculations
  const [apiCalculations, setApiCalculations] = useState<PricingCalculationResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationError, setCalculationError] = useState<string | null>(null)

  // Client-side calculations (fallback and for real-time preview)
  const clientCalculations = useMemo(() => {
    // Calculate subtotal from products
    const subtotal = productos.reduce((sum, producto) => {
      // Ensure values are numbers
      const cantidad = Number(producto.cantidadEditada) || Number(producto.cantidad) || 0;
      const precio = Number(producto.precio) || 0;
      const itemTotal = cantidad * precio;
      return sum + itemTotal;
    }, 0);
    
    // Calculate coordination cost using V2.2 format
    const coordinationAmount = config.coordination_enabled 
      ? (subtotal * config.coordination_rate)
      : 0
    
    // Calculate total before tax
    const totalBeforeTax = subtotal + coordinationAmount
    
    // Calculate tax amount
    const taxAmount = config.taxes_enabled 
      ? (totalBeforeTax * config.tax_rate)
      : 0
    
    // Calculate final total
    const finalTotal = totalBeforeTax + taxAmount
    
    // Calculate cost per person based on selected calculation base
    let costPerPerson = 0
    if (config.cost_per_person_enabled && config.headcount > 0) {
      switch (config.calculation_base) {
        case 'subtotal':
          costPerPerson = subtotal / config.headcount
          break
        case 'subtotal_with_coordination':
          costPerPerson = totalBeforeTax / config.headcount
          break
        case 'final_total':
        default:
          costPerPerson = finalTotal / config.headcount
          break
      }
    }
    
    return {
      subtotal,
      coordination_enabled: config.coordination_enabled,
      coordination_rate: config.coordination_rate,
      coordination_amount: coordinationAmount,
      cost_per_person_enabled: config.cost_per_person_enabled,
      headcount: config.headcount,
      cost_per_person: costPerPerson,
      taxes_enabled: config.taxes_enabled,
      tax_rate: config.tax_rate,
      tax_amount: taxAmount,
      total_before_tax: totalBeforeTax,
      final_total: finalTotal
    }
  }, [productos, config])

  // Use API calculations when available and enabled, otherwise use client calculations
  const calculations = apiCalculations && useApiCalculations ? apiCalculations : clientCalculations
  
  // Debug coordination issue
  if (config.coordination_enabled !== calculations.coordination_enabled) {
    console.log("⚠️ COORDINATION MISMATCH - Config:", config.coordination_enabled, "Calculations:", calculations.coordination_enabled);
  }

  // API calculation function
  const performApiCalculation = async () => {
    if (!rfxId || !useApiCalculations) return

    setIsCalculating(true)
    setCalculationError(null)

    try {
      const subtotal = productos.reduce((sum, producto) => {
        return sum + (producto.cantidadEditada * producto.precio)
      }, 0)

      let calculationResult = null

      if (useRealBackend) {
        // Use real backend V2.2 API
        console.log('🎯 Using REAL backend V2.2 API for calculations')
        calculationResult = await calculateFrontendPricing(rfxId, subtotal)
        
        if (calculationResult) {
          setApiCalculations(calculationResult)
          if (onCalculationUpdate) {
            onCalculationUpdate(calculationResult)
          }
          console.log('✅ Real backend calculation successful:', calculationResult)
        } else {
          setCalculationError('Error en cálculo con backend real V2.2')
        }
      } else {
        // Use legacy/mock API
        console.log('💻 Using legacy/mock API for calculations')
        const response = await pricingApiV2.calculatePricing({
          rfx_id: rfxId,
          base_subtotal: subtotal
        })

        if (response.success && response.data) {
          setApiCalculations(response.data)
          if (onCalculationUpdate) {
            onCalculationUpdate(response.data)
          }
        } else {
          setCalculationError(response.error?.message || 'Error en cálculo API legacy')
        }
      }
    } catch (error) {
      console.error('Error calling pricing API:', error)
      const errorMessage = useRealBackend 
        ? handleBackendPricingError(error)
        : 'Error de conexión con API de pricing'
      setCalculationError(errorMessage)
    } finally {
      setIsCalculating(false)
    }
  }

  // Trigger API calculation when products or config change (if enabled)
  useEffect(() => {
    if (useApiCalculations && rfxId) {
      const timeoutId = setTimeout(() => {
        performApiCalculation()
      }, 500) // Debounce API calls

      return () => clearTimeout(timeoutId)
    }
  }, [productos, config, rfxId, useApiCalculations])

  // Helper function to get coordination type display
  const getCoordinationTypeDisplay = (type: CoordinationType): string => {
    const types = {
      basic: '🔰 Básica',
      standard: '⭐ Estándar',
      premium: '💎 Premium',
      custom: '🛠️ Personalizada'
    }
    return types[type] || '⭐ Estándar'
  }

  // Helper function to get calculation base display
  const getCalculationBaseDisplay = (base: CalculationBase): string => {
    const bases = {
      subtotal: '💰 Subtotal',
      subtotal_with_coordination: '📊 Subtotal + Coordinación',
      final_total: '🎯 Total Final'
    }
    return bases[base] || '🎯 Total Final'
  }

  // If no products, show empty state
  if (productos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-xl">📋</span>
            Vista Previa del Presupuesto V2.2
          </CardTitle>
          <CardDescription>
            Configura productos y precios para ver la vista previa avanzada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">💰</div>
            <p className="text-gray-500">No hay productos configurados</p>
            <p className="text-sm text-gray-400 mt-1">
              Agrega productos en la configuración de precios para ver la vista previa
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-xl">📋</span>
          Vista Previa del Presupuesto V2.2
          {isCalculating && <RefreshCw className="h-4 w-4 animate-spin ml-2" />}
          {useApiCalculations && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {apiCalculations 
                ? (useRealBackend ? "🎯 Backend Real V2.2" : "🤖 API Legacy") 
                : "💻 Local"
              }
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {useApiCalculations 
            ? (useRealBackend 
                ? "🎯 Cálculos precisos usando Backend Real V2.2 con SQL"
                : "🤖 Cálculos usando API Legacy"
              )
            : "💻 Vista previa con cálculos locales instantáneos"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Calculation Error */}
        {calculationError && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Error en cálculos: {calculationError}
              <br />
              <span className="text-xs">Usando cálculos locales como fallback</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Budget Items */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 border-b pb-2 flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Items del Presupuesto
          </h4>
          
          {productos.map((producto) => {
            const cantidad = Number(producto.cantidadEditada) || Number(producto.cantidad) || 0;
            const precio = Number(producto.precio) || 0;
            const itemTotal = cantidad * precio;
            
            return (
              <div key={producto.id} className="flex justify-between items-start text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {producto.nombre}
                    {producto.isQuantityModified && (
                      <Badge variant="secondary" className="ml-2 text-xs">Editado</Badge>
                    )}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {cantidad} {producto.unidad} × {formatPrice(precio)}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-medium text-gray-900">
                    {formatPrice(itemTotal)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <Separator />

        {/* Subtotal */}
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-gray-700 flex items-center gap-2">
            <Calculator className="h-3 w-3" />
            Subtotal
          </span>
          <span className="font-medium text-gray-900">
            {formatPrice(calculations.subtotal)}
          </span>
        </div>

        {/* Coordination V2.2 */}
        {calculations.coordination_enabled && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              {getCoordinationTypeDisplay(config.coordination_type)} 
              ({(calculations.coordination_rate * 100).toFixed(2)}%)
            </span>
            <span className="text-gray-900">
              {formatPrice(calculations.coordination_amount)}
            </span>
          </div>
        )}

        {/* Tax Amount */}
        {calculations.taxes_enabled && calculations.tax_amount > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              {config.tax_name} ({(calculations.tax_rate * 100).toFixed(2)}%)
            </span>
            <span className="text-gray-900">
              {formatPrice(calculations.tax_amount)}
            </span>
          </div>
        )}

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Total Final
          </span>
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(calculations.final_total)}
          </span>
        </div>

        {/* Cost per person V2.2 */}
        {calculations.cost_per_person_enabled && calculations.headcount > 0 && (
          <>
            <Separator />
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-blue-800 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Costo por persona
                  </p>
                  <p className="text-xs text-blue-600">
                    {calculations.headcount} personas • Base: {getCalculationBaseDisplay(config.calculation_base)}
                  </p>
                </div>
                <span className="text-lg font-semibold text-blue-900">
                  {formatPrice(calculations.cost_per_person)}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Advanced Summary V2.2 */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h5 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
            📊 Resumen Avanzado V2.2
            {useApiCalculations && apiCalculations && (
              <Badge variant="outline" className="text-xs">SQL Calculado</Badge>
            )}
          </h5>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-500">Items:</span>
              <span className="ml-1 font-medium">{productos.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Coordinación:</span>
              <span className="ml-1 font-medium">
                {calculations.coordination_enabled 
                  ? `${getCoordinationTypeDisplay(config.coordination_type)}`
                  : "❌ No"
                }
              </span>
            </div>
            {calculations.cost_per_person_enabled && (
              <>
                <div>
                  <span className="text-gray-500">Personas:</span>
                  <span className="ml-1 font-medium">{calculations.headcount}</span>
                </div>
                <div>
                  <span className="text-gray-500">Por persona:</span>
                  <span className="ml-1 font-medium">{formatPrice(calculations.cost_per_person)}</span>
                </div>
              </>
            )}
            {calculations.taxes_enabled && (
              <>
                <div>
                  <span className="text-gray-500">Impuestos:</span>
                  <span className="ml-1 font-medium">
                    {config.tax_name} ({(calculations.tax_rate * 100).toFixed(1)}%)
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Monto impuesto:</span>
                  <span className="ml-1 font-medium">{formatPrice(calculations.tax_amount)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Calculation Method Info */}
        {useApiCalculations && (
          <div className="text-center">
            <Badge variant="outline" className="text-xs">
              {apiCalculations 
                ? (useRealBackend 
                    ? "🎯 Backend Real V2.2: calculate_rfx_pricing()" 
                    : "🤖 API Legacy: calculate_rfx_pricing()"
                  )
                : "💻 Cálculos locales (API no disponible)"
              }
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
