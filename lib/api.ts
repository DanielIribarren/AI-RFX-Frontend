// API configuration for connecting to Flask backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Backend data types (updated for V2.0 structure with legacy fallback)
export interface Product {
  // V2.0 structure (primary)
  product_name?: string;
  quantity?: number;
  unit?: string;
  estimated_unit_price?: number;
  // Legacy fallback (secondary)
  nombre?: string;
  cantidad?: number;
  unidad?: string;
  precio_unitario?: number;
  subtotal?: number;
}

export interface RfxInput {
  email?: string;
  nombre_cliente?: string;
  productos?: Product[];
  hora_entrega?: string;
  fecha?: string;
  lugar?: string;
}

export interface RFXRequest {
  id: string;
  pdf_file?: File;
  tipo_rfx?: 'catering' | 'suministros' | 'servicios' | 'construccion';
  pdf_url?: string;
  contenido_extraido?: string;
}

// Updated to match backend RFXResponse V2.0 with legacy fallback
export interface RFXResponse {
  status: "success" | "error";
  message: string;
  data?: {
    id: string;
    // V2.0 structure (primary)
    email?: string;
    requester_name?: string;
    company_name?: string;
    products?: Product[];
    delivery_date?: string;
    delivery_time?: string;
    location?: string;
    estimated_budget?: number;
    actual_cost?: number;
    status?: 'draft' | 'in_progress' | 'completed' | 'cancelled' | 'expired';
    received_at?: string;
    metadata_json?: any;
    
    // Legacy compatibility fields (fallback)
    nombre_cliente?: string;
    nombre_solicitante?: string;
    productos?: Product[];
    hora_entrega?: string;
    fecha?: string; // fecha_entrega in backend
    lugar?: string;
    costo_total?: number;
    tipo?: 'catering' | 'suministros' | 'servicios' | 'construccion';
    estado?: 'pendiente' | 'procesando' | 'procesado' | 'error';
    fecha_recepcion?: string; // ISO datetime string
    metadatos?: any;
  };
  propuesta_id?: string;
  propuesta_url?: string;
  error?: string;
  timestamp?: string; // ISO datetime string
}

// Updated to match backend ProposalRequest V2.0 (English schema)
export interface ProposalRequest {
  rfx_id: string;
  costs: number[];
  history?: string;
  notes?: {
    modality: 'buffet' | 'full_service' | 'self_service' | 'simple_delivery';
    modality_description?: string;
    coordination?: string;
    additional_notes?: string;
  };
  custom_template?: string;
}

// Updated to match backend ProposalResponse V2.0 (English schema)
export interface ProposalResponse {
  status: "success" | "error";
  message: string;
  document_id?: string;
  pdf_url?: string;
  proposal?: {
    id: string;
    rfx_id: string;
    content_markdown?: string;
    content_html: string;
    itemized_costs: {
      product_name: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
    }[];
    total_cost: number;
    notes: {
      modality: string;
      modality_description: string;
      coordination: string;
      additional_notes: string;
    };
    status: 'draft' | 'generated' | 'sent' | 'accepted' | 'rejected';
    created_at: string; // ISO datetime string
    updated_at: string; // ISO datetime string
    pdf_url?: string;
    metadata?: any;
  };
  error?: string;
  timestamp?: string; // ISO datetime string
}

// Updated to match backend history response structure
export interface RFXHistoryResponse {
  status: "success" | "error";
  message: string;
  data: RFXHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    has_more: boolean;
  };
  error?: string;
}

export interface RFXHistoryItem {
  id: string;
  cliente_id?: string;
  nombre_cliente: string;
  tipo: 'catering' | 'suministros' | 'servicios' | 'construccion';
  fecha_recepcion: string; // ISO datetime string
  costo_total: number;
  pdf_url?: string;
  estado: 'In progress' | 'completed' | 'Draft' | 'Cancelled' | 'Expired';
  numero_productos: number;
  // Additional fields for consistency
  title: string;
  client: string;
  date: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled' | 'expired';
  rfxId: string;
}

export interface RecentRFXItem {
  id: string;
  title: string;
  client: string;
  date: string;
  status: "Draft" | "In progress" | "Completed" | "Cancelled" | "Expired";
  rfxId: string;
  // Additional fields for consistency with history
  tipo: 'catering' | 'suministros' | 'servicios' | 'construccion';
  numero_productos: number;
  costo_total: number;
}

// Enhanced API client with better error handling
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public errorCode?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Utility function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    
    if (!response.ok) {
      throw new APIError(
        data.message || 'API request failed',
        response.status,
        data.error || data.status,
        data
      );
    }
    
    return data;
  } else {
    // Handle non-JSON responses (like file downloads)
    if (!response.ok) {
      throw new APIError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }
    
    return response as unknown as T;
  }
}

