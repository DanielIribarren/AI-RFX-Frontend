"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle, Info, RefreshCw, Settings, DollarSign, Users, Receipt } from "lucide-react"
import type { 
  PricingConfigFormData, 
  CoordinationType, 
  HeadcountSource, 
  CalculationBase,
  LegacyPricingConfig 
} from "@/types/pricing-v2"
import type { 
  FrontendPricingFormData 
} from "@/types/pricing-backend-real"
import { StatusBadge } from "@/components/ui/status-badge"
import { SectionHeader } from "@/components/ui/section-header"
import { 
  getFrontendPricingConfig,
  updateFrontendPricingConfig,
  validateFrontendPricingConfig,
  handleBackendPricingError 
} from "@/lib/api-pricing-backend-real"
import { isValidUUID } from "@/lib/utils"
import { pricingConverter, pricingDefaults, pricingValidation } from "@/lib/api-pricing-v2"

interface PricingConfigurationCardProps {
  // V2.2 Configuration
  config: PricingConfigFormData
  onConfigChange: (config: PricingConfigFormData) => void
  onSave?: () => void
  
  // Legacy compatibility
  legacyConfig?: LegacyPricingConfig
  onLegacyConfigChange?: (config: LegacyPricingConfig) => void
  
  // State management
  isLoading?: boolean
  isDisabled?: boolean
  
  // Additional options
  showAdvancedOptions?: boolean
  showTaxConfiguration?: boolean
  
  // Real Backend Integration
  rfxId?: string // Required for real backend API calls
  useRealBackend?: boolean // Toggle between mock and real backend
}

