"use client"

import { useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Calculator, TrendingUp, DollarSign, Package } from "lucide-react"

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

interface PricingCalculatorProps {
  productos: ProductoIndividual[]
  currencySymbol: string
  selectedCurrency: string
  taxRate?: number
  coordinationFee?: number
  onTotalChange?: (total: number) => void
}

interface CalculationBreakdown {
  subtotal: number
  coordinationFee: number
  tax: number
  total: number
  productCount: number
  itemCount: number
  modifiedProducts: number
}

export default function PricingCalculator({
  productos,
  currencySymbol,
  selectedCurrency,
  taxRate = 0.21, // 21% IVA por defecto
  coordinationFee = 0.15, // 15% coordinación por defecto
  onTotalChange
}: PricingCalculatorProps) {
  const calculations = useMemo(() => {
    const subtotal = productos.reduce((sum, producto) => {
      const quantity = producto.cantidadEditada ?? producto.cantidadOriginal ?? producto.cantidad ?? 1
      return sum + (quantity * producto.precio)
    }, 0)
    
    const coordinationCost = subtotal * coordinationFee
    const tax = (subtotal + coordinationCost) * taxRate
    const total = subtotal + coordinationCost + tax
    
    const breakdown: CalculationBreakdown = {
      subtotal,
      coordinationFee: coordinationCost,
      tax,
      total,
      productCount: productos.length,
      itemCount: productos.reduce((sum, p) => sum + (p.cantidadEditada ?? p.cantidadOriginal ?? p.cantidad ?? 1), 0),
      modifiedProducts: productos.filter(p => p.isQuantityModified).length
    }
    
    return breakdown
  }, [productos, taxRate, coordinationFee])

  // Notify parent of total change after render
  useEffect(() => {
    if (onTotalChange && calculations.total !== undefined) {
      onTotalChange(calculations.total)
    }
  }, [onTotalChange, calculations.total])

  const formatPrice = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`
  }

  if (productos.length === 0) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-6 text-center">
          <Calculator className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            Agregue productos para ver el cálculo de precios
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Resumen de productos */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Resumen de Productos
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-900">
                {calculations.productCount}
              </div>
              <div className="text-xs text-blue-600">Productos</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-900">
                {calculations.itemCount}
              </div>
              <div className="text-xs text-blue-600">Unidades totales</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-900">
                {calculations.modifiedProducts}
              </div>
              <div className="text-xs text-blue-600">Modificados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown de productos */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-800 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Desglose por Producto
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {productos.map((producto) => {
              const quantity = producto.cantidadEditada ?? producto.cantidadOriginal ?? producto.cantidad ?? 1
              const subtotal = quantity * producto.precio
              
              return (
                <div key={producto.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {producto.nombre}
                      </span>
                      {producto.isQuantityModified && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          Modificado
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {quantity} {producto.unidad} × {formatPrice(producto.precio)}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatPrice(subtotal)}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cálculo final */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cálculo Final ({selectedCurrency})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal productos:</span>
              <span className="font-medium text-gray-900">{formatPrice(calculations.subtotal)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Coordinación y logística ({(coordinationFee * 100).toFixed(0)}%):</span>
              <span className="font-medium text-gray-900">{formatPrice(calculations.coordinationFee)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IVA ({(taxRate * 100).toFixed(0)}%):</span>
              <span className="font-medium text-gray-900">{formatPrice(calculations.tax)}</span>
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex justify-between font-semibold text-base">
              <span className="text-green-800">Total:</span>
              <span className="text-green-900 text-lg">{formatPrice(calculations.total)}</span>
            </div>
          </div>

          {/* Información adicional */}
          <div className="pt-2 border-t border-green-200">
            <div className="text-xs text-green-700 space-y-1">
              <div>• Base imponible: {formatPrice(calculations.subtotal + calculations.coordinationFee)}</div>
              <div>• Precio promedio por unidad: {formatPrice(calculations.subtotal / Math.max(calculations.itemCount, 1))}</div>
              {calculations.modifiedProducts > 0 && (
                <div className="text-blue-600">
                  • {calculations.modifiedProducts} producto(s) con cantidades modificadas
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