export const api = {
  // Process RFX - Enhanced with better error handling and FormData support
  async processRFX(body: FormData | RFXRequest): Promise<RFXResponse> {
    try {
      const url = `${API_BASE_URL}/api/rfx/process`;
      if (body instanceof FormData) {
        const response = await fetch(url, { method: "POST", body });
        if (!response.ok) throw new APIError(`API ${response.status}: ${await response.text()}`, response.status);
        return await response.json();
      }
      const formData = new FormData();
      formData.append('id', body.id);
      formData.append('tipo_rfx', body.tipo_rfx ?? "catering");
      if (body.pdf_file) formData.append('pdf_file', body.pdf_file as File);
      if (body.pdf_url) formData.append('pdf_url', body.pdf_url);
      if (body.contenido_extraido) formData.append('contenido_extraido', body.contenido_extraido);
      const response = await fetch(url, { method: "POST", body: formData });
      if (!response.ok) throw new APIError(`API ${response.status}: ${await response.text()}`, response.status);
      return await response.json();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error processing RFX', 0, 'NETWORK_ERROR');
    }
  },

  // Generate proposal - Enhanced
  async generateProposal(data: ProposalRequest): Promise<ProposalResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/proposals/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return handleResponse<ProposalResponse>(response);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error generating proposal', 0, 'NETWORK_ERROR');
    }
  },

  // Get RFX history with pagination support
  async getRFXHistory(page: number = 1, limit: number = 50): Promise<RFXHistoryResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/rfx/history?page=${page}&limit=${limit}`
      );

      return handleResponse<RFXHistoryResponse>(response);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error fetching history', 0, 'NETWORK_ERROR');
    }
  },

  // Get recent RFX for sidebar (limited to 12 items)
  async getRecentRFX(): Promise<{ status: string; message: string; data: RecentRFXItem[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rfx/recent`);

      return handleResponse<{ status: string; message: string; data: RecentRFXItem[] }>(response);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error fetching recent RFX', 0, 'NETWORK_ERROR');
    }
  },

  // Get specific RFX by ID
  async getRFXById(rfxId: string): Promise<RFXResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rfx/${rfxId}`);
      return handleResponse<RFXResponse>(response);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error fetching RFX', 0, 'NETWORK_ERROR');
    }
  },

  // Finalize RFX (mark as completed)
  async finalizeRFX(rfxId: string): Promise<{ status: string; message: string; data: { id: string; estado: string } }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rfx/${rfxId}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return handleResponse<{ status: string; message: string; data: { id: string; estado: string } }>(response);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error finalizing RFX', 0, 'NETWORK_ERROR');
    }
  },

  // Get specific proposal by ID
  async getProposalById(proposalId: string): Promise<ProposalResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}`);
      return handleResponse<ProposalResponse>(response);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error fetching proposal', 0, 'NETWORK_ERROR');
    }
  },

  // Get proposals for specific RFX
  async getProposalsByRFX(rfxId: string): Promise<{ status: string; message: string; data: any[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/proposals/rfx/${rfxId}/proposals`);
      return handleResponse<{ status: string; message: string; data: any[] }>(response);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error fetching proposals', 0, 'NETWORK_ERROR');
    }
  },

  // Download document with format support
  async downloadDocument(documentId: string, format: 'pdf' | 'html' | 'markdown' = 'pdf'): Promise<Blob> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/download/${documentId}?format=${format}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new APIError(
          errorData.message || 'Error downloading document',
          response.status,
          errorData.error || errorData.status,
          errorData
        );
      }
      
      return response.blob();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error downloading document', 0, 'NETWORK_ERROR');
    }
  },

  // Update product costs for RFX  
  async updateProductCosts(rfxId: string, productCosts: { product_id: string; unit_price: number }[]): Promise<{ status: string; message: string; data: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rfx/${rfxId}/products/costs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_costs: productCosts }),
      });

      return handleResponse<{ status: string; message: string; data: any }>(response);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error updating product costs', 0, 'NETWORK_ERROR');
    }
  },

  // ✅ NUEVO: Update RFX field data (company, client, request info, etc.)
  async updateRFXField(rfxId: string, field: string, value: string): Promise<{ status: string; message: string; data: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rfx/${rfxId}/data`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field, value }),
      });

      return handleResponse<{ status: string; message: string; data: any }>(response);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error updating RFX field', 0, 'NETWORK_ERROR');
    }
  },

  // ✅ NUEVO: Update individual product field
  async updateProductField(rfxId: string, productId: string, field: string, value: string | number): Promise<{ status: string; message: string; data: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rfx/${rfxId}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field, value }),
      });

      return handleResponse<{ status: string; message: string; data: any }>(response);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error updating product field', 0, 'NETWORK_ERROR');
    }
  },

  // Legacy method for backward compatibility
  async downloadPDF(documentId: string): Promise<Blob> {
    return this.downloadDocument(documentId, 'pdf');
  },

  // Health check
  async healthCheck(): Promise<{ status: string; message: string; environment: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return handleResponse<{ status: string; message: string; environment: string }>(response);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error checking health', 0, 'NETWORK_ERROR');
    }
  },
};

// Helper function for using the API in React components
export const useAPICall = () => {
  const handleAPIError = (error: unknown) => {
    if (error instanceof APIError) {
      console.error(`API Error ${error.status}: ${error.message}`, {
        errorCode: error.errorCode,
        details: error.details
      });
      return {
        message: error.message,
        status: error.status,
        errorCode: error.errorCode,
        details: error.details,
      };
    }
    console.error('Unknown error:', error);
    return {
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      status: 0,
    };
  };

  return { handleAPIError };
}; 