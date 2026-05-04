import { API_BASE_URL, fetchWithAuth } from "@/lib/api-client";

async function handleJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || response.statusText || "Request failed");
  }
  return payload.data as T;
}

export type SalesStage =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "payment_pending"
  | "partially_paid"
  | "confirmed"
  | "in_execution"
  | "completed"
  | "cancelled";

export interface BusinessUnit {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  industry_context: string;
  brand_name?: string;
  brand_tagline?: string;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  accent_color?: string;
  support_email?: string;
  support_phone?: string;
  website_url?: string;
  is_default: boolean;
  is_active: boolean;
}

export interface CatalogItem {
  id: string;
  business_unit_id: string;
  organization_id: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  pricing_model: string;
  base_price_usd: number;
  is_active: boolean;
}

export interface ClientRecord {
  id: string | null;
  name: string;
  email?: string;
  phone?: string;
  industry?: string;
  opportunities_count: number;
  last_activity_at?: string;
  contacts: Array<{
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    position?: string;
  }>;
}

export interface Opportunity {
  id: string;
  title: string;
  sales_stage: SalesStage;
  origin_channel: string;
  industry_context: string;
  business_unit_id?: string | null;
  client: {
    id?: string;
    name: string;
    email?: string;
    industry?: string;
  };
  contact?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  proposal?: {
    id?: string | null;
    proposal_code?: string | null;
    public_token?: string | null;
    public_visibility?: string | null;
    commercial_status?: string | null;
    sent_at?: string | null;
    accepted_at?: string | null;
    total_cost?: number;
    public_view_count?: number;
    public_last_viewed_at?: string | null;
  };
  service?: {
    service_start_at?: string | null;
    service_end_at?: string | null;
    service_location?: string | null;
  };
  created_at?: string;
  updated_at?: string;
}

export interface PaymentMethod {
  id: string;
  business_unit_id: string;
  method_type: string;
  display_name: string;
  account_holder?: string;
  bank_name?: string;
  phone?: string;
  national_id?: string;
  email?: string;
  account_number?: string;
  instructions?: string;
  sort_order: number;
  is_active: boolean;
}

export interface PaymentSubmission {
  id: string;
  proposal_id: string;
  status: "submitted" | "confirmed" | "rejected";
  amount_usd: number;
  amount_ves?: number;
  exchange_rate?: number;
  payer_name?: string;
  payer_email?: string;
  payment_reference?: string;
  proof_file_url?: string;
  submitted_at: string;
  confirmed_at?: string;
  payment_methods?: PaymentMethod;
}

export interface OpportunityDetail extends Opportunity {
  description?: string;
  requirements?: string;
  products: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit?: string;
    estimated_unit_price?: number;
    unit_cost?: number;
  }>;
  payments?: PaymentSubmission[];
  payment_summary?: {
    contract_total_usd: number;
    confirmed_total_usd: number;
    submitted_total_usd: number;
    remaining_total_usd: number;
    is_fully_paid: boolean;
  };
  proposal_readiness_issues?: string[];
  can_publish_proposal?: boolean;
}

export interface ExchangeRateSnapshot {
  provider: string;
  rate_type: string;
  rate: number;
  fetched_at: string;
  expires_at?: string;
  is_stale: boolean;
}

export interface PublicProposalData {
  proposal: {
    id: string;
    content_html: string;
    total_cost: number;
    public_token: string;
    pricing_snapshot?: {
      reference_total_usd?: number;
    };
  };
  opportunity: {
    id: string;
    title: string;
    description?: string;
    requirements?: string;
    sales_stage: SalesStage;
    client: Record<string, any>;
    contact: Record<string, any>;
    service_start_at?: string;
    service_end_at?: string;
    service_location?: string;
  };
  business_unit?: BusinessUnit | null;
  payment_methods: PaymentMethod[];
  acceptance?: {
    accepted_name: string;
    accepted_at: string;
  } | null;
  payments: PaymentSubmission[];
  payment_summary: {
    contract_total_usd: number;
    confirmed_total_usd: number;
    submitted_total_usd: number;
    remaining_total_usd: number;
    is_fully_paid: boolean;
  };
  exchange_rate: ExchangeRateSnapshot;
  pricing: {
    contract_total_usd: number;
    equivalent_total_ves: number;
    display_note: string;
  };
}

