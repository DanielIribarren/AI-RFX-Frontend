/**
 * Types for Real Backend API V2.2
 * Maps exactly to FRONTEND-INTEGRATION-GUIDE-V2.2.md specifications
 */

// ========================
// REAL BACKEND REQUEST/RESPONSE TYPES
// ========================

/**
 * GET /api/pricing/config/{rfx_id} Response
 */
export interface BackendPricingConfigResponse {
  status: "success" | "error"
  data: {
    rfx_id: string
    coordination_enabled: boolean
    coordination_rate: number
    coordination_level?: "basic" | "standard" | "premium" | "custom"
    cost_per_person_enabled: boolean
    headcount: number | null
    per_person_display?: boolean
    taxes_enabled: boolean
    tax_rate: number | null
    tax_type: string | null
    has_configuration: boolean
    last_updated: string | null
    enabled_configs: string[]
  }
}

/**
 * PUT /api/pricing/config/{rfx_id} Request Body
 * Must match PricingConfigurationRequest model in backend/models/pricing_models.py
 */
export interface BackendUpdatePricingConfigRequest {
  // Coordination configuration (flat structure)
  coordination_enabled: boolean
  coordination_rate?: number        // 0.18 = 18%
  coordination_level?: "basic" | "standard" | "premium" | "custom"
  
  // Cost per person configuration
  cost_per_person_enabled: boolean
  headcount?: number
  per_person_display?: boolean
  
  // Tax configuration
  taxes_enabled: boolean
  tax_rate?: number        // 0.16 = 16%
  tax_type?: string        // "IVA"
  
  // Optional preset usage
  use_preset_id?: string
}

/**
 * PUT /api/pricing/config/{rfx_id} Response
 */
export interface BackendUpdatePricingConfigResponse {
  status: "success" | "error"
  message: string
  data: {
    configuration_id: string
  }
}

/**
 * POST /api/pricing/calculate/{rfx_id} Request Body
 */
export interface BackendCalculatePricingRequest {
  subtotal: number
}

/**
 * POST /api/pricing/calculate/{rfx_id} Response
 */
export interface BackendCalculatePricingResponse {
  status: "success" | "error"
  data: {
    subtotal: number
    coordination_enabled: boolean
    coordination_amount: number
    cost_per_person_enabled: boolean
    headcount: number
    cost_per_person: number
    taxes_enabled: boolean
    tax_amount: number
    total_before_tax: number
    final_total: number
  }
}

/**
 * GET /api/pricing/summary/{rfx_id} Response
 */
export interface BackendPricingSummaryResponse {
  status: "success" | "error"
  data: {
    configuration_name: string
    coordination: { 
      enabled: boolean
      rate: number
      amount: number 
    }
    cost_per_person: { 
      enabled: boolean
      headcount: number
      cost: number 
    }
    taxes: { 
      enabled: boolean
      rate: number
      amount: number 
    }
    totals: {
      subtotal: number
      total_before_tax: number
      final_total: number
    }
  }
}

/**
 * POST /api/pricing/quick-config/{rfx_id} Request Body
 */
export interface BackendQuickConfigRequest {
  preset_type: "catering_basic" | "catering_premium" | "eventos_corporativos" | "custom"
  headcount?: number
}

/**
 * POST /api/pricing/quick-config/{rfx_id} Response
 */
export interface BackendQuickConfigResponse {
  status: "success" | "error"
  message: string
  data: {
    applied_preset: string
  }
}

/**
 * GET /api/pricing/presets Response
 */
export interface BackendPresetsResponse {
  status: "success" | "error"
  data: Array<{
    id: string
    name: string
    coordination_rate: number
    includes_coordination: boolean
    includes_cost_per_person: boolean
    description: string
  }>
}

/**
 * POST /api/pricing/validate-config Request Body
 */
export interface BackendValidateConfigRequest {
  coordination_rate: number
  headcount: number
  tax_rate: number
}

/**
 * POST /api/pricing/validate-config Response
 */
export interface BackendValidateConfigResponse {
  status: "success" | "error"
  valid: boolean
  errors: string[] | null
}

/**
 * GET /api/pricing/calculate-from-rfx/{rfx_id} Response
 */
export interface BackendCalculateFromRfxResponse {
  status: "success" | "error"
  data: {
    subtotal: number
    coordination_amount: number
    final_total: number
    cost_per_person: number
  }
}

// ========================
// UNIFIED API RESPONSE WRAPPER
// ========================

export interface BackendApiResponse<T> {
  status: "success" | "error"
  data?: T
  message?: string
  error?: {
    message: string
    code?: string
    details?: any
  }
}

// ========================
// CONVERTER TYPES
// ========================

/**
 * Frontend form data that gets converted to backend format
 */
export interface FrontendPricingFormData {
  // Coordination
  coordination_enabled: boolean
  coordination_type: "basic" | "standard" | "premium" | "custom"
  coordination_rate: number // decimal (0.18)
  coordination_description: string
  
  // Cost per person
  cost_per_person_enabled: boolean
  headcount: number
  calculation_base: "subtotal" | "subtotal_with_coordination" | "final_total"
  
  // Tax
  taxes_enabled: boolean
  tax_name: string
  tax_rate: number // decimal (0.16)
}

/**
 * Calculation result that gets displayed in frontend
 */
export interface FrontendCalculationResult {
  subtotal: number
  coordination_enabled: boolean
  coordination_rate: number
  coordination_amount: number
  cost_per_person_enabled: boolean
  headcount: number
  cost_per_person: number
  taxes_enabled: boolean
  tax_rate: number
  tax_amount: number
  total_before_tax: number
  final_total: number
}

// ========================
// ERROR TYPES
// ========================

export interface BackendApiError {
  message: string
  code?: string
  details?: any
}

export class BackendPricingApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'BackendPricingApiError'
  }
}
