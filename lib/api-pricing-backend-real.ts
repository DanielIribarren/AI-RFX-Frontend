/**
 * Real Backend API Client V2.2
 * Integrates exactly with FRONTEND-INTEGRATION-GUIDE-V2.2.md endpoints
 */

// Import the error class (not as type - needs to be instantiated)
import { BackendPricingApiError } from '@/types/pricing-backend-real'
import { isValidUUID } from '@/lib/utils'

// Import types
import type {
  BackendPricingConfigResponse,
  BackendUpdatePricingConfigRequest,
  BackendUpdatePricingConfigResponse,
  BackendCalculatePricingRequest,
  BackendCalculatePricingResponse,
  BackendPricingSummaryResponse,
  BackendQuickConfigRequest,
  BackendQuickConfigResponse,
  BackendPresetsResponse,
  BackendValidateConfigRequest,
  BackendValidateConfigResponse,
  BackendCalculateFromRfxResponse,
  BackendApiResponse,
  FrontendPricingFormData,
  FrontendCalculationResult
} from '@/types/pricing-backend-real'

// ========================
// API BASE CONFIGURATION
// ========================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
const PRICING_API_BASE = `${API_BASE_URL}/api/pricing`

// ========================
// CONVERTERS
// ========================

/**
 * Convert frontend form data to backend request format
 */
export function frontendToBackendConfig(frontend: FrontendPricingFormData): BackendUpdatePricingConfigRequest {
  return {
    // Backend expects flat structure, not nested objects
    coordination_enabled: frontend.coordination_enabled,
    coordination_rate: frontend.coordination_rate,
    coordination_level: frontend.coordination_type as any, // Map coordination_type to coordination_level
    
    cost_per_person_enabled: frontend.cost_per_person_enabled,
    headcount: frontend.headcount,
    per_person_display: true, // Default value
    
    taxes_enabled: frontend.taxes_enabled,
    tax_rate: frontend.tax_rate,
    tax_type: frontend.tax_name // Map tax_name to tax_type
  }
}

/**
 * Convert backend config response to frontend form data
 */
export function backendToFrontendConfig(backend: BackendPricingConfigResponse): FrontendPricingFormData {
  return {
    // Coordination
    coordination_enabled: backend.data.coordination_enabled || false,
    coordination_type: (backend.data.coordination_level as any) || 'standard', // Map coordination_level to coordination_type
    coordination_rate: backend.data.coordination_rate || 0.18,
    coordination_description: 'Coordinación y logística',
    
    // Cost per person
    cost_per_person_enabled: backend.data.cost_per_person_enabled || false,
    headcount: backend.data.headcount || 120,
    calculation_base: 'final_total', // Default, not in response
    
    // Tax
    taxes_enabled: backend.data.taxes_enabled || false,
    tax_name: backend.data.tax_type || 'IVA', // Map tax_type to tax_name
    tax_rate: backend.data.tax_rate || 0.16
  }
}

/**
 * Convert backend calculation response to frontend format
 */
export function backendToFrontendCalculation(backend: BackendCalculatePricingResponse): FrontendCalculationResult {
  return {
    subtotal: backend.data.subtotal || 0,
    coordination_enabled: backend.data.coordination_enabled || false,
    coordination_rate: backend.data.coordination_enabled && backend.data.subtotal > 0 
      ? backend.data.coordination_amount / backend.data.subtotal 
      : 0,
    coordination_amount: backend.data.coordination_amount || 0,
    cost_per_person_enabled: backend.data.cost_per_person_enabled || false,
    headcount: backend.data.headcount || 0,
    cost_per_person: backend.data.cost_per_person || 0,
    taxes_enabled: backend.data.taxes_enabled || false,
    tax_rate: backend.data.taxes_enabled && backend.data.total_before_tax > 0 
      ? backend.data.tax_amount / backend.data.total_before_tax 
      : 0,
    tax_amount: backend.data.tax_amount || 0,
    total_before_tax: backend.data.total_before_tax || 0,
    final_total: backend.data.final_total || 0
  }
}

