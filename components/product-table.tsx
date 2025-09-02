"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CheckCircle, X, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
function InlineEditableText({
  value,
  onChange,
}: { value: string; onChange: (v: string) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [error, setError] = useState<string | null>(null)

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(value)
    setError(null)
  }

  const handleSave = () => {
    const trimmed = editValue.trim()
    if (!trimmed) {
      setError("La unidad no puede estar vacía")
      return
    }
    onChange(trimmed)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value)
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave()
    else if (e.key === "Escape") handleCancel()
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn("h-8 text-sm", error ? "border-red-300 bg-red-50" : "border-blue-300")}
          autoFocus
        />
        <Button onClick={handleSave} className="h-6 w-6 p-0 bg-emerald-600 hover:bg-emerald-700 text-white border-0">
          <CheckCircle className="h-3 w-3" />
        </Button>
        <Button onClick={handleCancel} className="h-6 w-6 p-0 border-gray-300 text-gray-600 hover:bg-gray-50 bg-white">
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className="cursor-pointer hover:bg-blue-50 rounded px-2 py-1 transition-colors duration-200" onClick={handleEdit}>
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
}

interface ProductTableProps {
  productos: ProductoIndividual[]
  currencySymbol: string
  selectedCurrency: string
  onQuantityChange: (productId: string, quantity: number) => void
  onPriceChange: (productId: string, price: number) => void
  onUnitChange?: (productId: string, unit: string) => void
  onDeleteProduct?: (productId: string) => void
  isEditable?: boolean
  // Optional: Price review tracking functions from RFX context
  isProductPriceUnreviewed?: (productId: string) => boolean
  markProductPriceAsReviewed?: (productId: string) => void
}

interface InlineEditableCellProps {
  value: number
  onChange: (value: number) => void
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

  const handleSave = () => {
    const newValue = parseFloat(editValue) || 0
    onChange(newValue)
    setIsEditing(false)
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

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        {currencySymbol && (
          <span className="text-sm text-gray-500 font-medium">
            {currencySymbol}
          </span>
        )}
        <Input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          min={min}
          step={step}
          className="h-8 text-sm border-blue-300 focus:border-blue-400"
          autoFocus
        />
        <Button
          onClick={handleSave}
          className="h-6 w-6 p-0 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
        >
          <CheckCircle className="h-3 w-3" />
        </Button>
        <Button
          onClick={handleCancel}
          className="h-6 w-6 p-0 border-gray-300 text-gray-600 hover:bg-gray-50 bg-white"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "cursor-pointer hover:bg-blue-50 rounded px-2 py-1 transition-colors duration-200",
        className
      )}
      onClick={handleEdit}
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
  onUnitChange,
  onDeleteProduct,
  isEditable = true,
  isProductPriceUnreviewed,
  markProductPriceAsReviewed
}: ProductTableProps) {
  if (productos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        📝 No hay productos disponibles para configurar costos.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header de Tabla */}
      <div className="grid grid-cols-12 gap-4 items-center py-3 px-4 bg-gray-50/50 rounded-lg text-sm font-medium text-gray-600 border border-gray-100">
        <div className="col-span-4">Producto</div>
        <div className="col-span-2 text-center">Cantidad</div>
        <div className="col-span-2 text-center">Unidad</div>
        <div className="col-span-2 text-center">Precio Unit.</div>
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
                "grid grid-cols-12 gap-4 items-center py-4 px-4 border rounded-lg transition-all duration-200",
                needsPriceReview 
                  ? "border-amber-200 bg-amber-50/50 hover:border-amber-300 hover:bg-amber-50/80" 
                  : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/30"
              )}
            >
              {/* Nombre del producto - 4 columnas */}
              <div className="col-span-4">
                <div className="font-medium text-gray-900">{producto.nombre}</div>
                <div className="text-sm text-gray-500">Unidad: {producto.unidad}</div>
                {producto.isQuantityModified && (
                  <div className="text-xs text-blue-600 font-medium">Cantidad modificada</div>
                )}
                {needsPriceReview && (
                  <div className="text-xs text-amber-600 font-medium flex items-center gap-1">
                    ⚠️ Precio requiere revisión tras cambio de moneda
                  </div>
                )}
              </div>

              {/* Cantidad - 2 columnas */}
              <div className="col-span-2 text-center">
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

              {/* Unidad - 2 columnas */}
              <div className="col-span-2 text-center">
                {isEditable && onUnitChange ? (
                  <InlineEditableText
                    value={producto.unidad}
                    onChange={(val) => onUnitChange(producto.id, val)}
                  />
                ) : (
                  <span className="text-sm text-gray-700">{producto.unidad}</span>
                )}
              </div>

              {/* Precio Unitario - 2 columnas */}
              <div className="col-span-2 text-center">
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

      {/* Información adicional */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        💡 Haz clic en cualquier cantidad o precio para editarlo. Presiona Enter para confirmar o Escape para cancelar.
      </div>
    </div>
  )
}
