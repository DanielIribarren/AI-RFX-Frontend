/**
 * Tipos para el Chat Conversacional de RFX
 */

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  files?: FileAttachment[]
  metadata?: {
    confidence?: number
    changes?: RFXChange[]
    requiresConfirmation?: boolean
    options?: ConfirmationOption[]
    type?: string
  }
}

export interface FileAttachment {
  name: string
  size: number
  type: string
  url?: string
}

export interface RFXChange {
  type: "add_product" | "update_product" | "delete_product" | "update_field"
  target: string
  data: any
  description: string
}

export interface ConfirmationOption {
  value: string
  label: string
  emoji: string
  context?: any
}

export interface ChatContext {
  current_products: any[]
  current_total: number
  delivery_date?: string
  delivery_location?: string
  client_name?: string
  client_email?: string
}

export interface ChatRequest {
  rfxId: string
  message: string
  files?: File[]
  context: ChatContext
}

export interface ChatResponse {
  status: "success" | "error"
  message: string
  confidence: number
  changes: RFXChange[]
  requires_confirmation: boolean
  options?: ConfirmationOption[]
  metadata?: {
    tokens_used?: number
    cost_usd?: number
    processing_time_ms?: number
    model_used?: string
  }
}

export interface RFXUpdateChatPanelProps {
  isOpen: boolean
  onClose: () => void
  rfxId: string
  rfxData: any
  onUpdate: (changes: RFXChange[]) => void
}
