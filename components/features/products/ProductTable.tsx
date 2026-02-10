"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { CheckCircle, X, Trash2, AlertTriangle, FileText, Lightbulb, Sparkles, Edit3, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
function InlineEditableText({
  value,
  onChange,
}: { value: string; onChange: (v: string) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(value)
  }

  const handleSave = () => {
    const trimmed = editValue.trim()
    if (!trimmed) {
      setEditValue(value)
      setIsEditing(false)
      return
    }
    onChange(trimmed)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave()
    else if (e.key === "Escape") handleCancel()
  }

  const handleBlur = () => {
    // Auto-save on blur
    handleSave()
  }

  if (isEditing) {
    return (
      <div className="relative inline-flex items-center w-full justify-center">
        <Input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="h-7 w-24 text-xs text-center border-blue-400 focus:border-primary-light focus:ring-1 focus:ring-primary"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )
  }

  return (
    <div 
      className="cursor-pointer hover:bg-primary/5 rounded px-2 py-1 transition-colors duration-200 text-center" 
      onClick={handleEdit}
      title="Click para editar"
    >
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
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
  // Campos para animaciones del chat
  isNew?: boolean
  isModified?: boolean
}

interface ProductTableProps {
  productos: ProductoIndividual[]
  currencySymbol: string
  selectedCurrency: string
  onQuantityChange: (productId: string, quantity: number) => void
  onPriceChange: (productId: string, price: number) => void
  onCostChange?: (productId: string, cost: number) => void
  onUnitChange?: (productId: string, unit: string) => void
  onDeleteProduct?: (productId: string) => void
  isEditable?: boolean
  // Optional: Price review tracking functions from RFX context
  isProductPriceUnreviewed?: (productId: string) => boolean
  markProductPriceAsReviewed?: (productId: string) => void
  // Optional: Coordination and logistics configuration
  coordinationEnabled?: boolean
  coordinationRate?: number
  onCoordinationToggle?: (enabled: boolean) => void
  onCoordinationRateChange?: (rate: number) => void
}

interface InlineEditableCellProps {
  value: number
  onChange: (value: number) => void | Promise<void>
  type: "number"
  min?: number
  step?: string
  currencySymbol?: string
  className?: string
}

function InlineEditableCell({
  value,
  onChange,
  type,
  min = 0,
  step = "0.01",
  currencySymbol,
  className
}: InlineEditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value.toString())

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(value.toString())
  }

  const handleSave = async () => {
    const newValue = parseFloat(editValue) || 0
    try {
      await onChange(newValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving value:', error)
      // Don't exit edit mode on error, let user retry or cancel
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value.toString())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  const handleBlur = () => {
    // Auto-save on blur
    handleSave()
  }

  if (isEditing) {
    return (
      <div className="relative inline-flex items-center gap-1 w-full justify-center">
        <div className="relative flex items-center">
          {currencySymbol && (
            <span className="absolute left-2 text-xs text-muted-foreground font-medium pointer-events-none">
              {currencySymbol}
            </span>
          )}
          <Input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            min={min}
            step={step}
            className={cn(
              "h-7 w-20 text-xs text-center border-blue-400 focus:border-primary-light focus:ring-1 focus:ring-primary",
              currencySymbol && "pl-5"
            )}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "cursor-pointer hover:bg-primary/5 rounded px-2 py-1 transition-colors duration-200 text-center",
        className
      )}
      onClick={handleEdit}
      title="Click para editar"
    >
      <span className="text-sm text-gray-900">
        {currencySymbol && `${currencySymbol}`}{value.toFixed(type === "number" && !currencySymbol ? 0 : 2)}
      </span>
    </div>
  )
}

