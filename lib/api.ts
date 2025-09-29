// API configuration for connecting to SaaS Backend with BudyAgent
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Import new project types
import {
  Project,
  ProjectItem,
  CreateProjectRequest,
  CreateProjectResponse,
  ProjectListResponse,
  ProjectDetailsResponse,
  ProjectItemsResponse,
  ProposalGenerationRequest,
  ProposalGenerationResponse,
  ProposalListResponse,
  ProjectWorkflowResponse,
  ProjectApiError,
  STATUS_MAPPING,
  PROJECT_TYPE_MAPPING,
  UpdateProjectDataRequest
} from '@/types/project-types'
import type { LegacyProjectMapping } from '@/types/project-types'
import type { RfxProcessed } from '@/types/rfx-types'

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
    currency?: string;
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
  // Optional timestamps for last activity resolution
  updated_at?: string;
  last_activity_at?: string;
  last_updated?: string;
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
  // Optional timestamps for last activity resolution
  updated_at?: string;
  last_activity_at?: string;
  last_updated?: string;
}

// New pagination response interfaces for optimized endpoints
export interface PaginationInfo {
  offset: number;
  limit: number;
  total_items: number;
  has_more: boolean;
  next_offset?: number;
}

export interface RFXLatestResponse {
  status: "success" | "error";
  message: string;
  data: RFXHistoryItem[];
  pagination: PaginationInfo;
  timestamp: string;
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
  // ========================
  // NEW PROJECT APIS (SaaS + BudyAgent)
  // ========================

  // Create and process new project using BudyAgent
  async createProject(body: FormData | CreateProjectRequest): Promise<RFXResponse> {
    try {
      const url = `${API_BASE_URL}/api/projects/`;
      let formData: FormData;
      
      if (body instanceof FormData) {
        formData = body;
      } else {
        formData = new FormData();
        if (body.files) {
          body.files.forEach(file => formData.append('files', file));
        }
        if (body.text_content) formData.append('text_content', body.text_content);
        if (body.project_type) formData.append('project_type', body.project_type);
        if (body.name) formData.append('name', body.name);
      }
      
      const response = await fetch(url, { method: "POST", body: formData });
      if (!response.ok) throw new APIError(`API ${response.status}: ${await response.text()}`, response.status);
      
      const projectResponse = await response.json();
      
      console.log('🔍 DEBUG: Raw backend response structure:', projectResponse);
      
      // Convert new project response to legacy RFXResponse format for compatibility
      return this.convertProjectToLegacyRFX(projectResponse);
    } catch (error) {
      console.error('🚨 DEBUG: Error in createProject:', error);
      if (error instanceof APIError) {
        throw error;
      }
      // Improve error message to help with debugging
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      throw new APIError(`Network error creating project: ${errorMsg}`, 0, 'NETWORK_ERROR', error);
    }
  },

  // Legacy processRFX method - redirects to new createProject API
  async processRFX(body: FormData | RFXRequest): Promise<RFXResponse> {
    console.log('🔄 Legacy processRFX called, redirecting to new createProject API');
    
    // Convert legacy RFXRequest to new CreateProjectRequest format if needed
    if (!(body instanceof FormData)) {
      const formData = new FormData();
      if (body.pdf_file) formData.append('files', body.pdf_file);
      if (body.pdf_url) formData.append('pdf_url', body.pdf_url);
      if (body.contenido_extraido) formData.append('text_content', body.contenido_extraido);
      if (body.tipo_rfx) {
        const mappedType = PROJECT_TYPE_MAPPING[body.tipo_rfx as keyof typeof PROJECT_TYPE_MAPPING] || 'general';
        formData.append('project_type', mappedType);
      }
      return this.createProject(formData);
    }
    
    return this.createProject(body);
  },

