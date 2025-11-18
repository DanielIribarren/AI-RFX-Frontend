"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Briefcase, BarChart3, FileText, Archive } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DataExtractionContent from "@/components/data-extraction-content"
import ProcessedFilesContent from "@/components/processed-files-content"
import { StatusBadge } from "@/components/ui/status-badge"
import { EditableTitle } from "@/components/ui/editable-title"

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
  // Nuevos campos de ganancias
  costo_unitario?: number
  ganancia_unitaria?: number
  margen_ganancia?: number
  total_profit?: number // Campo adicional del backend
}

interface RFXDataViewProps {
  extractedData: ExtractedData
  onFieldSave: (field: keyof ExtractedData, value: string | number) => Promise<void>
  onGenerateBudget: () => void
  rfxId?: string
  rfxTitle?: string
  onTitleSave?: (newTitle: string) => Promise<void>
  fechaCreacion?: string
  validationMetadata?: any
  originalText?: string
  isFinalized?: boolean
  
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
}

export default function RFXDataView({
  extractedData,
  onFieldSave,
  onGenerateBudget,
  rfxId,
  rfxTitle = "Datos Extraídos",
  onTitleSave,
  fechaCreacion,
  validationMetadata,
  originalText = "",
  isFinalized = false,
  // Product management props
  productosIndividuales = [],
  onAddProduct,
  onDeleteProduct,
  onQuantityChange,
  onPriceChange,
  onCostChange,
  onUnitChange,
  onSaveProductCosts,
  isSavingCosts = false,
  costsSaved = false,
  // Low-impact currency props (not in interface to avoid breaking changes)
  ...additionalProps
}: RFXDataViewProps & any) {

  // Format creation date
  const formatFechaCreacion = (fecha?: string) => {
    if (!fecha) return new Date().toLocaleDateString("es-ES")
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

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Data Quality Alert */}
      {validationMetadata && (
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Calidad de extracción: {validationMetadata.has_original_data ? 
                "Datos extraídos del documento" : 
                "Algunos datos usan valores predeterminados"}</span>
            </div>
            {originalText && (
              <div className="mt-2 text-xs">
                <strong>Texto relevante encontrado:</strong> "{originalText.slice(0, 150)}{originalText.length > 150 ? '...' : ''}"
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {onTitleSave && !isFinalized ? (
            <EditableTitle
              title={rfxTitle}
              onSave={onTitleSave}
              disabled={isFinalized}
            />
          ) : (
            <h1 className="text-3xl font-bold text-gray-900">
              {isFinalized ? "RFX Finalizado" : rfxTitle}
            </h1>
          )}
          <p className="text-lg text-gray-600 mt-1">
            {extractedData.solicitante} • {formatFechaCreacion(fechaCreacion)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={onGenerateBudget} 
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Briefcase className="h-4 w-4" />
            Generar Presupuesto
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="datos-extraidos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 !flex-none">
          <TabsTrigger value="datos-extraidos" className="gap-2 flex-1">
            <FileText className="h-4 w-4" />
            Datos Extraídos
          </TabsTrigger>
          <TabsTrigger value="archivos-procesados" className="gap-2 flex-1">
            <Archive className="h-4 w-4" />
            Archivos Procesados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="datos-extraidos" className="space-y-6 mt-6">
          <DataExtractionContent
            extractedData={extractedData}
            onFieldSave={onFieldSave}
            originalText={originalText}
            isDisabled={isFinalized}
            // Product management props
            productosIndividuales={productosIndividuales}
            onAddProduct={onAddProduct}
            onDeleteProduct={onDeleteProduct}
            onQuantityChange={onQuantityChange}
            onPriceChange={onPriceChange}
            onCostChange={onCostChange}
            onUnitChange={onUnitChange}
            onSaveProductCosts={onSaveProductCosts}
            isSavingCosts={isSavingCosts}
            costsSaved={costsSaved}
            // @ts-ignore low-impact injection to seed currency
            defaultCurrency={additionalProps?.defaultCurrency || (validationMetadata as any)?.currency}
            // @ts-ignore pass currency change handler from parent
            onCurrencyChange={additionalProps?.onCurrencyChange}
          />
        </TabsContent>
        
        <TabsContent value="archivos-procesados" className="space-y-6 mt-6">
          <ProcessedFilesContent
            rfxId={rfxId}
            receivedAt={fechaCreacion}
            isDisabled={isFinalized}
          />
        </TabsContent>
      </Tabs>

      {/* Success message for finalized RFX */}
      {isFinalized && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <StatusBadge variant="success">RFX finalizado</StatusBadge>
            <span className="ml-2">Este RFX ha sido finalizado exitosamente y guardado en tu historial.</span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
