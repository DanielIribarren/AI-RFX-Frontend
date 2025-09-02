/**
 * API Client for Pricing System V2.2
 * Integrates with the database schema endpoints
 */

import type {
  RfxPricingConfiguration,
  CreatePricingConfigRequest,
  UpdatePricingConfigRequest,
  PricingCalculationRequest,
  PricingCalculationResult,
  PricingSummary,
  PricingApiResponse,
  PricingConfigFormData,
  LegacyPricingConfig,
  PricingConfigConverter
} from '@/types/pricing-v2'

// ========================
// API BASE CONFIGURATION
// ========================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
const PRICING_API_BASE = `${API_BASE_URL}/api/pricing`

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<PricingApiResponse<T>> {
  const response = await fetch(`${PRICING_API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const data = await response.json()

  if (!response.ok) {
    return {
      success: false,
      error: {
        message: data.message || 'API Error',
        code: data.code || 'UNKNOWN_ERROR',
        details: data.details
      }
    }
  }

  return {
    success: true,
    data: data.data || data,
    metadata: data.metadata
  }
}

// ========================
// CONFIGURATION MANAGEMENT
// ========================

export const pricingApiV2 = {
  
  /**
   * Get complete pricing configuration for an RFX
   * GET /api/pricing/config/{rfx_id}
   */
  async getConfig(rfxId: string): Promise<PricingApiResponse<any>> {
    return apiCall<any>(`/config/${rfxId}`)
  },

  /**
   * Update pricing configuration for an RFX  
   * PUT /api/pricing/config/{rfx_id}
   */
  async updateConfig(
    rfxId: string, 
    data: any
  ): Promise<PricingApiResponse<any>> {
    return apiCall<any>(`/config/${rfxId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  /**
   * Get active pricing summary for an RFX
   * GET /api/pricing/summary/{rfx_id}
   */
  async getSummary(rfxId: string): Promise<PricingApiResponse<any>> {
    return apiCall<any>(`/summary/${rfxId}`)
  },

  /**
   * Calculate pricing with current configuration
   * POST /api/pricing/calculate/{rfx_id}
   */
  async calculatePricing(data: PricingCalculationRequest): Promise<PricingApiResponse<PricingCalculationResult>> {
    return apiCall<PricingCalculationResult>(`/calculate/${data.rfx_id}`, {
      method: 'POST',
      body: JSON.stringify({ subtotal: data.base_subtotal })
    })
  },

  /**
   * Calculate from existing RFX data
   * GET /api/pricing/calculate-from-rfx/{rfx_id}
   */
  async calculateFromRfx(rfxId: string): Promise<PricingApiResponse<PricingCalculationResult>> {
    return apiCall<PricingCalculationResult>(`/calculate-from-rfx/${rfxId}`)
  },

  /**
   * Quick configuration with presets
   * POST /api/pricing/quick-config/{rfx_id}
   */
  async quickConfig(
    rfxId: string, 
    presetType: string, 
    headcount?: number
  ): Promise<PricingApiResponse<{ applied_preset: string }>> {
    return apiCall<{ applied_preset: string }>(`/quick-config/${rfxId}`, {
      method: 'POST',
      body: JSON.stringify({ preset_type: presetType, headcount })
    })
  },

  /**
   * Get available presets
   * GET /api/pricing/presets
   */
  async getPresets(): Promise<PricingApiResponse<any[]>> {
    return apiCall<any[]>('/presets')
  },

  /**
   * Validate pricing configuration
   * POST /api/pricing/validate-config
   */
  async validateConfig(config: any): Promise<PricingApiResponse<{ valid: boolean; errors: string[] | null }>> {
    return apiCall<{ valid: boolean; errors: string[] | null }>('/validate-config', {
      method: 'POST',
      body: JSON.stringify(config)
    })
  }
}

// ========================
// CONVERTER UTILITIES
// ========================

/**
 * Convert between legacy PricingConfig and V2.2 format
 */
export const pricingConverter: PricingConfigConverter = {
  
  /**
   * Convert legacy format to V2.2 PricingConfigFormData
   */
  toV2(legacy: LegacyPricingConfig): PricingConfigFormData {
    return {
      // Coordination mapping
      coordination_enabled: legacy.includeCoordination,
      coordination_type: 'standard', // Default to standard
      coordination_rate: legacy.coordinationRate / 100, // Convert percentage to decimal
      coordination_description: 'Coordinación y logística',
      coordination_apply_to_subtotal: true,
      
      // Cost per person mapping
      cost_per_person_enabled: legacy.includeCostPerPerson,
      headcount: legacy.headcount,
      headcount_source: 'manual',
      calculation_base: 'final_total',
      display_in_proposal: true,
      cost_per_person_description: 'Cálculo de costo individual',
      
      // Default tax configuration (disabled)
      taxes_enabled: false,
      tax_name: 'IVA',
      tax_rate: 0.16, // 16% default
      tax_apply_to_subtotal: false,
      tax_apply_to_coordination: true
    }
  },

  /**
   * Convert V2.2 format back to legacy for compatibility
   */
  fromV2(v2: PricingConfigFormData): LegacyPricingConfig {
    return {
      includeCoordination: v2.coordination_enabled,
      coordinationRate: v2.coordination_rate * 100, // Convert decimal to percentage
      includeCostPerPerson: v2.cost_per_person_enabled,
      headcount: v2.headcount
    }
  }
}

// ========================
// DEFAULTS AND PRESETS
// ========================

export const pricingDefaults = {
  
  /**
   * Default coordination configuration
   */
  coordination: {
    is_enabled: false,
    coordination_type: 'standard' as const,
    rate: 0.18, // 18%
    description: 'Coordinación y logística',
    apply_to_subtotal: true,
    apply_to_total: false
  },

  /**
   * Default cost per person configuration
   */
  costPerPerson: {
    is_enabled: false,
    headcount: 100,
    headcount_confirmed: false,
    headcount_source: 'manual' as const,
    display_in_proposal: true,
    display_format: 'Costo por persona: ${cost} ({headcount} personas)',
    calculation_base: 'final_total' as const,
    round_to_cents: true,
    description: 'Cálculo de costo individual'
  },

  /**
   * Default tax configuration
   */
  tax: {
    is_enabled: false,
    tax_name: 'IVA',
    tax_rate: 0.16, // 16%
    apply_to_subtotal: false,
    apply_to_subtotal_with_coordination: true,
    tax_jurisdiction: 'Nacional',
    description: 'Impuesto al Valor Agregado'
  }
}

// ========================
// VALIDATION UTILITIES
// ========================

export const pricingValidation = {
  
  /**
   * Validate coordination configuration
   */
  validateCoordination(config: Partial<PricingConfigFormData>): string[] {
    const errors: string[] = []
    
    if (config.coordination_enabled) {
      if (!config.coordination_rate || config.coordination_rate < 0 || config.coordination_rate > 1) {
        errors.push('La tasa de coordinación debe estar entre 0% y 100%')
      }
      
      if (config.coordination_minimum && config.coordination_maximum) {
        if (config.coordination_minimum > config.coordination_maximum) {
          errors.push('El monto mínimo no puede ser mayor al máximo')
        }
      }
    }
    
    return errors
  },

  /**
   * Validate cost per person configuration
   */
  validateCostPerPerson(config: Partial<PricingConfigFormData>): string[] {
    const errors: string[] = []
    
    if (config.cost_per_person_enabled) {
      if (!config.headcount || config.headcount <= 0) {
        errors.push('El número de personas debe ser mayor a 0')
      }
      
      if (config.headcount && config.headcount > 10000) {
        errors.push('El número de personas parece excesivo (máximo 10,000)')
      }
    }
    
    return errors
  },

  /**
   * Validate tax configuration
   */
  validateTax(config: Partial<PricingConfigFormData>): string[] {
    const errors: string[] = []
    
    if (config.taxes_enabled) {
      if (!config.tax_rate || config.tax_rate < 0 || config.tax_rate > 1) {
        errors.push('La tasa de impuesto debe estar entre 0% y 100%')
      }
      
      if (!config.tax_name || config.tax_name.trim().length === 0) {
        errors.push('El nombre del impuesto es requerido')
      }
    }
    
    return errors
  },

  /**
   * Validate complete configuration
   */
  validateComplete(config: PricingConfigFormData): { is_valid: boolean; errors: string[] } {
    const errors = [
      ...this.validateCoordination(config),
      ...this.validateCostPerPerson(config),
      ...this.validateTax(config)
    ]
    
    return {
      is_valid: errors.length === 0,
      errors
    }
  }
}

// ========================
// ERROR HANDLING
// ========================

export class PricingApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'PricingApiError'
  }
}

/**
 * Enhanced error handler for pricing API calls
 */
export const handlePricingApiError = (error: any): PricingApiError => {
  if (error instanceof PricingApiError) {
    return error
  }
  
  if (error?.response?.data) {
    return new PricingApiError(
      error.response.data.message || 'API Error',
      error.response.data.code || 'UNKNOWN_ERROR',
      error.response.data.details
    )
  }
  
  if (error instanceof Error) {
    return new PricingApiError(
      error.message,
      'CLIENT_ERROR'
    )
  }
  
  return new PricingApiError(
    'Unknown error occurred',
    'UNKNOWN_ERROR'
  )
}
