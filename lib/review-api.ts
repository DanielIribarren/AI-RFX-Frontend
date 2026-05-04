const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export type ReviewEntityType = "rfx" | "session";

export interface ReviewConfirmPricingConfig {
  coordination_enabled?: boolean;
  coordination_rate?: number;
  coordination_level?: string;
  cost_per_person_enabled?: boolean;
  headcount?: number;
  taxes_enabled?: boolean;
  tax_rate?: number;
  tax_name?: string;
  tax_type?: string;
}

export interface ReviewConfirmOptions {
  businessUnitId?: string | null;
  pricingConfig?: ReviewConfirmPricingConfig | null;
}

const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const parseJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

export const getReviewState = async (id: string, entityType: ReviewEntityType = "rfx") => {
  const primaryUrl =
    entityType === "session"
      ? `${API_BASE_URL}/api/rfx/session/${id}/review/state`
      : `${API_BASE_URL}/api/rfx/${id}/review/state`;

  let response = await fetch(primaryUrl, { method: "GET", headers: getAuthHeaders() });
  let json = await parseJson(response);

  if (!response.ok && response.status === 404 && entityType === "rfx") {
    const fallbackUrl = `${API_BASE_URL}/api/rfx/session/${id}/review/state`;
    response = await fetch(fallbackUrl, { method: "GET", headers: getAuthHeaders() });
    json = await parseJson(response);
  }

  if (!response.ok) {
    throw new Error((json as any)?.message || `Error ${response.status} loading review state`);
  }

  return json as any;
};

export const confirmReview = async (
  id: string,
  entityType: ReviewEntityType = "rfx",
  options?: string | null | ReviewConfirmOptions,
) => {
  const primaryUrl =
    entityType === "session"
      ? `${API_BASE_URL}/api/rfx/session/${id}/review/confirm`
      : `${API_BASE_URL}/api/rfx/${id}/review/confirm`;

  const payload =
    typeof options === "string" || options === null
      ? (options ? { business_unit_id: options } : {})
      : {
          ...(options?.businessUnitId ? { business_unit_id: options.businessUnitId } : {}),
          ...(options?.pricingConfig ? { pricing_config: options.pricingConfig } : {}),
        };

  const body = JSON.stringify(payload);

  let response = await fetch(primaryUrl, { method: "POST", headers: getAuthHeaders(), body });
  let json = await parseJson(response);

  if (!response.ok && response.status === 404 && entityType === "rfx") {
    const fallbackUrl = `${API_BASE_URL}/api/rfx/session/${id}/review/confirm`;
    response = await fetch(fallbackUrl, { method: "POST", headers: getAuthHeaders(), body });
    json = await parseJson(response);
  }

  if (!response.ok) {
    throw new Error((json as any)?.message || `Error ${response.status} confirming review`);
  }

  return json as any;
};