export const budyApi = {
  async getBusinessUnits(): Promise<BusinessUnit[]> {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/business-units`);
    return handleJsonResponse(response);
  },

  async createBusinessUnit(payload: Partial<BusinessUnit>): Promise<BusinessUnit> {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/business-units`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return handleJsonResponse(response);
  },

  async updateBusinessUnit(id: string, payload: Partial<BusinessUnit>): Promise<BusinessUnit> {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/business-units/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return handleJsonResponse(response);
  },

  async getCatalogItems(businessUnitId?: string): Promise<CatalogItem[]> {
    const suffix = businessUnitId ? `?business_unit_id=${encodeURIComponent(businessUnitId)}` : "";
    const response = await fetchWithAuth(`${API_BASE_URL}/api/catalog-items${suffix}`);
    return handleJsonResponse(response);
  },

  async createCatalogItem(payload: Partial<CatalogItem>): Promise<CatalogItem> {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/catalog-items`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return handleJsonResponse(response);
  },

  async updateCatalogItem(id: string, payload: Partial<CatalogItem>): Promise<CatalogItem> {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/catalog-items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return handleJsonResponse(response);
  },

  async deleteCatalogItem(id: string): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/catalog-items/${id}`, {
      method: "DELETE",
    });
    await handleJsonResponse(response);
  },

  async getClients(search?: string): Promise<ClientRecord[]> {
    const suffix = search ? `?search=${encodeURIComponent(search)}` : "";
    const response = await fetchWithAuth(`${API_BASE_URL}/api/clients${suffix}`);
    return handleJsonResponse(response);
  },

  async createClient(payload: Record<string, any>): Promise<Record<string, any>> {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/clients`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return handleJsonResponse(response);
  },

  async getPaymentMethods(businessUnitId?: string): Promise<PaymentMethod[]> {
    const suffix = businessUnitId ? `?business_unit_id=${encodeURIComponent(businessUnitId)}` : "";
    const response = await fetchWithAuth(`${API_BASE_URL}/api/payment-methods${suffix}`);
    return handleJsonResponse(response);
  },

  async createPaymentMethod(payload: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/payment-methods`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return handleJsonResponse(response);
  },

  async updatePaymentMethod(id: string, payload: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/payment-methods/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return handleJsonResponse(response);
  },

  async deletePaymentMethod(id: string): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/payment-methods/${id}`, {
      method: "DELETE",
    });
    await handleJsonResponse(response);
  },

  async getOpportunities(filters?: { business_unit_id?: string; sales_stage?: string }): Promise<Opportunity[]> {
    const params = new URLSearchParams();
    if (filters?.business_unit_id) params.set("business_unit_id", filters.business_unit_id);
    if (filters?.sales_stage) params.set("sales_stage", filters.sales_stage);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const response = await fetchWithAuth(`${API_BASE_URL}/api/opportunities${suffix}`);
    return handleJsonResponse(response);
  },

  async getOpportunity(id: string): Promise<OpportunityDetail> {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/opportunities/${id}`);
    return handleJsonResponse(response);
  },

  async updateOpportunity(id: string, payload: Record<string, any>): Promise<OpportunityDetail> {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/opportunities/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return handleJsonResponse(response);
  },

  async publishProposal(proposalId: string, payload: Record<string, any>): Promise<Record<string, any>> {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/proposals/${proposalId}/publish`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return handleJsonResponse(response);
  },

  async confirmPayment(paymentId: string): Promise<Record<string, any>> {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/payments/${paymentId}/confirm`, {
      method: "POST",
    });
    return handleJsonResponse(response);
  },

  async getCurrentBCVRate(forceRefresh: boolean = false): Promise<ExchangeRateSnapshot> {
    const suffix = forceRefresh ? "?force_refresh=true" : "";
    const response = await fetch(`${API_BASE_URL}/api/exchange-rates/bcv/current${suffix}`);
    return handleJsonResponse(response);
  },

  async getPublicProposal(token: string): Promise<PublicProposalData> {
    const response = await fetch(`${API_BASE_URL}/api/public/proposals/${token}`);
    return handleJsonResponse(response);
  },

  async acceptPublicProposal(token: string, payload: { accepted_name: string; accepted_email?: string }): Promise<Record<string, any>> {
    const response = await fetch(`${API_BASE_URL}/api/public/proposals/${token}/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return handleJsonResponse(response);
  },

  async submitPublicPayment(token: string, formData: FormData): Promise<Record<string, any>> {
    const response = await fetch(`${API_BASE_URL}/api/public/proposals/${token}/payments`, {
      method: "POST",
      body: formData,
    });
    return handleJsonResponse(response);
  },
};

export const SALES_STAGE_LABELS: Record<SalesStage, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  accepted: "Accepted",
  payment_pending: "Payment pending",
  partially_paid: "Partially paid",
  confirmed: "Confirmed",
  in_execution: "In execution",
  completed: "Completed",
  cancelled: "Cancelled",
};
