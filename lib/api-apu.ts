import { API_BASE_URL, fetchWithAuth } from "@/lib/api-client";

async function handleJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail =
      typeof payload?.error === "string"
        ? payload.error
        : payload?.message || response.statusText;
    throw new Error(detail || "APU request failed");
  }
  return payload.data as T;
}

export interface APUGenerateRequest {
  rfx_id: string;
  tasa_bcv?: number;
  pct_costos_indirectos?: number;
  pct_utilidad?: number;
}

export interface APUResult {
  rfx_id: string;
  excel_url: string;
  excel_storage_path: string;
  prompt_version: string;
  llm_attempts: number;
  warnings: string[];
  partidas_count: number;
}

export const apuApi = {
  async generate(input: APUGenerateRequest): Promise<APUResult> {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/apu/generate`, {
      method: "POST",
      body: JSON.stringify(input),
    });
    return handleJsonResponse<APUResult>(response);
  },

  /**
   * Fetch the most recent persisted APU for an RFX. Returns null when the RFX
   * exists but has never generated an APU — distinguish from network errors.
   */
  async getLatest(rfxId: string): Promise<APUResult | null> {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/apu/${rfxId}`);
    if (response.status === 404) {
      return null;
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.message || "Failed to load APU");
    }
    return (payload?.data ?? null) as APUResult | null;
  },
};
