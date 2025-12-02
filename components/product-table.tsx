"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, X, Trash2, AlertTriangle, FileText, Lightbulb, Sparkles, Edit3 } from "lucide-react"
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
          className="h-7 w-24 text-xs text-center border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )
  }

  return (
    <div 
      className="cursor-pointer hover:bg-blue-50 rounded px-2 py-1 transition-colors duration-200 text-center" 
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
            <span className="absolute left-2 text-xs text-gray-500 font-medium pointer-events-none">
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
              "h-7 w-20 text-xs text-center border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
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
        "cursor-pointer hover:bg-blue-50 rounded px-2 py-1 transition-colors duration-200 text-center",
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
  markProductPriceAsReviewed
}: ProductTableProps) {

  // Debug logging (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('ProductTable products:', productos.length)
  }
  
  if (productos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 flex items-center justify-center gap-2">
        <FileText className="h-5 w-5" />
        <span>No hay productos disponibles para configurar costos.</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header de Tabla */}
      <div className="grid grid-cols-12 gap-3 items-center py-3 px-4 bg-gray-50/50 rounded-lg text-xs font-medium text-gray-600 border border-gray-100">
        <div className="col-span-3">Producto</div>
        <div className="col-span-1 text-center">Cant.</div>
        <div className="col-span-1 text-center">Unidad</div>
        <div className="col-span-1 text-center">Costo</div>
        <div className="col-span-1 text-center">Precio</div>
        <div className="col-span-2 text-center">Ganancia</div>
        <div className="col-span-1 text-center">Margen</div>
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
                  : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/30",
                producto.isNew && "animate-glow-blue",
                producto.isModified && "animate-glow-yellow"
              )}
            >
              {/* Nombre del producto - 3 columnas */}
              <div className="col-span-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">{producto.nombre}</span>
                  {producto.isNew && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
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
                  <div className="text-xs text-blue-600 font-medium mt-1">Cantidad modificada</div>
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
                      <span className="text-xs text-gray-500 mt-1">
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
                <div className="text-xs text-gray-500">por unidad</div>
              </div>

              {/* Margen de Ganancia - 1 columna */}
              <div className="col-span-1 text-center">
                <div className="text-sm text-blue-600 font-medium">
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
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent border-0"
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

      {/* Resumen de Totales */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-600">Total Ganancia</div>
            <div className="text-xl font-bold text-green-600">
              {currencySymbol}{productos.reduce((sum, p) => {
                // Usar total_profit del backend si está disponible, sino calcular
                const totalProfit = (p as any).total_profit || 
                  ((p.ganancia_unitaria || 0) * (p.cantidadEditada ?? p.cantidadOriginal ?? p.cantidad ?? 1));
                return sum + totalProfit;
              }, 0).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Margen Promedio</div>
            <div className="text-xl font-bold text-blue-600">
              {productos.length > 0 
                ? (productos.reduce((sum, p) => sum + (p.margen_ganancia || 0), 0) / productos.length).toFixed(1)
                : "0.0"}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Productos</div>
            <div className="text-xl font-bold text-gray-800">
              {productos.reduce((sum, p) => sum + (p.cantidadEditada ?? p.cantidadOriginal ?? p.cantidad ?? 1), 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-3 text-xs text-gray-500 text-center flex items-center justify-center gap-2">
        <Lightbulb className="h-3 w-3" />
        <span>Haz clic en cualquier cantidad, precio o unidad para editarlo. Los cambios se guardan automáticamente al salir del campo o presionar Enter.</span>
      </div>
    </div>
  )
}
