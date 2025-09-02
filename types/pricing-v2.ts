/**
 * Types for Pricing System V2.2
 * Maps to the database schema in Complete-Schema-V2.2.sql
 */

// ========================
// ENUM TYPES (matching database)
// ========================

export type PricingConfigStatus = 'active' | 'inactive' | 'archived'
export type CoordinationType = 'basic' | 'standard' | 'premium' | 'custom'
export type HeadcountSource = 'manual' | 'extracted' | 'estimated'
export type CalculationBase = 'subtotal' | 'subtotal_with_coordination' | 'final_total'

// ========================
// CONFIGURATION INTERFACES
// ========================

export interface CoordinationConfiguration {
  id?: string
  pricing_config_id?: string
  is_enabled: boolean
  coordination_type: CoordinationType
  rate: number // Decimal (0.18 = 18%)
  rate_percentage?: number // Generated field for display
  description: string
  internal_notes?: string
  apply_to_subtotal: boolean
  apply_to_total: boolean
  minimum_amount?: number
  maximum_amount?: number
  configuration_source?: string
  created_at?: string
  updated_at?: string
}

export interface CostPerPersonConfiguration {
  id?: string
  pricing_config_id?: string
  is_enabled: boolean
  headcount: number
  headcount_confirmed: boolean
  headcount_source: HeadcountSource
  display_in_proposal: boolean
  display_format: string
  calculation_base: CalculationBase
  round_to_cents: boolean
  description: string
  internal_notes?: string
  created_at?: string
  updated_at?: string
}

export interface TaxConfiguration {
  id?: string
  pricing_config_id?: string
  is_enabled: boolean
  tax_name: string
  tax_rate: number // Decimal (0.16 = 16%)
  tax_percentage?: number // Generated field for display
  apply_to_subtotal: boolean
  apply_to_subtotal_with_coordination: boolean
  tax_jurisdiction?: string
  description?: string
  internal_notes?: string
  created_at?: string
  updated_at?: string
}

export interface RfxPricingConfiguration {
  id?: string
  rfx_id: string
  configuration_name: string
  is_active: boolean
  status: PricingConfigStatus
  created_by?: string
  updated_by?: string
  applied_by?: string
  created_at?: string
  updated_at?: string
  applied_at?: string
  
  // Related configurations
  coordination?: CoordinationConfiguration
  cost_per_person?: CostPerPersonConfiguration
  tax?: TaxConfiguration
}

// ========================
// API REQUEST/RESPONSE TYPES
// ========================

export interface CreatePricingConfigRequest {
  rfx_id: string
  configuration_name?: string
  coordination?: Partial<CoordinationConfiguration>
  cost_per_person?: Partial<CostPerPersonConfiguration>
  tax?: Partial<TaxConfiguration>
}

export interface UpdatePricingConfigRequest {
  configuration_name?: string
  coordination?: Partial<CoordinationConfiguration>
  cost_per_person?: Partial<CostPerPersonConfiguration>
  tax?: Partial<TaxConfiguration>
}

export interface PricingCalculationRequest {
  rfx_id: string
  base_subtotal: number
}

export interface PricingCalculationResult {
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
// UI COMPONENT TYPES
// ========================

export interface PricingConfigFormData {
  // Coordination section
  coordination_enabled: boolean
  coordination_type: CoordinationType
  coordination_rate: number
  coordination_description: string
  coordination_apply_to_subtotal: boolean
  coordination_minimum?: number
  coordination_maximum?: number
  
  // Cost per person section
  cost_per_person_enabled: boolean
  headcount: number
  headcount_source: HeadcountSource
  calculation_base: CalculationBase
  display_in_proposal: boolean
  cost_per_person_description: string
  
  // Tax section
  taxes_enabled: boolean
  tax_name: string
  tax_rate: number
  tax_apply_to_subtotal: boolean
  tax_apply_to_coordination: boolean
  tax_description?: string
}

// ========================
// SUMMARY/DISPLAY TYPES
// ========================

export interface PricingSummary {
  rfx_id: string
  pricing_config_id?: string
  configuration_name: string
  is_active: boolean
  status: PricingConfigStatus
  
  // Coordination summary
  coordination_enabled: boolean
  coordination_rate?: number
  coordination_percentage?: number
  coordination_type?: CoordinationType
  coordination_description?: string
  
  // Cost per person summary
  cost_per_person_enabled: boolean
  headcount?: number
  headcount_confirmed?: boolean
  show_cost_per_person?: boolean
  cost_calculation_base?: CalculationBase
  
  // Tax summary
  taxes_enabled: boolean
  tax_name?: string
  tax_rate?: number
  tax_percentage?: number
  
  // Timestamps
  created_at?: string
  updated_at?: string
  applied_at?: string
}

// ========================
// UTILITY TYPES
// ========================

export interface PricingConfigDefaults {
  coordination: Partial<CoordinationConfiguration>
  cost_per_person: Partial<CostPerPersonConfiguration>
  tax: Partial<TaxConfiguration>
}

export interface PricingValidationResult {
  is_valid: boolean
  errors: string[]
  warnings: string[]
}

// ========================
// LEGACY COMPATIBILITY
// ========================

// For backward compatibility with existing PricingConfig interface
export interface LegacyPricingConfig {
  includeCoordination: boolean
  coordinationRate: number
  includeCostPerPerson: boolean
  headcount: number
}

// Converter functions type
export type PricingConfigConverter = {
  toV2: (legacy: LegacyPricingConfig) => PricingConfigFormData
  fromV2: (v2: PricingConfigFormData) => LegacyPricingConfig
}

// ========================
// API ERROR TYPES
// ========================

export interface PricingApiError {
  message: string
  code: string
  details?: {
    field?: string
    constraint?: string
    value?: any
  }
}

export interface PricingApiResponse<T> {
  success: boolean
  data?: T
  error?: PricingApiError
  metadata?: {
    total_count?: number
    page?: number
    page_size?: number
  }
}