export default function PricingConfigurationCard({
  config,
  onConfigChange,
  onSave,
  legacyConfig,
  onLegacyConfigChange,
  isLoading = false,
  isDisabled = false,
  showAdvancedOptions = false,
  showTaxConfiguration = false,
  rfxId,
  useRealBackend = false
}: PricingConfigurationCardProps) {
  
  // Local state for immediate UI updates
  const [localConfig, setLocalConfig] = useState<PricingConfigFormData>(config)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(showAdvancedOptions)
  
  // Real backend state
  const [isLoadingFromBackend, setIsLoadingFromBackend] = useState(false)
  const [isSavingToBackend, setIsSavingToBackend] = useState(false)
  const [backendError, setBackendError] = useState<string | null>(null)
  const [lastSavedConfig, setLastSavedConfig] = useState<FrontendPricingFormData | null>(null)

  // Load configuration from real backend on mount (PRIORITY: Do this FIRST)
  useEffect(() => {
    if (useRealBackend && rfxId) {
      console.log('🚀 PricingConfigurationCard: Loading config from backend on mount for rfxId:', rfxId)
      loadConfigFromBackend()
    }
  }, [useRealBackend, rfxId])

  // Sync with parent config changes (ONLY if not using real backend or backend hasn't loaded yet)
  useEffect(() => {
    // ✅ FIX: Don't override backend config with parent config UNLESS backend has no configuration
    if (!useRealBackend || !lastSavedConfig) {
      console.log('🔄 PricingConfigurationCard: Syncing with parent config (no backend or backend not loaded)')
      setLocalConfig(config)
    } else {
      // ✅ NEW FIX: Check if backend actually has configuration, if not, use parent config
      const backendHasConfig = lastSavedConfig.coordination_enabled || 
                               lastSavedConfig.cost_per_person_enabled || 
                               lastSavedConfig.taxes_enabled
      
      if (!backendHasConfig) {
        console.log('🔄 PricingConfigurationCard: Backend has no real config, syncing with parent config')
        setLocalConfig(config)
      } else {
        console.log('⏭️ PricingConfigurationCard: Skipping parent config sync (backend config loaded)')
      }
    }
  }, [config, useRealBackend, lastSavedConfig])

  // Auto-validate on config changes
  useEffect(() => {
    const validation = pricingValidation.validateComplete(localConfig)
    setValidationErrors(validation.errors)
  }, [localConfig])

  // Real backend functions
  const loadConfigFromBackend = async () => {
    if (!rfxId) return

    setIsLoadingFromBackend(true)
    setBackendError(null)

    try {
      console.log('📡 Calling getFrontendPricingConfig for rfxId:', rfxId)
      const backendConfig = await getFrontendPricingConfig(rfxId)
      console.log('📥 Raw backend config received:', backendConfig)
      
      setLastSavedConfig(backendConfig)
      
      // ✅ NEW: Check if backend actually has meaningful configuration
      const backendHasConfig = backendConfig.coordination_enabled || 
                               backendConfig.cost_per_person_enabled || 
                               backendConfig.taxes_enabled
      
      console.log('🔍 Backend configuration analysis:', {
        has_coordination: backendConfig.coordination_enabled,
        has_cost_per_person: backendConfig.cost_per_person_enabled,
        has_taxes: backendConfig.taxes_enabled,
        has_meaningful_config: backendHasConfig
      })
      
      if (!backendHasConfig) {
        console.log('⚠️ Backend returned defaults only - no real configuration found for RFX')
        console.log('🔄 Will allow parent config to override defaults after this call completes')
        // Don't call onConfigChange here - let the parent config sync happen
        return // Exit early, let parent config take precedence
      }
      
      // Convert to component format with detailed logging
      const componentConfig: PricingConfigFormData = {
        coordination_enabled: backendConfig.coordination_enabled,
        coordination_type: backendConfig.coordination_type,
        coordination_rate: backendConfig.coordination_rate,
        coordination_description: backendConfig.coordination_description || 'Coordinación y logística',
        coordination_apply_to_subtotal: true, // Default
        
        cost_per_person_enabled: backendConfig.cost_per_person_enabled,
        headcount: backendConfig.headcount,
        headcount_source: 'manual', // Default
        calculation_base: backendConfig.calculation_base,
        display_in_proposal: true, // Default
        cost_per_person_description: 'Cálculo de costo individual',
        
        taxes_enabled: backendConfig.taxes_enabled,
        tax_name: backendConfig.tax_name,
        tax_rate: backendConfig.tax_rate,
        tax_apply_to_subtotal: false, // Default
        tax_apply_to_coordination: true // Default
      }
      
      console.log('🔄 Converted component config:', componentConfig)
      console.log('🎯 Setting local config with REAL backend data...')
      
      // ✅ FIX: Update both local state AND parent component
      setLocalConfig(componentConfig)
      onConfigChange(componentConfig) // ✅ CRITICAL: Notify parent of backend config
      
      console.log('✅ Real configuration loaded from backend and applied to UI!')
      console.log('📊 Backend config summary:', {
        coordination: backendConfig.coordination_enabled ? `${backendConfig.coordination_type} (${backendConfig.coordination_rate * 100}%)` : 'disabled',
        cost_per_person: backendConfig.cost_per_person_enabled ? `${backendConfig.headcount} people` : 'disabled',
        taxes: backendConfig.taxes_enabled ? `${backendConfig.tax_name} (${backendConfig.tax_rate * 100}%)` : 'disabled'
      })
    } catch (error) {
      const errorMessage = handleBackendPricingError(error)
      setBackendError(errorMessage)
      console.error('❌ Error loading config from backend:', error)
    } finally {
      setIsLoadingFromBackend(false)
    }
  }

  const saveConfigToBackend = async (): Promise<boolean> => {
    // 🔍 CRITICAL DEBUG: Log what we receive first
    console.log('🔍 saveConfigToBackend called with rfxId:', {
      rfxId: rfxId,
      rfxId_type: typeof rfxId,
      rfxId_length: rfxId?.length,
      rfxId_stringified: JSON.stringify(rfxId),
      isValidUUID_result: isValidUUID(rfxId || '')
    })
    
    if (!rfxId) {
      console.error('❌ No rfxId provided')
      return false
    }
    
    // ✅ VALIDATE: Ensure rfxId is a valid UUID before sending to backend
    if (!isValidUUID(rfxId)) {
      console.error('❌ Invalid UUID format for RFX ID in pricing card:', {
        provided: rfxId,
        type: typeof rfxId,
        length: rfxId?.length,
        isValidUUID: isValidUUID(rfxId || ''),
        stringified: JSON.stringify(rfxId)
      })
      setBackendError('ID del RFX debe ser un UUID válido')
      return false
    }

    console.log('✅ Sending pricing config to backend with valid UUID:', rfxId)
    setIsSavingToBackend(true)
    setBackendError(null)

    try {
      // Convert to backend format
      const backendConfig: FrontendPricingFormData = {
        coordination_enabled: localConfig.coordination_enabled,
        coordination_type: localConfig.coordination_type,
        coordination_rate: localConfig.coordination_rate,
        coordination_description: localConfig.coordination_description,
        
        cost_per_person_enabled: localConfig.cost_per_person_enabled,
        headcount: localConfig.headcount,
        calculation_base: localConfig.calculation_base,
        
        taxes_enabled: localConfig.taxes_enabled,
        tax_name: localConfig.tax_name,
        tax_rate: localConfig.tax_rate
      }

      const success = await updateFrontendPricingConfig(rfxId, backendConfig)
      
      if (success) {
        setLastSavedConfig(backendConfig)
        console.log('✅ Configuration saved to real backend:', backendConfig)
        return true
      } else {
        setBackendError('Error guardando configuración en el servidor')
        return false
      }
    } catch (error) {
      const errorMessage = handleBackendPricingError(error)
      setBackendError(errorMessage)
      console.error('❌ Error saving config to backend:', error)
      return false
    } finally {
      setIsSavingToBackend(false)
    }
  }

  const handleConfigUpdate = (updates: Partial<PricingConfigFormData>) => {
    const newConfig = { ...localConfig, ...updates }
    setLocalConfig(newConfig)
    onConfigChange(newConfig)
    
    // Update legacy config if handler provided
    if (onLegacyConfigChange) {
      const legacyUpdate = pricingConverter.fromV2(newConfig)
      onLegacyConfigChange(legacyUpdate)
    }
  }

  // Coordination handlers
  const handleCoordinationToggle = (checked: boolean) => {
    handleConfigUpdate({ coordination_enabled: checked })
  }

  const handleCoordinationTypeChange = (type: CoordinationType) => {
    handleConfigUpdate({ coordination_type: type })
  }

  const handleCoordinationRateChange = (value: string) => {
    const rate = Math.min(1, Math.max(0, parseFloat(value) / 100 || 0)) // Convert percentage to decimal
    handleConfigUpdate({ coordination_rate: rate })
  }

  const handleCoordinationDescriptionChange = (description: string) => {
    handleConfigUpdate({ coordination_description: description })
  }

  // Cost per person handlers
  const handleCostPerPersonToggle = (checked: boolean) => {
    handleConfigUpdate({ cost_per_person_enabled: checked })
  }

  const handleHeadcountChange = (value: string) => {
    const headcount = Math.max(0, parseInt(value) || 0)
    handleConfigUpdate({ headcount })
  }

  const handleHeadcountSourceChange = (source: HeadcountSource) => {
    handleConfigUpdate({ headcount_source: source })
  }

  const handleCalculationBaseChange = (base: CalculationBase) => {
    handleConfigUpdate({ calculation_base: base })
  }

  // Tax handlers
  const handleTaxToggle = (checked: boolean) => {
    handleConfigUpdate({ taxes_enabled: checked })
  }

  const handleTaxRateChange = (value: string) => {
    const rate = Math.min(1, Math.max(0, parseFloat(value) / 100 || 0)) // Convert percentage to decimal
    handleConfigUpdate({ tax_rate: rate })
  }

  const handleTaxNameChange = (name: string) => {
    handleConfigUpdate({ tax_name: name })
  }

  return (
    <Card className={isDisabled ? "opacity-50" : ""}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuración de Pricing V2.2
        </CardTitle>
        <CardDescription>
          Sistema avanzado de configuración de precios y cálculos
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Backend Status */}
        {useRealBackend && (
          <div className="mb-4">
            {isLoadingFromBackend && (
              <Alert>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Cargando configuración desde el servidor...
                </AlertDescription>
              </Alert>
            )}
            
            {backendError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Error del servidor:</p>
                    <p className="text-sm">{backendError}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {lastSavedConfig && !backendError && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusBadge variant="success">Conectado al backend V2.2</StatusBadge>
                    </div>
                    <button 
                      onClick={loadConfigFromBackend}
                      className="text-xs underline hover:no-underline"
                      disabled={isLoadingFromBackend}
                    >
                      Recargar
                    </button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Errores de validación:</p>
                <ul className="list-disc list-inside text-sm">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Coordination Configuration */}
        <div className="space-y-4">
          <SectionHeader 
            icon={DollarSign}
            title="Configuración de Coordinación"
            description="Agregar costos de coordinación y logística al presupuesto"
            level={3}
          />
          <div className="flex items-center justify-between">
            <Switch
              checked={localConfig.coordination_enabled}
              onCheckedChange={handleCoordinationToggle}
              disabled={isDisabled}
            />
          </div>
          
          {localConfig.coordination_enabled && (
            <div className="ml-4 pl-4 border-l-2 border-primary/20 space-y-4">
              {/* Coordination Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de Coordinación</Label>
                <Select 
                  value={localConfig.coordination_type} 
                  onValueChange={handleCoordinationTypeChange}
                  disabled={isDisabled}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Básica - Coordinación mínima</SelectItem>
                    <SelectItem value="standard">Estándar - Coordinación completa</SelectItem>
                    <SelectItem value="premium">Premium - Coordinación avanzada</SelectItem>
                    <SelectItem value="custom">Personalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Coordination Rate */}
              <div className="space-y-2">
                <Label htmlFor="coordination-rate" className="text-sm font-medium">
                  Porcentaje de Coordinación
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="coordination-rate"
                    type="number"
                    value={(localConfig.coordination_rate * 100).toFixed(2)} // Convert decimal to percentage for display
                    onChange={(e) => handleCoordinationRateChange(e.target.value)}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-24"
                    disabled={isDisabled}
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
                <p className="text-xs text-gray-500">
                  Se aplicará sobre el subtotal de productos
                </p>
              </div>

              {/* Coordination Description */}
              <div className="space-y-2">
                <Label htmlFor="coordination-desc" className="text-sm font-medium">
                  Descripción de Coordinación
                </Label>
                <Input
                  id="coordination-desc"
                  value={localConfig.coordination_description}
                  onChange={(e) => handleCoordinationDescriptionChange(e.target.value)}
                  placeholder="Ej: Coordinación y logística del evento"
                  disabled={isDisabled}
                />
              </div>

              {/* Advanced Options */}
              {showAdvanced && (
                <div className="space-y-3 p-3 bg-primary/5 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-800">Opciones Avanzadas</h5>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={localConfig.coordination_apply_to_subtotal}
                      onCheckedChange={(checked) => handleConfigUpdate({ coordination_apply_to_subtotal: checked })}
                      disabled={isDisabled}
                    />
                    <Label className="text-sm">Aplicar al subtotal</Label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Cost Per Person Configuration */}
        <div className="space-y-4">
          <SectionHeader 
            icon={Users}
            title="Configuración de Costo por Persona"
            description="Mostrar y calcular costo promedio por persona"
            level={3}
          />
          <div className="flex items-center justify-between">
            <Switch
              checked={localConfig.cost_per_person_enabled}
              onCheckedChange={handleCostPerPersonToggle}
              disabled={isDisabled}
            />
          </div>
          
          {localConfig.cost_per_person_enabled && (
            <div className="ml-4 pl-4 border-l-2 border-green-200 space-y-4">
              {/* Headcount */}
              <div className="space-y-2">
                <Label htmlFor="headcount" className="text-sm font-medium">
                  Número de Personas
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="headcount"
                    type="number"
                    value={localConfig.headcount}
                    onChange={(e) => handleHeadcountChange(e.target.value)}
                    min="1"
                    max="10000"
                    placeholder="120"
                    className="w-28"
                    disabled={isDisabled}
                  />
                  <span className="text-sm text-gray-600">personas</span>
                </div>
              </div>

              {/* Headcount Source */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fuente del Headcount</Label>
                <Select 
                  value={localConfig.headcount_source} 
                  onValueChange={handleHeadcountSourceChange}
                  disabled={isDisabled}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar fuente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual - Ingresado manualmente</SelectItem>
                    <SelectItem value="extracted">Extraído - Detectado por IA</SelectItem>
                    <SelectItem value="estimated">Estimado - Calculado automáticamente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Calculation Base */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Base de Cálculo</Label>
                <Select 
                  value={localConfig.calculation_base} 
                  onValueChange={handleCalculationBaseChange}
                  disabled={isDisabled}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar base" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subtotal">Subtotal - Solo productos</SelectItem>
                    <SelectItem value="subtotal_with_coordination">Subtotal + Coordinación</SelectItem>
                    <SelectItem value="final_total">Total Final - Incluye todo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Base sobre la cual se calculará el costo por persona
                </p>
              </div>

              {/* Display Options */}
              <div className="space-y-3 p-3 bg-green-50 rounded-lg">
                <h5 className="text-sm font-medium text-green-800">Opciones de Visualización</h5>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={localConfig.display_in_proposal}
                    onCheckedChange={(checked) => handleConfigUpdate({ display_in_proposal: checked })}
                    disabled={isDisabled}
                  />
                  <Label className="text-sm">Mostrar en propuesta</Label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tax Configuration */}
        {showTaxConfiguration && (
          <>
            <Separator />
            <div className="space-y-4">
              <SectionHeader 
                icon={Receipt}
                title="Configuración de Impuestos"
                description="Agregar impuestos y tasas adicionales"
                level={3}
              />
              <div className="flex items-center justify-between">
                <Switch
                  checked={localConfig.taxes_enabled}
                  onCheckedChange={handleTaxToggle}
                  disabled={isDisabled}
                />
              </div>
              
              {localConfig.taxes_enabled && (
                <div className="ml-4 pl-4 border-l-2 border-orange-200 space-y-4">
                  {/* Tax Name */}
                  <div className="space-y-2">
                    <Label htmlFor="tax-name" className="text-sm font-medium">
                      Nombre del Impuesto
                    </Label>
                    <Input
                      id="tax-name"
                      value={localConfig.tax_name}
                      onChange={(e) => handleTaxNameChange(e.target.value)}
                      placeholder="IVA"
                      disabled={isDisabled}
                    />
                  </div>

                  {/* Tax Rate */}
                  <div className="space-y-2">
                    <Label htmlFor="tax-rate" className="text-sm font-medium">
                      Tasa de Impuesto
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="tax-rate"
                        type="number"
                        value={(localConfig.tax_rate * 100).toFixed(2)} // Convert decimal to percentage for display
                        onChange={(e) => handleTaxRateChange(e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-24"
                        disabled={isDisabled}
                      />
                      <span className="text-sm text-gray-600">%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Advanced Options Toggle */}
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            disabled={isDisabled}
            className="text-gray-600 hover:text-gray-800"
          >
            {showAdvanced ? (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Ocultar Opciones Avanzadas
              </>
            ) : (
              <>
                <Info className="h-4 w-4 mr-2" />
                Mostrar Opciones Avanzadas
              </>
            )}
          </Button>
        </div>

        {/* Configuration Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-800 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Resumen de Configuración V2.2
          </h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Coordinación:</span>
              <span>
                {localConfig.coordination_enabled 
                  ? <StatusBadge variant="success">{localConfig.coordination_type} ({(localConfig.coordination_rate * 100).toFixed(2)}%)</StatusBadge>
                  : <StatusBadge variant="error">Deshabilitada</StatusBadge>
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span>Costo por persona:</span>
              <span>
                {localConfig.cost_per_person_enabled 
                  ? <StatusBadge variant="success">{localConfig.headcount} personas ({localConfig.calculation_base})</StatusBadge>
                  : <StatusBadge variant="error">No mostrar</StatusBadge>
                }
              </span>
            </div>
            {showTaxConfiguration && (
              <div className="flex justify-between">
                <span>Impuestos:</span>
                <span>
                  {localConfig.taxes_enabled 
                    ? <StatusBadge variant="success">{localConfig.tax_name} ({(localConfig.tax_rate * 100).toFixed(2)}%)</StatusBadge>
                    : <StatusBadge variant="neutral">Sin impuestos</StatusBadge>
                  }
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        {(onSave || useRealBackend) && (
          <div className="pt-4">
            <Button 
              onClick={async () => {
                if (useRealBackend) {
                  const success = await saveConfigToBackend()
                  if (success && onSave) {
                    onSave() // Call parent callback if provided
                  }
                } else if (onSave) {
                  onSave()
                }
              }}
              disabled={
                isLoading || 
                isDisabled || 
                validationErrors.length > 0 || 
                isLoadingFromBackend || 
                isSavingToBackend ||
                (useRealBackend && (!rfxId || !isValidUUID(rfxId)))
              }
              className="w-full gap-2"
            >
              {(isLoading || isLoadingFromBackend || isSavingToBackend) ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {isSavingToBackend 
                    ? 'Guardando en Backend V2.2...'
                    : isLoadingFromBackend 
                      ? 'Cargando desde Backend...'
                      : 'Guardando Configuración V2.2...'
                  }
                </>
              ) : validationErrors.length > 0 ? (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Corregir Errores para Guardar
                </>
              ) : (useRealBackend && (!rfxId || !isValidUUID(rfxId))) ? (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  {!rfxId ? 'ID del RFX Requerido' : 'UUID del RFX Inválido'}
                </>
              ) : (
                <>
                  {useRealBackend ? 'Guardar en Backend V2.2' : 'Guardar Configuración V2.2'}
                </>
              )}
            </Button>
            
            {/* Additional controls for real backend */}
            {useRealBackend && rfxId && (
              <div className="mt-2 text-center">
                <button
                  onClick={loadConfigFromBackend}
                  disabled={isLoadingFromBackend || isSavingToBackend}
                  className="text-xs text-gray-500 hover:text-gray-700 underline hover:no-underline flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Recargar desde Servidor
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ========================
// EXPORT LEGACY COMPATIBILITY
// ========================

// Legacy export for backward compatibility
export type { PricingConfigFormData as PricingConfig }