export default function ProductTable({
  productos,
  currencySymbol,
  selectedCurrency,
  onQuantityChange,
  onPriceChange,
  onCostChange,
  onUnitChange,
  onDeleteProduct,
  isEditable = true,
  isProductPriceUnreviewed,
  markProductPriceAsReviewed,
  coordinationEnabled = false,
  coordinationRate = 0.18,
  onCoordinationToggle,
  onCoordinationRateChange
}: ProductTableProps) {

  // Debug logging (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('ProductTable products:', productos.length)
    console.log('🔍 Coordination props:', {
      coordinationEnabled,
      coordinationRate,
      hasToggleHandler: !!onCoordinationToggle,
      hasRateHandler: !!onCoordinationRateChange
    })
  }
  
  if (productos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
        <FileText className="h-5 w-5" />
        <span>No products available to configure costs.</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Fila de Coordinación y Logística - Arriba del header */}
      {onCoordinationToggle && onCoordinationRateChange && (
        <div 
          className={cn(
            "flex items-center justify-between gap-4 py-2 px-4 rounded-md border mb-3 transition-all duration-200",
            coordinationEnabled 
              ? "bg-primary/5 border-primary/20" 
              : "bg-muted/50 border-border"
          )}
        >
          {/* Izquierda: Nombre y Badge de estado */}
          <div className="flex items-center gap-3">
            <Settings className={cn(
              "h-4 w-4 flex-shrink-0",
              coordinationEnabled ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-sm font-medium",
              coordinationEnabled ? "text-foreground" : "text-muted-foreground"
            )}>
              Coordinación y Logística
            </span>
            <Badge 
              variant={coordinationEnabled ? "default" : "secondary"}
              className="text-xs font-semibold"
            >
              {coordinationEnabled ? "✓ ACTIVO" : "INACTIVO"}
            </Badge>
          </div>

          {/* Derecha: Porcentaje, Toggle y Botón */}
          <div className="flex items-center gap-4">
            {/* Porcentaje */}
            {coordinationEnabled && isEditable ? (
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={(coordinationRate * 100).toFixed(1)}
                  onChange={(e) => {
                    const newRate = parseFloat(e.target.value) / 100
                    if (!isNaN(newRate) && newRate >= 0 && newRate <= 1) {
                      onCoordinationRateChange(newRate)
                    }
                  }}
                  min={0}
                  max={100}
                  step={0.1}
                  className="h-7 w-17 text-sm text-center"
                  disabled={!coordinationEnabled}
                />
                <span className="text-sm font-medium text-muted-foreground">%</span>
              </div>
            ) : coordinationEnabled ? (
              <div className="text-sm font-semibold text-foreground">
                {(coordinationRate * 100).toFixed(1)}%
              </div>
            ) : null}

            {/* Toggle - usa los estilos por defecto de shadcn */}
            <Switch
              checked={coordinationEnabled}
              onCheckedChange={onCoordinationToggle}
              disabled={!isEditable}
            />

            {/* Botón Aplicar - usa variant="default" que es el primary (morado) */}
            {coordinationEnabled && isEditable && (
              <Button
                size="sm"
                variant="default"
                className="h-7 px-3 text-xs"
                onClick={() => {
                  // Trigger recalculation or apply to products
                  console.log('Aplicar coordinación a productos')
                }}
              >
                Aplicar a Productos
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Header de Tabla */}
      <div className="grid grid-cols-12 gap-3 items-center py-3 px-4 bg-gray-50/50 rounded-lg text-xs font-medium text-muted-foreground border border-gray-100">
        <div className="col-span-3">Product</div>
        <div className="col-span-1 text-center">Qty.</div>
        <div className="col-span-1 text-center">Unit</div>
        <div className="col-span-1 text-center">Cost</div>
        <div className="col-span-1 text-center">Price</div>
        <div className="col-span-2 text-center">Profit</div>
        <div className="col-span-1 text-center">Margin</div>
        <div className="col-span-2 text-right">Subtotal</div>
      </div>

      {/* Filas de Productos */}
      <div className="space-y-2">
        {productos.map((producto) => {
          const safeQuantity = producto.cantidadEditada ?? producto.cantidadOriginal ?? producto.cantidad ?? 1
          const subtotal = safeQuantity * producto.precio
          
          // Check if product price needs review
          const needsPriceReview = isProductPriceUnreviewed && isProductPriceUnreviewed(producto.id)
          
          // Enhanced price change handler that marks product as reviewed
          const handlePriceChange = (value: number) => {
            onPriceChange(producto.id, value)
            // Mark as reviewed when user manually updates price
            if (markProductPriceAsReviewed) {
              markProductPriceAsReviewed(producto.id)
            }
          }

          return (
            <div
              key={producto.id}
              className={cn(
                "grid grid-cols-12 gap-3 items-center py-3 px-4 border rounded-lg transition-all duration-200",
                needsPriceReview 
                  ? "border-amber-200 bg-amber-50/50 hover:border-amber-300 hover:bg-amber-50/80" 
                  : "border-gray-100 hover:border hover:bg-gray-50/30",
                producto.isNew && "animate-glow-blue",
                producto.isModified && "animate-glow-yellow"
              )}
            >
              {/* Nombre del producto - 3 columnas */}
              <div className="col-span-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">{producto.nombre}</span>
                  {producto.isNew && (
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary-dark border-primary/20">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Nuevo
                    </Badge>
                  )}
                  {producto.isModified && !producto.isNew && (
                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                      <Edit3 className="h-3 w-3 mr-1" />
                      Modificado
                    </Badge>
                  )}
                </div>
                {producto.isQuantityModified && (
                  <div className="text-xs text-primary font-medium mt-1">Cantidad modificada</div>
                )}
                {needsPriceReview && (
                  <div className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    Precio requiere revisión
                  </div>
                )}
              </div>

              {/* Cantidad - 1 columna */}
              <div className="col-span-1 text-center">
                {isEditable ? (
                  <div className="flex flex-col items-center">
                    <InlineEditableCell
                      value={safeQuantity}
                      onChange={(value) => onQuantityChange(producto.id, value)}
                      type="number"
                      min={0}
                      step="1"
                      className="w-full text-center"
                    />
                    {producto.isQuantityModified && (
                      <span className="text-xs text-muted-foreground mt-1">
                        (Original: {producto.cantidadOriginal})
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-gray-900">{safeQuantity}</span>
                )}
              </div>

              {/* Unidad - 1 columna */}
              <div className="col-span-1 text-center">
                {isEditable && onUnitChange ? (
                  <InlineEditableText
                    value={producto.unidad}
                    onChange={(val) => onUnitChange(producto.id, val)}
                  />
                ) : (
                  <span className="text-sm text-gray-700">{producto.unidad}</span>
                )}
              </div>

              {/* Costo Unitario - 1 columna */}
              <div className="col-span-1 text-center">
                {isEditable ? (
                  <InlineEditableCell
                    value={producto.costo_unitario || 0}
                    onChange={async (value) => {
                      if (onCostChange) {
                        try {
                          await onCostChange(producto.id, value)
                        } catch (error) {
                          console.error('❌ Error updating cost:', error)
                          throw error // Re-throw to let InlineEditableCell handle it
                        }
                      }
                    }}
                    type="number"
                    min={0}
                    step="0.01"
                    currencySymbol={currencySymbol}
                    className="w-full text-center"
                  />
                ) : (
                  <div className="text-sm text-gray-900">
                    {currencySymbol}{producto.costo_unitario?.toFixed(2) || "0.00"}
                  </div>
                )}
              </div>

              {/* Precio Unitario - 1 columna */}
              <div className="col-span-1 text-center">
                {isEditable ? (
                  <InlineEditableCell
                    value={producto.precio}
                    onChange={handlePriceChange}
                    type="number"
                    min={0}
                    step="0.01"
                    currencySymbol={currencySymbol}
                    className={cn(
                      "w-full text-center",
                      needsPriceReview && "border-amber-300 bg-amber-50"
                    )}
                  />
                ) : (
                  <span className="text-sm text-gray-900">
                    {currencySymbol}{producto.precio.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Ganancia Unitaria - 2 columnas */}
              <div className="col-span-2 text-center">
                <div className="text-sm text-green-600 font-medium">
                  {currencySymbol}{producto.ganancia_unitaria?.toFixed(2) || "0.00"}
                </div>
                <div className="text-xs text-muted-foreground">per unit</div>
              </div>

              {/* Margen de Ganancia - 1 columna */}
              <div className="col-span-1 text-center">
                <div className="text-sm text-primary font-medium">
                  {producto.margen_ganancia?.toFixed(1) || "0.0"}%
                </div>
              </div>

              {/* Subtotal - 2 columnas */}
              <div className="col-span-2 text-right flex items-center justify-end gap-2">
                <div className="font-semibold text-gray-900">
                  {currencySymbol}{subtotal.toFixed(2)}
                </div>
                
                {/* Botón eliminar (opcional) */}
                {onDeleteProduct && isEditable && (
                  <Button
                    onClick={() => onDeleteProduct(producto.id)}
                    className="h-6 w-6 p-0 text-destructive hover:text-red-700 hover:bg-red-50 bg-transparent border-0"
                    title="Eliminar producto"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

     {/* Resumen de Totales del Presupuesto */}
      <div className="mt-6 space-y-3">
        {/* Cálculos */}
        {(() => {
          const subtotalProductos = productos.reduce((sum, p) => {
            const qty = p.cantidadEditada ?? p.cantidadOriginal ?? p.cantidad ?? 1;
            return sum + (qty * p.precio);
          }, 0);
 
          const coordinacionMonto = coordinationEnabled ? subtotalProductos * coordinationRate : 0;
          const totalFinal = subtotalProductos + coordinacionMonto;
 
          return (
            <>
              {/* Subtotal de Productos */}
              <div className="flex items-center justify-between py-2 px-4 bg-muted/30 rounded-md">
                <span className="text-sm font-medium text-muted-foreground">Subtotal de Productos</span>
                <span className="text-lg font-semibold text-foreground">
                  {currencySymbol}{subtotalProductos.toFixed(2)}
                </span>
              </div>
 
              {/* Coordinación y Logística (solo si está activa) */}
              {coordinationEnabled && (
                <div className="flex items-center justify-between py-2 px-4 bg-primary/5 rounded-md border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      Coordinación y Logística ({(coordinationRate * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-primary">
                    {currencySymbol}{coordinacionMonto.toFixed(2)}
                  </span>
                </div>
              )}
 
              {/* Total Final */}
              <div className="flex items-center justify-between py-3 px-4 bg-muted/50 border-2 border-primary/30 rounded-md">
                <span className="text-base font-bold text-foreground">Total del Presupuesto</span>
                <span className="text-2xl font-bold text-primary">
                  {currencySymbol}{totalFinal.toFixed(2)}
                </span>
              </div>
 
              {/* Métricas adicionales */}
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Total Profit</div>
                  <div className="text-lg font-bold text-green-600">
                    {currencySymbol}{productos.reduce((sum, p) => {
                      const totalProfit = (p as any).total_profit || 
                        ((p.ganancia_unitaria || 0) * (p.cantidadEditada ?? p.cantidadOriginal ?? p.cantidad ?? 1));
                      return sum + totalProfit;
                    }, 0).toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">
                    {coordinationEnabled ? "Total Margin (with Coordination)" : "Average Margin"}
                  </div>
                  <div className="text-lg font-bold text-primary">
                    {(() => {
                      if (coordinationEnabled && totalFinal > 0) {
                        // Calcular ganancia total de productos
                        const totalProfitProductos = productos.reduce((sum, p) => {
                          const totalProfit = (p as any).total_profit || 
                            ((p.ganancia_unitaria || 0) * (p.cantidadEditada ?? p.cantidadOriginal ?? p.cantidad ?? 1));
                          return sum + totalProfit;
                        }, 0);
                        
                        // Ganancia total = ganancia productos + coordinación
                        const totalProfitConCoordinacion = totalProfitProductos + coordinacionMonto;
                        
                        // Margen total = (ganancia total / total presupuesto) * 100
                        const margenTotal = (totalProfitConCoordinacion / totalFinal) * 100;
                        return margenTotal.toFixed(1);
                      } else {
                        // Sin coordinación, mostrar margen promedio de productos
                        return productos.length > 0 
                          ? (productos.reduce((sum, p) => sum + (p.margen_ganancia || 0), 0) / productos.length).toFixed(1)
                          : "0.0";
                      }
                    })()}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Total Products</div>
                  <div className="text-lg font-bold text-foreground">
                    {productos.reduce((sum, p) => sum + (p.cantidadEditada ?? p.cantidadOriginal ?? p.cantidad ?? 1), 0)}
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Información adicional */}
      <div className="mt-3 text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
        <Lightbulb className="h-3 w-3" />
        <span>Click on any quantity, price or unit to edit it. Changes are saved automatically when leaving the field or pressing Enter.</span>
      </div>
    </div>
  )
}
