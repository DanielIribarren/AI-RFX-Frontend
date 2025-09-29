/**
 * Types for New SaaS Project System with BudyAgent
 * Based on the migration guide: APIs Legacy → Nuevo Flujo SaaS con BudyAgent
 */

// ========================
// ENUM TYPES
// ========================

export type ProjectType = 'catering' | 'events' | 'construction' | 'consulting' | 'general'
export type ProjectStatus = 'draft' | 'analyzed' | 'in_review' | 'completed' | 'cancelled'
export type WorkflowStepStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

// ========================
// CORE PROJECT INTERFACES
// ========================

export interface ProjectOrganization {
  id: string
  name: string
  industry: string
}

export interface ProjectUser {
  id: string
  name: string
  email: string
}

export interface ProjectTimeline {
  start_date?: string
  end_date?: string
  delivery_date?: string
}

export interface ProjectBudget {
  estimated_budget?: number
  currency: string
  budget_range_min?: number
  budget_range_max?: number
}

export interface ProjectItem {
  id: string
  name: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  category?: string
}

export interface Project {
  id: string
  name: string
  description?: string
  project_type: ProjectType
  status: ProjectStatus
  organization: ProjectOrganization
  user: ProjectUser
  timeline?: ProjectTimeline
  budget?: ProjectBudget
  requirements?: string[]
  location?: string
  created_at: string
  updated_at?: string
}

// ========================
// EXTRACTED DATA INTERFACES
// ========================

export interface ProjectExtractedData {
  project_title?: string
  client_name?: string
  client_company?: string
  requirements?: Record<string, any>
  timeline?: Record<string, any>
  budget_info?: Record<string, any>
}

export interface ProjectAnalysisMetadata {
  primary_industry?: string
  complexity_score?: number
  confidence_level?: number
  implicit_needs?: string[]
  critical_factors?: string[]
}

// ========================
// API REQUEST INTERFACES
// ========================

export interface CreateProjectRequest {
  files?: File[]
  text_content?: string
  project_type?: ProjectType
  name?: string
}

export interface UpdateProjectDataRequest {
  client_name?: string
  project_title?: string
  timeline?: Partial<ProjectTimeline>
  budget?: Partial<ProjectBudget>
  requirements?: string[]
  location?: string
}

export interface UpdateProjectItemsCostsRequest {
  items: {
    id: string
    unit_price: number
  }[]
}

export interface UpdateProjectCurrencyRequest {
  currency: string
}

// ========================
// API RESPONSE INTERFACES
// ========================

export interface CreateProjectResponse {
  status: 'success' | 'error'
  project: Project
  extracted_data: ProjectExtractedData
  analysis_metadata: ProjectAnalysisMetadata
  suggestions: string[]
  ready_for_review: boolean
  message?: string
  error?: string
}

export interface ProjectListResponse {
  status: 'success' | 'error'
  projects: Project[]
  total: number
  pagination: {
    page: number
    per_page: number
    has_more: boolean
  }
  message?: string
  error?: string
}

export interface ProjectDetailsResponse {
  status: 'success' | 'error'
  project: Project
  items: ProjectItem[]
  analysis_context?: {
    budy_agent_analysis: Record<string, any>
    confidence_scores: Record<string, any>
    recommendations: string[]
  }
  message?: string
  error?: string
}

export interface ProjectItemsResponse {
  status: 'success' | 'error'
  items: ProjectItem[]
  total: number
  message?: string
  error?: string
}

// ========================
// WORKFLOW INTERFACES
// ========================

export interface WorkflowStep {
  step: number
  name: string
  status: WorkflowStepStatus
  completed_at?: string
  description: string
}

export interface ProjectWorkflow {
  current_step: number
  total_steps: number
  steps: WorkflowStep[]
}

export interface ProjectWorkflowResponse {
  status: 'success' | 'error'
  workflow: ProjectWorkflow
  message?: string
  error?: string
}

// ========================
// PROPOSALS INTERFACES
// ========================

export interface ProposalGenerationRequest {
  project_id: string
  confirmed_data: {
    client_name: string
    project_title: string
    items: {
      name: string
      quantity: number
      unit_price: number
    }[]
  }
  pricing_config: {
    currency: string
    tax_rate: number
    coordination_fee: number
    payment_terms: string
  }
}

