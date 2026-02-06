"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatsCards } from "../shared/StatsCards"
import ProductTable from "@/components/features/products/ProductTable"

interface ProductoIndividual {
  id: string
  nombre: string
  cantidad: number
  cantidadOriginal: number
  cantidadEditada: number
  unidad: string
  precio: number
  isQuantityModified: boolean
  costo_unitario?: number
  ganancia_unitaria?: number
  margen_ganancia?: number
  total_profit?: number
}

interface PreviewTabProps {
  productos: ProductoIndividual[]
  config: any
  formatPrice: (amount: number) => string
  currencySymbol?: string
  selectedCurrency?: string
  onQuantityChange?: (productId: string, newQuantity: number) => void
  onPriceChange?: (productId: string, newPrice: number) => void
  onCostChange?: (productId: string, newCost: number) => void
  onUnitChange?: (productId: string, newUnit: string) => void
  onDeleteProduct?: (productId: string) => void
  onCoordinationToggle?: (enabled: boolean) => void
  onCoordinationRateChange?: (rate: number) => void
  isEditable?: boolean
}

export function PreviewTab({ 
  productos, 
  config, 
  formatPrice, 
  currencySymbol = "€",
  selectedCurrency = "USD",
  onQuantityChange,
  onPriceChange,
  onCostChange,
  onUnitChange,
  onDeleteProduct,
  onCoordinationToggle,
  onCoordinationRateChange,
  isEditable = true
}: PreviewTabProps) {
  const calculateSubtotal = () => {
    return productos.reduce((sum, p) => {
      const qty = p.cantidadEditada ?? p.cantidadOriginal ?? p.cantidad ?? 1
      return sum + (qty * p.precio)
    }, 0)
  }

  const calculateCoordination = () => {
    const subtotal = calculateSubtotal()
    return config.coordination_enabled ? subtotal * config.coordination_rate : 0
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateCoordination()
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <StatsCards
        subtotal={calculateSubtotal()}
        coordination={calculateCoordination()}
        total={calculateTotal()}
        currencySymbol={currencySymbol}
      />

      {/* Tabla de productos editable con coordinación */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configurar Precios de Productos</CardTitle>
              <CardDescription>
                Configure precios y cantidades. Los cambios se guardan automáticamente.
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {productos.length} productos
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ProductTable
            productos={productos}
            currencySymbol={currencySymbol}
            selectedCurrency={selectedCurrency}
            onQuantityChange={onQuantityChange || (() => {})}
            onPriceChange={onPriceChange || (() => {})}
            onCostChange={onCostChange}
            onUnitChange={onUnitChange}
            onDeleteProduct={onDeleteProduct}
            isEditable={isEditable}
            coordinationEnabled={config.coordination_enabled}
            coordinationRate={config.coordination_rate}
            onCoordinationToggle={onCoordinationToggle}
            onCoordinationRateChange={onCoordinationRateChange}
          />
        </CardContent>
      </Card>
    </div>
  )
}
