"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreateProductRequest {
  nombre: string
  categoria?: string
  cantidad: number
  unidad: string
  precio: number
  descripcion?: string
}

interface ProductFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (product: CreateProductRequest) => void
  initialData?: Partial<CreateProductRequest>
  mode?: 'create' | 'edit'
  currencySymbol: string
}

const categorias = [
  "Pasapalos Salados",
  "Pasapalos Dulces", 
  "Bebidas",
  "Servicios",
  "Otros"
]

const unidades = [
  "unidades",
  "personas",
  "kg",
  "litros",
  "piezas",
  "bandejas",
  "docenas",
  "metros",
  "horas"
]

export default function ProductFormDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = 'create',
  currencySymbol
}: ProductFormDialogProps) {
  const [formData, setFormData] = useState<CreateProductRequest>({
    nombre: initialData?.nombre || "",
    categoria: initialData?.categoria || "",
    cantidad: initialData?.cantidad || 1,
    unidad: initialData?.unidad || "unidades",
    precio: initialData?.precio || 0,
    descripcion: initialData?.descripcion || ""
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre del producto es requerido"
    }
    
    if (formData.cantidad <= 0) {
      newErrors.cantidad = "La cantidad debe ser mayor a 0"
    }
    
    if (!formData.unidad.trim()) {
      newErrors.unidad = "La unidad es requerida"
    }
    
    if (formData.precio < 0) {
      newErrors.precio = "El precio no puede ser negativo"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      await onSubmit(formData)
      onClose()
      
      // Reset form
      setFormData({
        nombre: "",
        categoria: "",
        cantidad: 1,
        unidad: "unidades",
        precio: 0,
        descripcion: ""
      })
      setErrors({})
    } catch (error) {
      console.error("Error submitting product:", error)
      setErrors({ submit: "Error al guardar el producto. Intente nuevamente." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    setErrors({})
    setFormData({
      nombre: initialData?.nombre || "",
      categoria: initialData?.categoria || "",
      cantidad: initialData?.cantidad || 1,
      unidad: initialData?.unidad || "unidades",
      precio: initialData?.precio || 0,
      descripcion: initialData?.descripcion || ""
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            {mode === 'create' ? 'Agregar Nuevo Producto' : 'Editar Producto'}
          </DialogTitle>
          <DialogDescription>
            Complete la información del producto para {mode === 'create' ? 'agregarlo a' : 'actualizar'} la configuración de precios
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Nombre del producto */}
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Producto *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Tequeños de queso"
                  className={cn(
                    "border bg-background focus:border-gray-400 focus:ring-gray-200",
                    errors.nombre && "border-red-300 bg-red-50"
                  )}
                />
                {errors.nombre && (
                  <p className="text-xs text-destructive">{errors.nombre}</p>
                )}
              </div>
              
              {/* Categoría */}
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
                >
                  <SelectTrigger className="border bg-background focus:border-gray-400">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cantidad, Unidad y Precio */}
            <div className="grid grid-cols-3 gap-4">
              {/* Cantidad */}
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad *</Label>
                <Input
                  id="cantidad"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.cantidad}
                  onChange={(e) => setFormData(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 1 }))}
                  className={cn(
                    "border bg-background focus:border-gray-400 focus:ring-gray-200",
                    errors.cantidad && "border-red-300 bg-red-50"
                  )}
                />
                {errors.cantidad && (
                  <p className="text-xs text-destructive">{errors.cantidad}</p>
                )}
              </div>
              
              {/* Unidad */}
              <div className="space-y-2">
                <Label htmlFor="unidad">Unidad *</Label>
                <Select
                  value={formData.unidad}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, unidad: value }))}
                >
                  <SelectTrigger className={cn(
                    "border bg-background focus:border-gray-400",
                    errors.unidad && "border-red-300 bg-red-50"
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((unidad) => (
                      <SelectItem key={unidad} value={unidad}>
                        {unidad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unidad && (
                  <p className="text-xs text-destructive">{errors.unidad}</p>
                )}
              </div>
              
              {/* Precio */}
              <div className="space-y-2">
                <Label htmlFor="precio">Precio Unitario ({currencySymbol})</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-medium">
                    {currencySymbol}
                  </span>
                  <Input
                    id="precio"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData(prev => ({ ...prev, precio: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className={cn(
                      "flex-1 border bg-background focus:border-gray-400 focus:ring-gray-200",
                      errors.precio && "border-red-300 bg-red-50"
                    )}
                  />
                </div>
                {errors.precio && (
                  <p className="text-xs text-destructive">{errors.precio}</p>
                )}
              </div>
            </div>

            {/* Descripción opcional */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción (opcional)</Label>
              <Input
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Información adicional sobre el producto"
                className="border bg-background focus:border-gray-400 focus:ring-gray-200"
              />
            </div>
          </div>

          {/* Preview del subtotal */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">Subtotal calculado:</span>
              <span className="text-lg font-semibold text-blue-900">
                {currencySymbol}{(formData.cantidad * formData.precio).toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-primary mt-1">
              {formData.cantidad} {formData.unidad} × {currencySymbol}{formData.precio.toFixed(2)}
            </div>
          </div>

          {errors.submit && (
            <div className="text-sm text-destructive bg-red-50 border border-red-200 rounded-lg p-3">
              {errors.submit}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="gap-2 bg-background hover:bg-secondary border text-gray-700 hover:text-gray-800"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 bg-gray-800 hover:bg-gray-900 text-background shadow-sm"
            >
              <CheckCircle className="h-4 w-4" />
              {isSubmitting ? 'Guardando...' : (mode === 'create' ? 'Agregar Producto' : 'Actualizar Producto')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