  // Get recent projects (replaces getRecentRFX)
  async getRecentProjects(): Promise<{ status: string; message: string; data: RecentRFXItem[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/recent`);
      const projectResponse = await handleResponse<ProjectListResponse>(response);
      
      // Convert to legacy format
      const legacyData = projectResponse.projects ? projectResponse.projects.map(project => this.convertProjectToLegacyItem(project)) : [];
      
      return {
        status: projectResponse.status,
        message: projectResponse.message || 'Projects loaded successfully',
        data: legacyData
      };
    } catch (error) {
      if (error instanceof APIError) {
        // If it's a 404 or similar "not found" error, return empty data instead of throwing
        if (error.status === 404 || 
            error.message?.toLowerCase().includes('no') || 
            error.message?.toLowerCase().includes('not found')) {
          return {
            status: "success",
            message: "No recent projects found",
            data: []
          };
        }
        throw error;
      }
      throw new APIError('Network error fetching recent projects', 0, 'NETWORK_ERROR');
    }
  },

  // Legacy getRecentRFX - redirects to new getRecentProjects
  async getRecentRFX(): Promise<{ status: string; message: string; data: RecentRFXItem[] }> {
    console.log('🔄 Legacy getRecentRFX called, redirecting to new getRecentProjects API');
    return this.getRecentProjects();
  },

  // Get project history (replaces getRFXHistory)
  async getProjectHistory(page: number = 1, limit: number = 50): Promise<RFXHistoryResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/history?page=${page}&limit=${limit}`
      );
      const projectResponse = await handleResponse<ProjectListResponse>(response);
      
      // Convert to legacy format
      const legacyData = projectResponse.projects ? projectResponse.projects.map(project => this.convertProjectToLegacyHistoryItem(project)) : [];
      
      return {
        status: projectResponse.status,
        message: projectResponse.message || 'Project history loaded successfully',
        data: legacyData,
        pagination: {
          page: projectResponse.pagination?.page || page,
          limit: projectResponse.pagination?.per_page || limit,
          total_items: projectResponse.total || 0,
          has_more: projectResponse.pagination?.has_more || false
        }
      };
    } catch (error) {
      if (error instanceof APIError) {
        // If it's a 404 or similar "not found" error, return empty data instead of throwing
        if (error.status === 404 || 
            error.message?.toLowerCase().includes('no') || 
            error.message?.toLowerCase().includes('not found')) {
          return {
            status: "success",
            message: "No project history found",
            data: [],
            pagination: {
              page: page,
              limit: limit,
              total_items: 0,
              has_more: false
            }
          };
        }
        throw error;
      }
      throw new APIError('Network error fetching project history', 0, 'NETWORK_ERROR');
    }
  },

  // Legacy getRFXHistory - redirects to new getProjectHistory
  async getRFXHistory(page: number = 1, limit: number = 50): Promise<RFXHistoryResponse> {
    console.log('🔄 Legacy getRFXHistory called, redirecting to new getProjectHistory API');
    return this.getProjectHistory(page, limit);
  },

  // Get specific project by ID (replaces getRFXById)
  async getProjectById(projectId: string): Promise<RFXResponse> {
    try {
      console.log(`🔍 DEBUG: Getting project by ID: ${projectId}`);
      const url = `${API_BASE_URL}/api/projects/${projectId}`;
      console.log(`🔍 DEBUG: Full URL: ${url}`);
      
      const response = await fetch(url);
      console.log(`🔍 DEBUG: Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`🔍 DEBUG: Error response body: ${errorText}`);
        throw new APIError(`API ${response.status}: ${errorText}`, response.status);
      }
      
      const projectResponse = await response.json();
      console.log(`🔍 DEBUG: Project response structure:`, Object.keys(projectResponse || {}));
      
      // Convert to legacy RFXResponse format
      return {
        status: projectResponse.status || 'success',
        message: projectResponse.message || 'Project loaded successfully',
        data: this.convertProjectDetailsToLegacy(projectResponse),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('🚨 DEBUG: Error in getProjectById:', error);
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error fetching project', 0, 'NETWORK_ERROR');
    }
  },

  // Legacy getRFXById - redirects to new getProjectById with fallback strategy
  async getRFXById(rfxId: string): Promise<RFXResponse> {
    console.log('🔄 Legacy getRFXById called, redirecting to new getProjectById API');
    console.log(`🔍 DEBUG: Attempting to get RFX by ID: ${rfxId}`);
    
    try {
      // First attempt: Use direct project endpoint
      return await this.getProjectById(rfxId);
    } catch (error) {
      console.log(`⚠️ Direct project lookup failed for ID ${rfxId}, trying fallback strategies...`);
      
      // Fallback 1: Try to find in recent projects
      try {
        console.log('🔄 Fallback 1: Searching in recent projects...');
        const recentResponse = await this.getLatestProjects(50); // Get more items to increase chance of finding
        
        const foundProject = recentResponse.data.find(project => 
          project.id === rfxId || project.rfxId === rfxId
        );
        
        if (foundProject) {
          console.log('✅ Found project in recent projects list');
          // Convert the found project to full RFXResponse format
          return {
            status: "success",
            message: "Project found in recent projects",
            data: {
              id: foundProject.id,
              // Copy all available data from the recent project item
              requester_name: foundProject.client,
              nombre_cliente: foundProject.client,
              nombre_solicitante: foundProject.client,
              tipo: foundProject.tipo,
              fecha_recepcion: foundProject.date,
              costo_total: foundProject.costo_total,
              estado: foundProject.status as any,
              productos: [], // Empty for now, will be loaded separately if needed
              products: [], // Empty for now
              received_at: foundProject.date,
              // Add default values for other expected fields
              email: '',
              company_name: '',
              currency: 'USD',
              delivery_date: '',
              location: '',
              estimated_budget: foundProject.costo_total || 0,
              metadata_json: {
                fallback_source: 'recent_projects',
                original_error: error instanceof Error ? error.message : 'Unknown error'
              }
            },
            timestamp: new Date().toISOString()
          };
        }
      } catch (fallbackError) {
        console.log('❌ Fallback 1 also failed:', fallbackError);
      }
      
      // Fallback 2: Try project history
      try {
        console.log('🔄 Fallback 2: Searching in project history...');
        const historyResponse = await this.getProjectHistory(1, 100); // Get more items
        
        const foundProject = historyResponse.data.find(project => 
          project.id === rfxId || project.rfxId === rfxId
        );
        
        if (foundProject) {
          console.log('✅ Found project in project history');
          // Convert the found project to full RFXResponse format
          return {
            status: "success",
            message: "Project found in project history",
            data: {
              id: foundProject.id,
              // Copy all available data from the history project item
              requester_name: foundProject.nombre_cliente,
              nombre_cliente: foundProject.nombre_cliente,
              nombre_solicitante: foundProject.nombre_cliente,
              tipo: foundProject.tipo,
              fecha_recepcion: foundProject.fecha_recepcion,
              costo_total: foundProject.costo_total,
              estado: foundProject.estado as any,
              productos: [], // Empty for now
              products: [], // Empty for now
              received_at: foundProject.fecha_recepcion,
              // Add default values for other expected fields
              email: '',
              company_name: '',
              currency: 'USD',
              delivery_date: foundProject.date,
              location: '',
              estimated_budget: foundProject.costo_total || 0,
              metadata_json: {
                fallback_source: 'project_history',
                original_error: error instanceof Error ? error.message : 'Unknown error'
              }
            },
            timestamp: new Date().toISOString()
          };
        }
      } catch (fallbackError2) {
        console.log('❌ Fallback 2 also failed:', fallbackError2);
      }
      
      // If all fallbacks failed, throw the original error
      console.error('❌ All fallback strategies failed, throwing original error');
      throw error;
    }
  },

  // Get project items (replaces product endpoints)
  async getProjectItems(projectId: string): Promise<{ status: string; message: string; data: Product[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/items`);
      const itemsResponse = await handleResponse<ProjectItemsResponse>(response);
      
      // Convert to legacy Product format
      const legacyProducts = itemsResponse.items.map(item => ({
        product_name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        estimated_unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price
      }));
      
      return {
        status: itemsResponse.status,
        message: itemsResponse.message || 'Project items loaded successfully',
        data: legacyProducts
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error fetching project items', 0, 'NETWORK_ERROR');
    }
  },

  // ========================
  // CONVERSION UTILITIES
  // ========================

  // Map new project status to legacy RFX status
  mapProjectStatusToLegacy(status: string): string {
    const statusMap: Record<string, string> = {
      'draft': 'pendiente',
      'analyzed': 'procesando',
      'in_review': 'procesando',
      'completed': 'procesado',
      'cancelled': 'error'
    };
    return statusMap[status] || 'pendiente';
  },

  convertProjectToLegacyRFX(projectResponse: any): RFXResponse {
    console.log('🔍 DEBUG: Converting project response to legacy format');
    console.log('🔍 DEBUG: Project response keys:', Object.keys(projectResponse || {}));
    
    // Handle different possible response structures
    let project: any;
    let extractedData: any = {};
    let status: "success" | "error" = 'success';
    let message = 'Project created successfully';
    
    // Check if it's the expected CreateProjectResponse structure
    if (projectResponse?.project) {
      project = projectResponse.project;
      extractedData = projectResponse.extracted_data || {};
      status = (projectResponse.status === 'success' || projectResponse.status === 'error') ? projectResponse.status : 'success';
      message = projectResponse.message || message;
    } else {
      // Handle direct project response (simpler structure from backend)
      project = projectResponse;
      status = (projectResponse?.status === 'success' || projectResponse?.status === 'error') ? projectResponse.status : 'success';
      message = projectResponse?.message || message;
    }
    
    console.log('🔍 DEBUG: Project data keys:', Object.keys(project || {}));
    console.log('🔍 DEBUG: Extracted data keys:', Object.keys(extractedData || {}));
    
    const projectId = project?.id || crypto.randomUUID();
    console.log('🔍 DEBUG: Final project ID being returned:', projectId);
    
    return {
      status: status,
      message: message,
      data: {
        id: projectId,
        // New project fields with safe access
        email: project?.user?.email || project?.email || '',
        requester_name: extractedData?.client_name || project?.user?.name || project?.requester_name || 'Unknown Client',
        company_name: extractedData?.client_company || project?.organization?.name || project?.company_name || 'Unknown Company',
        currency: project?.budget?.currency || project?.currency || 'USD',
        products: project?.products || [], // Will be loaded separately if needed
        delivery_date: project?.timeline?.delivery_date || project?.delivery_date,
        delivery_time: project?.timeline?.start_date || project?.delivery_time,
        location: project?.location || '',
        estimated_budget: project?.budget?.estimated_budget || project?.estimated_budget || 0,
        status: this.mapProjectStatusToLegacy(project?.status || 'draft') as any,
        received_at: project?.created_at || project?.received_at || new Date().toISOString(),
        metadata_json: {
          analysis_metadata: projectResponse?.analysis_metadata || {},
          suggestions: projectResponse?.suggestions || [],
          ready_for_review: projectResponse?.ready_for_review || false,
          backend_response: projectResponse // Store full response for debugging
        },
        // Legacy compatibility
        nombre_cliente: extractedData?.client_name || project?.user?.name || project?.requester_name || 'Unknown Client',
        nombre_solicitante: extractedData?.client_name || project?.user?.name || project?.requester_name || 'Unknown Client',
        productos: project?.productos || [],
        fecha: project?.timeline?.delivery_date || project?.delivery_date || project?.fecha,
        lugar: project?.location || project?.lugar || '',
        tipo: project?.project_type || project?.tipo || 'catering' as any,
        estado: this.mapProjectStatusToLegacy(project?.status || 'draft') as any,
        fecha_recepcion: project?.created_at || project?.received_at || project?.fecha_recepcion || new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };
  },

  convertProjectToLegacyItem(project: Project): RecentRFXItem {
    return {
      id: project.id,
      title: project.name,
      client: project.user.name,
      date: project.created_at,
      status: project.status as any,
      rfxId: project.id,
      tipo: project.project_type as any,
      numero_productos: 0, // Will be loaded separately if needed
      costo_total: project.budget?.estimated_budget || 0,
      updated_at: project.updated_at,
      last_activity_at: project.updated_at,
      last_updated: project.updated_at
    };
  },

  convertProjectToLegacyHistoryItem(project: Project): RFXHistoryItem {
    return {
      id: project.id,
      cliente_id: project.user.id,
      nombre_cliente: project.user.name,
      tipo: project.project_type as any,
      fecha_recepcion: project.created_at,
      costo_total: project.budget?.estimated_budget || 0,
      estado: project.status as any,
      numero_productos: 0, // Will be loaded separately if needed
      title: project.name,
      client: project.user.name,
      date: project.created_at,
      status: project.status as any,
      rfxId: project.id,
      updated_at: project.updated_at,
      last_activity_at: project.updated_at,
      last_updated: project.updated_at
    };
  },

  convertProjectDetailsToLegacy(projectResponse: any): any {
    console.log('🔍 DEBUG: Converting project details to legacy format');
    console.log('🔍 DEBUG: Project details response keys:', Object.keys(projectResponse || {}));
    
    // Handle different possible response structures
    let project: any;
    let items: any[] = [];
    
    // Check if it's the expected ProjectDetailsResponse structure
    if (projectResponse?.project) {
      project = projectResponse.project;
      items = projectResponse.items || [];
    } else {
      // Handle direct project response (simpler structure from backend)
      project = projectResponse;
      items = projectResponse?.items || projectResponse?.products || [];
    }
    
    console.log('🔍 DEBUG: Project data keys:', Object.keys(project || {}));
    console.log('🔍 DEBUG: Items count:', items.length);
    
    return {
      id: project?.id || 'unknown-id',
      // New structure fields with safe access
      email: project?.user?.email || project?.email || '',
      requester_name: project?.user?.name || project?.requester_name || 'Unknown Client',
      company_name: project?.organization?.name || project?.company_name || 'Unknown Company',
      products: items.map((item: any) => ({
        product_name: item?.name || item?.product_name || 'Unknown Product',
        quantity: item?.quantity || 1,
        unit: item?.unit || 'units',
        estimated_unit_price: item?.unit_price || item?.estimated_unit_price || 0,
        subtotal: (item?.quantity || 1) * (item?.unit_price || item?.estimated_unit_price || 0)
      })),
      delivery_date: project?.timeline?.delivery_date || project?.delivery_date,
      delivery_time: project?.timeline?.start_date || project?.delivery_time,
      location: project?.location || '',
      estimated_budget: project?.budget?.estimated_budget || project?.estimated_budget || 0,
      status: project?.status || 'draft' as any,
      received_at: project?.created_at || project?.received_at || new Date().toISOString(),
      created_at: project?.created_at || new Date().toISOString(),
      // Legacy compatibility
      nombre_solicitante: project?.user?.name || project?.requester_name || 'Unknown Client',
      nombre_cliente: project?.user?.name || project?.requester_name || 'Unknown Client',
      productos: items.map((item: any) => ({
        id: item?.id || crypto.randomUUID(),
        nombre: item?.name || item?.product_name || 'Unknown Product',
        cantidad: item?.quantity || 1,
        unidad: item?.unit || 'units',
        precio_unitario: item?.unit_price || item?.estimated_unit_price || 0,
        subtotal: (item?.quantity || 1) * (item?.unit_price || item?.estimated_unit_price || 0)
      })),
      fecha: project?.timeline?.delivery_date || project?.delivery_date || project?.fecha,
      lugar: project?.location || project?.lugar || '',
      tipo: project?.project_type || project?.tipo || 'catering' as any,
      estado: this.mapProjectStatusToLegacy(project?.status || 'draft') as any,
      fecha_recepcion: project?.created_at || project?.received_at || project?.fecha_recepcion || new Date().toISOString(),
      // Company fields
      nombre_empresa: project?.organization?.name || project?.company_name || '',
      email_empresa: project?.user?.email || project?.email || '',
      // Additional metadata
      backend_response: projectResponse // Store full response for debugging
    };
  },

  // ========================
  // PROPOSALS MANAGEMENT (New SaaS Structure)
  // ========================

  // Generate proposal using new SaaS structure
  async generateProposal(data: ProposalRequest): Promise<ProposalResponse> {
    try {
      // Convert legacy ProposalRequest to new ProposalGenerationRequest format
      const newProposalRequest: ProposalGenerationRequest = {
        project_id: data.rfx_id, // Map rfx_id to project_id
        confirmed_data: {
          client_name: 'Cliente', // Will be extracted from project data
          project_title: 'Propuesta', // Will be extracted from project data
          items: data.costs.map((cost, index) => ({
            name: `Item ${index + 1}`,
            quantity: 1,
            unit_price: cost
          }))
        },
        pricing_config: {
          currency: 'USD',
          tax_rate: 0.16,
          coordination_fee: 0.15,
          payment_terms: data.notes?.coordination || '50% adelanto, 50% contra entrega'
        }
      };

      const response = await fetch(`${API_BASE_URL}/api/proposals/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProposalRequest),
      });

      const proposalResponse = await handleResponse<ProposalGenerationResponse>(response);
      
      // Convert new proposal response to legacy format
      return this.convertProposalToLegacy(proposalResponse, data.rfx_id);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error generating proposal', 0, 'NETWORK_ERROR');
    }
  },

  // Get proposal by ID (new endpoint)
  async getProposalById(proposalId: string): Promise<ProposalResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}`);
      const proposalData = await handleResponse<ProposalGenerationResponse>(response);

      return this.convertProposalToLegacy(proposalData, proposalData.quote.id);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error fetching proposal', 0, 'NETWORK_ERROR');
    }
  },

  // Get all proposals/quotes
  async getProposalsList(): Promise<{ status: string; message: string; data: any[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/proposals/quotes`);
      const proposalsResponse = await handleResponse<ProposalListResponse>(response);
      
      return {
        status: proposalsResponse.status,
        message: proposalsResponse.message || 'Proposals loaded successfully',
        data: proposalsResponse.proposals
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error fetching proposals', 0, 'NETWORK_ERROR');
    }
  },

  // Convert new proposal response to legacy format
  convertProposalToLegacy(proposalResponse: ProposalGenerationResponse, rfxId: string): ProposalResponse {
    const quote = proposalResponse.quote;
    
    return {
      status: proposalResponse.status,
      message: proposalResponse.message || 'Proposal generated successfully',
      document_id: quote.id,
      pdf_url: undefined, // Not provided in new structure
      proposal: {
        id: quote.id,
        rfx_id: rfxId,
        content_html: quote.html_content,
        itemized_costs: quote.sections.flatMap(section => 
          section.items.map(item => ({
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal
          }))
        ),
        total_cost: quote.total_amount,
        notes: {
          modality: 'full_service', // Default
          modality_description: quote.complexity_level,
          coordination: quote.payment_terms,
          additional_notes: quote.recommendations.join(', ')
        },
        status: 'generated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          generation_metadata: proposalResponse.metadata,
          quote_number: quote.quote_number,
          valid_until: quote.valid_until,
          delivery_terms: quote.delivery_terms
        }
      },
      timestamp: new Date().toISOString()
    };
  },


  // ========================
  // OPTIMIZED PAGINATION (New Project Structure)
  // ========================

  // Get latest projects with optimized pagination
  async getLatestProjects(limit: number = 10): Promise<RFXLatestResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/recent?limit=${limit}`);
      const projectResponse = await handleResponse<ProjectListResponse>(response);
      
      // Convert to legacy RFXLatestResponse format
      const legacyData = projectResponse.projects ? projectResponse.projects.map(project => this.convertProjectToLegacyHistoryItem(project)) : [];
      
      return {
        status: projectResponse.status,
        message: projectResponse.message || 'Latest projects loaded successfully',
        data: legacyData,
        pagination: {
          offset: 0, // Projects API uses page-based pagination
          limit: projectResponse.pagination?.per_page || limit,
          total_items: projectResponse.total || 0,
          has_more: projectResponse.pagination?.has_more || false,
          next_offset: projectResponse.pagination?.has_more ? projectResponse.pagination.per_page : undefined
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof APIError) {
        // If it's a 404 or similar "not found" error, return empty data instead of throwing
        if (error.status === 404 || 
            error.message?.toLowerCase().includes('no') || 
            error.message?.toLowerCase().includes('not found')) {
          return {
            status: "success",
            message: "No projects found",
            data: [],
            pagination: {
              offset: 0,
              limit: limit,
              total_items: 0,
              has_more: false
            },
            timestamp: new Date().toISOString()
          };
        }
        throw error;
      }
      throw new APIError('Failed to load latest projects', 500);
    }
  },

  // Legacy getLatestRFX - redirects to new getLatestProjects
  async getLatestRFX(limit: number = 10): Promise<RFXLatestResponse> {
    console.log('🔄 Legacy getLatestRFX called, redirecting to new getLatestProjects API');
    return this.getLatestProjects(limit);
  },

  // Load more projects with offset-based pagination
  async loadMoreProjects(offset: number, limit: number = 10): Promise<RFXLatestResponse> {
    try {
      // Convert offset to page number for new API
      const page = Math.floor(offset / limit) + 1;
      const response = await fetch(`${API_BASE_URL}/api/projects/history?page=${page}&limit=${limit}`);
      const projectResponse = await handleResponse<ProjectListResponse>(response);
      
      // Convert to legacy format
      const legacyData = projectResponse.projects ? projectResponse.projects.map(project => this.convertProjectToLegacyHistoryItem(project)) : [];
      
      return {
        status: projectResponse.status,
        message: projectResponse.message || 'More projects loaded successfully',
        data: legacyData,
        pagination: {
          offset: offset,
          limit: projectResponse.pagination?.per_page || limit,
          total_items: projectResponse.total || 0,
          has_more: projectResponse.pagination?.has_more || false,
          next_offset: projectResponse.pagination?.has_more ? offset + limit : undefined
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof APIError) {
        // If it's a 404 or similar "not found" error, return empty data instead of throwing
        if (error.status === 404 || 
            error.message?.toLowerCase().includes('no') || 
            error.message?.toLowerCase().includes('not found')) {
          return {
            status: "success",
            message: "No more projects found",
            data: [],
            pagination: {
              offset: offset,
              limit: limit,
              total_items: 0,
              has_more: false
            },
            timestamp: new Date().toISOString()
          };
        }
        throw error;
      }
      throw new APIError('Failed to load more projects', 500);
    }
  },

  // Legacy loadMoreRFX - redirects to new loadMoreProjects
  async loadMoreRFX(offset: number, limit: number = 10): Promise<RFXLatestResponse> {
    console.log('🔄 Legacy loadMoreRFX called, redirecting to new loadMoreProjects API');
    return this.loadMoreProjects(offset, limit);
  },



  // ========================
  // PROJECT WORKFLOW MANAGEMENT (New SaaS Structure)
  // ========================

  // Finalize project (mark as completed) using new workflow system
  async finalizeProject(projectId: string): Promise<{ status: string; message: string; data: { id: string; estado: string } }> {
    try {
      // Use new workflow advancement endpoint
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/workflow/3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'complete' })
      });

      const workflowResponse = await handleResponse<ProjectWorkflowResponse>(response);
      
      return {
        status: workflowResponse.status,
        message: workflowResponse.message || 'Project finalized successfully',
        data: {
          id: projectId,
          estado: 'completed'
        }
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error finalizing project', 0, 'NETWORK_ERROR');
    }
  },

  // Legacy finalizeRFX - redirects to new finalizeProject
  async finalizeRFX(rfxId: string): Promise<{ status: string; message: string; data: { id: string; estado: string } }> {
    console.log('🔄 Legacy finalizeRFX called, redirecting to new finalizeProject API');
    return this.finalizeProject(rfxId);
  },

  // Get project workflow status
  async getProjectWorkflow(projectId: string): Promise<ProjectWorkflowResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/workflow`);
      return handleResponse<ProjectWorkflowResponse>(response);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error fetching project workflow', 0, 'NETWORK_ERROR');
    }
  },

  // Advance project workflow to next step
  async advanceProjectWorkflow(projectId: string, stepNumber: number): Promise<ProjectWorkflowResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/workflow/${stepNumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return handleResponse<ProjectWorkflowResponse>(response);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error advancing project workflow', 0, 'NETWORK_ERROR');
    }
  },

  // ========================
  // PROJECT DATA MANAGEMENT (New SaaS Structure)
  // ========================

  // Update project currency using new structure
  async updateProjectCurrency(projectId: string, currency: string): Promise<{ status: string; message: string; data: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/currency`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currency })
      });

      return handleResponse<{ status: string; message: string; data: any }>(response);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error updating project currency', 0, 'NETWORK_ERROR');
    }
  },

  // Legacy updateRFXCurrency - redirects to new updateProjectCurrency
  async updateRFXCurrency(rfxId: string, currency: string): Promise<{ status: string; message: string; data: any }> {
    console.log('🔄 Legacy updateRFXCurrency called, redirecting to new updateProjectCurrency API');
    return this.updateProjectCurrency(rfxId, currency);
  },

  // Update project data (general endpoint for any field updates)
  async updateProjectData(projectId: string, data: UpdateProjectDataRequest): Promise<{ status: string; message: string; data: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/data`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      return handleResponse<{ status: string; message: string; data: any }>(response);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error updating project data', 0, 'NETWORK_ERROR');
    }
  },


  // Get proposals for specific project
  async getProposalsByProject(projectId: string): Promise<{ status: string; message: string; data: any[] }> {
    try {
      // Filter proposals by project_id (this might need backend support)
      const response = await fetch(`${API_BASE_URL}/api/proposals/quotes?project_id=${projectId}`);
      const proposalsResponse = await handleResponse<ProposalListResponse>(response);
      
      return {
        status: proposalsResponse.status,
        message: proposalsResponse.message || 'Project proposals loaded successfully',
        data: proposalsResponse.proposals
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error fetching project proposals', 0, 'NETWORK_ERROR');
    }
  },

  // Legacy getProposalsByRFX - redirects to new getProposalsByProject
  async getProposalsByRFX(rfxId: string): Promise<{ status: string; message: string; data: any[] }> {
    console.log('🔄 Legacy getProposalsByRFX called, redirecting to new getProposalsByProject API');
    return this.getProposalsByProject(rfxId);
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

  // Update project items costs using new structure
  async updateProjectItemsCosts(projectId: string, itemsCosts: { id: string; unit_price: number }[]): Promise<{ status: string; message: string; data: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/items/costs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: itemsCosts }),
      });

      return handleResponse<{ status: string; message: string; data: any }>(response);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error updating project items costs', 0, 'NETWORK_ERROR');
    }
  },

  // Legacy updateProductCosts - redirects to new updateProjectItemsCosts
  async updateProductCosts(rfxId: string, productCosts: { product_id: string; unit_price: number }[]): Promise<{ status: string; message: string; data: any }> {
    console.log('🔄 Legacy updateProductCosts called, redirecting to new updateProjectItemsCosts API');
    
    // Convert legacy format to new format
    const itemsCosts = productCosts.map(cost => ({
      id: cost.product_id,
      unit_price: cost.unit_price
    }));
    
    return this.updateProjectItemsCosts(rfxId, itemsCosts);
  },

  // Update individual project field
  async updateProjectField(projectId: string, field: string, value: string): Promise<{ status: string; message: string; data: any }> {
    try {
      // Use the general data update endpoint with field-specific data
      const updateData = { [field]: value };
      return this.updateProjectData(projectId, updateData);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error updating project field', 0, 'NETWORK_ERROR');
    }
  },

  // Legacy updateRFXField - redirects to new updateProjectField
  async updateRFXField(rfxId: string, field: string, value: string): Promise<{ status: string; message: string; data: any }> {
    console.log('🔄 Legacy updateRFXField called, redirecting to new updateProjectField API');
    return this.updateProjectField(rfxId, field, value);
  },

  // Update individual project item field
  async updateProjectItemField(projectId: string, itemId: string, field: string, value: string | number): Promise<{ status: string; message: string; data: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/items/${itemId}`, {
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
      throw new APIError('Network error updating project item field', 0, 'NETWORK_ERROR');
    }
  },

  // Legacy updateProductField - redirects to new updateProjectItemField
  async updateProductField(rfxId: string, productId: string, field: string, value: string | number): Promise<{ status: string; message: string; data: any }> {
    console.log('🔄 Legacy updateProductField called, redirecting to new updateProjectItemField API');
    return this.updateProjectItemField(rfxId, productId, field, value);
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