export interface ProposalSection {
  title: string
  items: ProposalItem[]
  subtotal: number
}

export interface ProposalItem {
  name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface ProposalQuote {
  id: string
  quote_number: string
  project_title: string
  client_name: string
  industry: string
  subtotal: number
  coordination_amount: number
  tax_amount: number
  total_amount: number
  currency: string
  html_content: string
  sections: ProposalSection[]
  valid_until: string
  payment_terms: string
  delivery_terms: string
  complexity_level: string
  estimated_duration: string
  recommendations: string[]
}

export interface ProposalGenerationResponse {
  status: 'success' | 'error'
  quote: ProposalQuote
  metadata: {
    generation_method: string
    model_used: string
    generation_time: number
    reasoning: string
    quality_indicators: {
      context_used: boolean
      sections_count: number
      total_items: number
    }
  }
  message?: string
  error?: string
}

export interface ProposalListResponse {
  status: 'success' | 'error'
  proposals: ProposalQuote[]
  total: number
  pagination: {
    page: number
    per_page: number
    has_more: boolean
  }
  message?: string
  error?: string
}

// ========================
// PRICING CONFIGURATION INTERFACES
// ========================

export interface ProjectPricingConfiguration {
  currency: string
  tax_rate: number
  coordination_fee: number
  payment_terms: string
}

export interface PricingConfigurationResponse {
  status: 'success' | 'error'
  configuration: ProjectPricingConfiguration
  message?: string
  error?: string
}

export interface PricingCalculationRequest {
  project_id: string
  subtotal: number
}

export interface PricingCalculationResponse {
  status: 'success' | 'error'
  calculation: {
    subtotal: number
    coordination_amount: number
    tax_amount: number
    total_amount: number
    currency: string
  }
  message?: string
  error?: string
}

// ========================
// COMPATIBILITY TYPES (Legacy → New)
// ========================

export interface LegacyProjectMapping {
  // Legacy RFX fields → New Project fields
  rfx_id: string                    // → project.id
  rfx_type: ProjectType            // → project.project_type
  nombre_cliente: string           // → extracted_data.client_name
  requester_name: string          // → extracted_data.client_name
  company_name: string            // → extracted_data.client_company
  productos: ProjectItem[]        // → items (renamed structure)
  delivery_date: string           // → timeline.delivery_date
  delivery_time: string           // → timeline.delivery_time
  location: string                // → project.location
  estimated_budget: number        // → budget.estimated_budget
  currency: string                // → budget.currency
  status: string                  // → project.status (mapped)
  received_at: string             // → project.created_at
}

// ========================
// UTILITY TYPES
// ========================

export interface ApiResponse<T> {
  status: 'success' | 'error'
  data?: T
  message?: string
  error?: string
  timestamp?: string
}

export interface PaginationInfo {
  page: number
  per_page: number
  total_items: number
  has_more: boolean
  next_offset?: number
}

export interface ProjectListItem {
  id: string
  name: string
  project_type: ProjectType
  status: ProjectStatus
  created_at: string
  client_name?: string
  estimated_budget?: number
}

// ========================
// ERROR TYPES
// ========================

export class ProjectApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errorCode?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ProjectApiError'
  }
}

// ========================
// STATUS MAPPING UTILITIES
// ========================

export const STATUS_MAPPING = {
  // Legacy RFX status → New Project status
  'pendiente': 'draft',
  'procesando': 'analyzed', 
  'procesado': 'completed',
  'error': 'cancelled',
  'in_progress': 'analyzed',
  'completed': 'completed',
  'cancelled': 'cancelled',
  'expired': 'cancelled'
} as const

export const PROJECT_TYPE_MAPPING = {
  // Legacy tipo_rfx → New project_type
  'catering': 'catering',
  'suministros': 'general',
  'servicios': 'consulting',
  'construccion': 'construction'
} as const

export const INDUSTRY_MAPPING = {
  'catering': 'Food & Beverage',
  'events': 'Events & Entertainment', 
  'construction': 'Construction & Engineering',
  'consulting': 'Professional Services',
  'general': 'General Services'
} as const
