"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CurrencySelector } from "@/components/ui/currency-selector"
import { RefreshCw, Plus, DollarSign } from "lucide-react"
import InlineEditableField from "@/components/ui/inline-editable-field"
import ProductTable from "@/components/product-table"
import ProductFormDialog from "@/components/product-form-dialog"
import { useRFXCurrencyCompatible } from "@/contexts/RFXCurrencyContext"

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
}

interface DataExtractionContentProps {
  extractedData: ExtractedData
  onFieldSave: (field: keyof ExtractedData, value: string | number) => Promise<void>
  originalText?: string
  isDisabled?: boolean
  
  // Product management props
  productosIndividuales?: ProductoIndividual[]
  onAddProduct?: (productData: any) => void
  onDeleteProduct?: (productId: string) => void
  onQuantityChange?: (productId: string, newQuantity: number) => void
  onPriceChange?: (productId: string, newPrice: number) => void
  onUnitChange?: (productId: string, newUnit: string) => void
  onSaveProductCosts?: () => void
  isSavingCosts?: boolean
  costsSaved?: boolean
  // Backend-provided currency to seed selector
  defaultCurrency?: string
  // Currency change handler to persist changes
  onCurrencyChange?: (currency: string) => void
}

export default function DataExtractionContent({
  extractedData,
  onFieldSave,
  originalText = "",
  isDisabled = false,
  // Product management props
  productosIndividuales = [],
  onAddProduct,
  onDeleteProduct,
  onQuantityChange,
  onPriceChange,
  onUnitChange,
  onSaveProductCosts,
  isSavingCosts = false,
  costsSaved = false,
  defaultCurrency,
  onCurrencyChange
}: DataExtractionContentProps) {
  
  // State for product form dialog
  const [isAddingProduct, setIsAddingProduct] = useState(false)

  // Currency hook (uses context if available, fallback to local)
  const { 
    selectedCurrency, 
    setCurrency, 
    getCurrencyInfo, 
    formatPrice, 
    formatPriceWithSymbol,
    markProductPriceAsReviewed,
    isProductPriceUnreviewed
  } = useRFXCurrencyCompatible(defaultCurrency || "EUR")

  // Currency change handler (use parent handler if available, fallback to local)
  const handleCurrencyChange = (newCurrency: string) => {
    if (onCurrencyChange) {
      onCurrencyChange(newCurrency);
    } else {
      setCurrency(newCurrency);
    }
  };

  // Add product handler
  const handleAddProductWrapper = async (productData: any) => {
    try {
      if (onAddProduct) {
        await onAddProduct(productData)
        setIsAddingProduct(false)
      }
    } catch (error) {
      console.error("Error adding product:", error)
    }
  }
  return (
    <div className="space-y-6">
      {/* Datos del Solicitante */}
      <Card className={isDisabled ? "opacity-50" : ""} style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", transition: "box-shadow 0.3s ease" }}>
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
              onSave={(value) => onFieldSave("solicitante", value)}
              label="Nombre" 
              originalText={originalText}
              placeholder="Nombre del solicitante"
              disabled={isDisabled}
            />
            <InlineEditableField 
              value={extractedData.email} 
              onSave={(value) => onFieldSave("email", value)}
              type="email"
              label="Email" 
              placeholder="email@empresa.com"
              disabled={isDisabled}
            />
            {extractedData.telefonoSolicitante && (
              <InlineEditableField 
                value={extractedData.telefonoSolicitante} 
                onSave={(value) => onFieldSave("telefonoSolicitante", value)}
                type="tel"
                label="Teléfono" 
                placeholder="Teléfono del solicitante"
                disabled={isDisabled}
              />
            )}
            {extractedData.cargoSolicitante && (
              <InlineEditableField 
                value={extractedData.cargoSolicitante} 
                onSave={(value) => onFieldSave("cargoSolicitante", value)}
                label="Cargo" 
                placeholder="Cargo del solicitante"
                disabled={isDisabled}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Datos de la Empresa */}
      <Card className={isDisabled ? "opacity-50" : ""} style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", transition: "box-shadow 0.3s ease" }}>
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
                onSave={(value) => onFieldSave("nombreEmpresa", value)}
                label="Nombre de la Empresa" 
                placeholder="Nombre de la empresa"
                disabled={isDisabled}
              />
            ) : (
              <InlineEditableField 
                value=""
                onSave={(value) => onFieldSave("nombreEmpresa", value)}
                label="Nombre de la Empresa"
                placeholder="Haz clic para agregar..."
                disabled={isDisabled}
              />
            )}
            {extractedData.emailEmpresa ? (
              <InlineEditableField 
                value={extractedData.emailEmpresa} 
                onSave={(value) => onFieldSave("emailEmpresa", value)}
                type="email"
                label="Email de la Empresa" 
                placeholder="contacto@empresa.com"
                disabled={isDisabled}
              />
            ) : (
              <InlineEditableField 
                value=""
                onSave={(value) => onFieldSave("emailEmpresa", value)}
                type="email"
                label="Email de la Empresa"
                placeholder="Haz clic para agregar..."
                disabled={isDisabled}
              />
            )}
            {extractedData.telefonoEmpresa ? (
              <InlineEditableField 
                value={extractedData.telefonoEmpresa} 
                onSave={(value) => onFieldSave("telefonoEmpresa", value)}
                type="tel"
                label="Teléfono de la Empresa" 
                placeholder="Teléfono de la empresa"
                disabled={isDisabled}
              />
            ) : (
              <InlineEditableField 
                value=""
                onSave={(value) => onFieldSave("telefonoEmpresa", value)}
                type="tel"
                label="Teléfono de la Empresa"
                placeholder="Haz clic para agregar..."
                disabled={isDisabled}
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
      <Card className={isDisabled ? "opacity-50" : ""} style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", transition: "box-shadow 0.3s ease" }}>
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
              onSave={(value) => onFieldSave("productos", value)}
              label="Productos" 
              placeholder="Productos solicitados"
              type="textarea"
              disabled={isDisabled}
            />
            <InlineEditableField 
              value={extractedData.fechaEntrega} 
              onSave={(value) => onFieldSave("fechaEntrega", value)}
              type="date"
              label="Fecha Entrega" 
              placeholder="Fecha de entrega"
              disabled={isDisabled}
            />
            <InlineEditableField 
              value={extractedData.lugarEntrega} 
              onSave={(value) => onFieldSave("lugarEntrega", value)}
              label="Lugar Entrega" 
              placeholder="Lugar de entrega"
              disabled={isDisabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Requirements Específicos */}
      <Card className={isDisabled ? "opacity-50" : ""} style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", transition: "box-shadow 0.3s ease" }}>
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
                onSave={(value) => onFieldSave("requirements", value)}
                label="Instrucciones Específicas del Cliente" 
                placeholder="Ej: Personal con más de 5 años de experiencia, sin frutos secos por alergias..."
                type="textarea"
                disabled={isDisabled}
              />
            ) : (
              <InlineEditableField 
                value=""
                onSave={(value) => onFieldSave("requirements", value)}
                label="Instrucciones Específicas del Cliente"
                placeholder="Haz clic para agregar requirements..."
                type="textarea"
                disabled={isDisabled}
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

      {/* Product Configuration Section */}
      {productosIndividuales.length > 0 && (
        <Card className={isDisabled ? "opacity-50" : ""}>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span>Configurar Precios de Productos</span>
              
              {/* Controls */}
              <div className="ml-auto flex items-center gap-3">
                {/* Currency selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Moneda:</span>
                  <CurrencySelector 
                    value={selectedCurrency} 
                    onValueChange={handleCurrencyChange}
                    className="w-[140px]"
                  />
                </div>
                
                {/* Add product button */}
                {onAddProduct && (
                  <Button 
                    onClick={() => setIsAddingProduct(true)}
                    className="gap-2 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-800 shadow-sm"
                    disabled={isDisabled}
                  >
                    <Plus className="h-4 w-4" />
                    Agregar
                  </Button>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              Configure precios y cantidades. Los cambios se guardan automáticamente.
              {productosIndividuales.some(p => p.isQuantityModified) && (
                <span className="block mt-1 text-blue-600 font-medium">
                  ✏️ {productosIndividuales.filter(p => p.isQuantityModified).length} producto(s) con cantidades modificadas
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProductTable
              productos={productosIndividuales}
              currencySymbol={getCurrencyInfo()?.symbol || "€"}
              selectedCurrency={selectedCurrency}
              onQuantityChange={onQuantityChange || (() => {})}
              onPriceChange={onPriceChange || (() => {})}
              onUnitChange={onUnitChange}
              onDeleteProduct={onDeleteProduct}
              isEditable={!isDisabled}
              // Optional: price review tracking from RFX context
              isProductPriceUnreviewed={isProductPriceUnreviewed}
              markProductPriceAsReviewed={markProductPriceAsReviewed}
            />
            
            {/* Save costs button */}
            {onSaveProductCosts && (
              <div className="pt-4 border-t border-gray-200">
                <Button 
                  onClick={onSaveProductCosts} 
                  className="gap-2 bg-gray-800 hover:bg-gray-900 text-white shadow-sm"
                  disabled={isDisabled || productosIndividuales.length === 0 || isSavingCosts}
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
                {costsSaved && (
                  <p className="text-sm text-green-600 mt-2">✅ Costos guardados exitosamente</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Product Form Dialog */}
      {onAddProduct && (
        <ProductFormDialog
          isOpen={isAddingProduct}
          onClose={() => setIsAddingProduct(false)}
          onSubmit={handleAddProductWrapper}
          currencySymbol={getCurrencyInfo()?.symbol || "€"}
          mode="create"
        />
      )}
    </div>
  )
}