// ========================
// API CLIENT
// ========================

class RealBackendPricingClient {
  private baseURL: string

  constructor(baseURL: string = PRICING_API_BASE) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<BackendApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options.headers,
        },
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new BackendPricingApiError(
          data.message || `API Error: ${response.status}`,
          data.code || `HTTP_${response.status}`,
          data.details
        )
      }

      return data
    } catch (error) {
      if (error instanceof BackendPricingApiError) {
        throw error
      }

      throw new BackendPricingApiError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NETWORK_ERROR'
      )
    }
  }

  // ========================
  // PRICING CONFIGURATION
  // ========================

  /**
   * Get pricing configuration
   * GET /api/pricing/config/{rfx_id}
   */
  async getConfig(rfxId: string): Promise<BackendPricingConfigResponse> {
    const response = await this.request<BackendPricingConfigResponse['data']>(`/config/${rfxId}`)
    return response as BackendPricingConfigResponse
  }

  /**
   * Update pricing configuration
   * PUT /api/pricing/config/{rfx_id}
   */
  async updateConfig(
    rfxId: string,
    config: BackendUpdatePricingConfigRequest
  ): Promise<BackendUpdatePricingConfigResponse> {
    const response = await this.request<BackendUpdatePricingConfigResponse['data']>(`/config/${rfxId}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    })
    return response as BackendUpdatePricingConfigResponse
  }

  /**
   * Calculate pricing
   * POST /api/pricing/calculate/{rfx_id}
   */
  async calculatePricing(
    rfxId: string,
    subtotal: number
  ): Promise<BackendCalculatePricingResponse> {
    const response = await this.request<BackendCalculatePricingResponse['data']>(`/calculate/${rfxId}`, {
      method: 'POST',
      body: JSON.stringify({ subtotal }),
    })
    return response as BackendCalculatePricingResponse
  }

  /**
   * Get pricing summary
   * GET /api/pricing/summary/{rfx_id}
   */
  async getSummary(rfxId: string): Promise<BackendPricingSummaryResponse> {
    const response = await this.request<BackendPricingSummaryResponse['data']>(`/summary/${rfxId}`)
    return response as BackendPricingSummaryResponse
  }

  /**
   * Calculate from existing RFX
   * GET /api/pricing/calculate-from-rfx/{rfx_id}
   */
  async calculateFromRfx(rfxId: string): Promise<BackendCalculateFromRfxResponse> {
    const response = await this.request<BackendCalculateFromRfxResponse['data']>(`/calculate-from-rfx/${rfxId}`)
    return response as BackendCalculateFromRfxResponse
  }

  /**
   * Quick configuration
   * POST /api/pricing/quick-config/{rfx_id}
   */
  async quickConfig(
    rfxId: string,
    presetType: string,
    headcount?: number
  ): Promise<BackendQuickConfigResponse> {
    const response = await this.request<BackendQuickConfigResponse['data']>(`/quick-config/${rfxId}`, {
      method: 'POST',
      body: JSON.stringify({ preset_type: presetType, headcount }),
    })
    return response as BackendQuickConfigResponse
  }

  /**
   * Get available presets
   * GET /api/pricing/presets
   */
  async getPresets(): Promise<BackendPresetsResponse> {
    const response = await this.request<BackendPresetsResponse['data']>('/presets')
    return response as BackendPresetsResponse
  }

  /**
   * Validate configuration
   * POST /api/pricing/validate-config
   */
  async validateConfig(config: BackendValidateConfigRequest): Promise<BackendValidateConfigResponse> {
    const response = await this.request<BackendValidateConfigResponse>('/validate-config', {
      method: 'POST',
      body: JSON.stringify(config),
    })
    return response as BackendValidateConfigResponse
  }
}

// ========================
// SINGLETON CLIENT
// ========================

export const realBackendPricingApi = new RealBackendPricingClient()

// ========================
// HIGH-LEVEL CONVENIENCE FUNCTIONS
// ========================

/**
 * Get configuration in frontend format
 */
export async function getFrontendPricingConfig(rfxId: string): Promise<FrontendPricingFormData> {
  // ✅ VALIDATE: Ensure UUID format before making API call
  if (!rfxId || !isValidUUID(rfxId)) {
    console.error('❌ INVALID UUID FORMAT - Cannot load pricing config:', {
      provided: rfxId,
      type: typeof rfxId,
      length: rfxId?.length,
      isValidUUID: isValidUUID(rfxId || '')
    })
    throw new BackendPricingApiError(
      `Invalid rfx_id format (expects UUID): ${rfxId}`,
      'INVALID_UUID_FORMAT'
    )
  }

  try {
    console.log(`🔄 Attempting to load pricing config for VALID UUID: ${rfxId}`)
    console.log(`🌐 Backend URL: ${PRICING_API_BASE}`)
    
    const backendConfig = await realBackendPricingApi.getConfig(rfxId)
    console.log(`✅ Successfully loaded pricing config from backend`, backendConfig)
    
    return backendToFrontendConfig(backendConfig)
  } catch (error) {
    console.warn('⚠️ Backend pricing API not available, using local defaults:', error)
    
    // Enhanced error logging for debugging
    if (error instanceof BackendPricingApiError) {
      console.warn(`📡 API Error: ${error.message} (Code: ${error.code})`)
    } else {
      console.warn(`🔧 Network/Other Error:`, error)
    }
    
    // Return sensible defaults when backend is not available
    const defaultConfig = {
      coordination_enabled: false,
      coordination_type: 'standard' as const,
      coordination_rate: 0.18,
      coordination_description: 'Coordinación y logística',
      cost_per_person_enabled: false,
      headcount: 120,
      calculation_base: 'final_total' as const,
      taxes_enabled: false,
      tax_name: 'IVA',
      tax_rate: 0.16
    }
    
    console.log(`🎯 Using default config for RFX ${rfxId}:`, defaultConfig)
    return defaultConfig
  }
}

/**
 * Update configuration from frontend format
 */
export async function updateFrontendPricingConfig(
  rfxId: string,
  frontendConfig: FrontendPricingFormData
): Promise<boolean> {
  // 🚨 FORCING THIS LOG TO APPEAR
  console.error('🚨 UPDATEFRONTENDPRICINGCONFIG FUNCTION CALLED WITH RFXID:', rfxId);
  console.error('🚨 TYPE:', typeof rfxId);
  console.error('🚨 IS VALID UUID?', isValidUUID(rfxId));
  
  // 🔍 CRITICAL DEBUG: Log everything first
  console.log('🔍 updateFrontendPricingConfig called with:', {
    rfxId: rfxId,
    rfxId_type: typeof rfxId,
    rfxId_length: rfxId?.length,
    isValidUUID_result: isValidUUID(rfxId),
    frontendConfig: frontendConfig
  })
  
  // 🚨 FORCE VALIDATION IMMEDIATELY
  if (!rfxId || !isValidUUID(rfxId)) {
    console.error('🚨🚨🚨 INVALID UUID DETECTED - BLOCKING API CALL 🚨🚨🚨');
    console.error('🚨 PROVIDED VALUE:', rfxId);
    console.error('🚨 TYPE:', typeof rfxId);
    console.error('🚨 LENGTH:', rfxId?.length);
    console.error('🚨 IS VALID UUID?', isValidUUID(rfxId || ''));
    
    // 🚨 FORCE THROW - Don't continue with invalid UUID
    const error = new BackendPricingApiError(
      `🚨 BLOCKED: Invalid rfx_id format (expects UUID): ${rfxId}`,
      'INVALID_UUID_FORMAT'
    )
    console.error('🚨 THROWING UUID VALIDATION ERROR:', error);
    throw error;
  }
  
  console.log('✅ UUID validation passed, proceeding with API call for:', rfxId)

  try {
    console.log(`🔄 Attempting to update pricing config for VALID UUID: ${rfxId}`, frontendConfig)
    
    const backendConfig = frontendToBackendConfig(frontendConfig)
    console.log(`📡 Sending to backend:`, backendConfig)
    
    const response = await realBackendPricingApi.updateConfig(rfxId, backendConfig)
    console.log(`✅ Backend response:`, response)
    
    return response.status === 'success'
  } catch (error) {
    console.warn('⚠️ Error updating pricing config (backend not available):', error)
    
    // Enhanced error logging
    if (error instanceof BackendPricingApiError) {
      console.warn(`📡 API Error: ${error.message} (Code: ${error.code})`)
    } else {
      console.warn(`🔧 Network/Other Error:`, error)
    }
    
    // Return false but don't throw - allows local functionality to continue
    return false
  }
}

/**
 * Calculate pricing and return in frontend format
 */
export async function calculateFrontendPricing(
  rfxId: string,
  subtotal: number
): Promise<FrontendCalculationResult | null> {
  // ✅ VALIDATE: Ensure UUID format before making API call
  if (!rfxId || !isValidUUID(rfxId)) {
    console.error('❌ INVALID UUID FORMAT - Cannot calculate pricing:', {
      provided: rfxId,
      type: typeof rfxId,
      length: rfxId?.length,
      isValidUUID: isValidUUID(rfxId || '')
    })
    throw new BackendPricingApiError(
      `Invalid rfx_id format (expects UUID): ${rfxId}`,
      'INVALID_UUID_FORMAT'
    )
  }

  try {
    console.log(`🔄 Attempting to calculate pricing for VALID UUID: ${rfxId}, subtotal: ${subtotal}`)
    
    const backendResult = await realBackendPricingApi.calculatePricing(rfxId, subtotal)
    console.log(`✅ Backend calculation result:`, backendResult)
    
    return backendToFrontendCalculation(backendResult)
  } catch (error) {
    console.warn('⚠️ Error calculating pricing (using local fallback):', error)
    
    // Enhanced error logging
    if (error instanceof BackendPricingApiError) {
      console.warn(`📡 API Error: ${error.message} (Code: ${error.code})`)
    } else {
      console.warn(`🔧 Network/Other Error:`, error)
    }
    
    // Return null - caller should handle local calculation fallback
    return null
  }
}

/**
 * Validate configuration and return user-friendly errors
 */
export async function validateFrontendPricingConfig(
  config: FrontendPricingFormData
): Promise<{ valid: boolean; errors: string[] }> {
  try {
    const validation = await realBackendPricingApi.validateConfig({
      coordination_rate: config.coordination_rate,
      headcount: config.headcount,
      tax_rate: config.tax_rate
    })
    
    return {
      valid: validation.valid,
      errors: validation.errors || []
    }
  } catch (error) {
    console.error('Error validating config:', error)
    return {
      valid: false,
      errors: ['Error de conexión con el servidor de validación']
    }
  }
}

// ========================
// ERROR HANDLING
// ========================

export function isBackendPricingError(error: any): error is BackendPricingApiError {
  return error instanceof BackendPricingApiError
}

export function handleBackendPricingError(error: any): string {
  if (isBackendPricingError(error)) {
    switch (error.code) {
      case 'HTTP_404':
        return 'RFX no encontrado. Verifique el ID del RFX.'
      case 'HTTP_400':
        return 'Datos de configuración inválidos. Revise los valores ingresados.'
      case 'HTTP_500':
        return 'Error interno del servidor. Intente nuevamente.'
      case 'NETWORK_ERROR':
        return 'Error de conexión. Verifique su conexión a internet.'
      default:
        return error.message || 'Error desconocido en el servidor de pricing.'
    }
  }
  
  return 'Error inesperado. Contacte al administrador del sistema.'
}
