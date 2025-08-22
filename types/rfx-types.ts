export interface Requirement {
  id: number
  text: string
  category: string
  importance: number
}

export interface KeyDate {
  event: string
  date: string
}

export interface CompetitiveFactor {
  factor: string
  weight: number
}

export interface RfxData {
  title: string
  client: string
  deadline: string
  requirements: Requirement[]
  keyDates: KeyDate[]
  competitiveFactors: CompetitiveFactor[]
  summary: string
}

// Backend integration types - V2.0 structure matching backend Pydantic models
export interface Product {
  // V2.0 structure (primary)
  product_name?: string
  quantity?: number
  unit?: string
  estimated_unit_price?: number
  // Legacy fallback (secondary)
  nombre?: string
  cantidad?: number
  unidad?: string
  precio_unitario?: number
  subtotal?: number
}

export interface RfxProcessed {
  id: string
  // V2.0 primary fields
  email?: string
  requester_name?: string
  company_name?: string
  products?: Product[]
  delivery_date?: string
  delivery_time?: string
  location?: string
  estimated_budget?: number
  actual_cost?: number
  status?: 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
  received_at?: string
  created_at?: string
  metadata_json?: any
  
  // Legacy compatibility fields (fallback)
  nombre_solicitante?: string
  nombre_cliente?: string
  productos?: Product[]
  hora_entrega?: string
  fecha?: string
  lugar?: string
  costo_total?: number
  tipo?: 'catering' | 'suministros' | 'servicios' | 'construccion'
  estado?: 'pendiente' | 'procesando' | 'procesado' | 'error'
  fecha_recepcion?: string
  metadatos?: any
  
  // Company fields (may be in metadata)
  nombre_empresa?: string
  email_empresa?: string
  telefono_empresa?: string
  telefono_solicitante?: string
  cargo_solicitante?: string
}

export interface RfxResponse {
  status: "success" | "error"
  message: string
  data?: RfxProcessed
  propuesta_id?: string
  propuesta_url?: string
  error?: string
  timestamp?: string // ISO datetime string
}

export interface ExtractedData {
  solicitante: string
  email: string
  productos: string
  fechaEntrega: string
  lugarEntrega: string
  // Campos de empresa adicionales
  empresa?: string
  email_empresa?: string
  telefono_solicitante?: string
  telefono_empresa?: string
  cargo_solicitante?: string
}
