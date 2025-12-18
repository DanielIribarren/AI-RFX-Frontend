/**
 * Credits API Service
 * Handles all credit-related API calls
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Helper function to get auth headers with JWT token
// Works in both Server Components (cookies) and Client Components (localStorage)
async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Client-side: use localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } 
  // Server-side: use cookies (Next.js Server Components)
  else {
    // Import cookies dynamically only on server
    try {
      const { cookies } = require('next/headers');
      const cookieStore = await cookies();
      const token = cookieStore.get('access_token')?.value;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from cookies:', error);
    }
  }
  
  return headers;
}

// ============================================================================
// TYPES
// ============================================================================

export interface CreditsInfo {
  credits_total: number;
  credits_used: number;
  credits_available: number;
  credits_percentage: number;
  reset_date: string;
  plan_tier: string;
}

export interface CreditTransaction {
  id: string;
  organization_id: string;
  user_id: string | null;
  amount: number;
  type: 'complete' | 'extraction' | 'generation' | 'regeneration' | 'chat_message' | 'monthly_reset';
  description: string;
  rfx_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface RegenerationInfo {
  rfx_id: string;
  has_free_regeneration: boolean;
  free_regenerations_used: number;
  free_regenerations_limit: number;
  regeneration_count: number;
  plan_tier: string;
  message: string;
}

export interface PlanInfo {
  tier: string;
  name: string;
  max_users: number | string;
  max_rfx_per_month: number | string;
  credits_per_month: number | string;
  price_monthly_usd: number;
  free_regenerations: number | string;
  features: string[];
}

export interface CreditCosts {
  extraction: number;
  generation: number;
  complete: number;
  chat_message: number;
  regeneration: number;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get current credits information for the authenticated user
 */
export async function getCreditsInfo(): Promise<CreditsInfo> {
  const response = await fetch(`${API_BASE_URL}/api/credits/info`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch credits info: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get credit transaction history
 * GET /api/credits/history
 */
export async function getCreditHistory(
  limit: number = 50,
  offset: number = 0
): Promise<CreditTransaction[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/credits/history?limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
      headers: await getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch credit history: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get regeneration info for a specific RFX
 * GET /api/credits/regenerations/:rfx_id
 */
export async function getRegenerationInfo(
  rfxId: string
): Promise<RegenerationInfo> {
  const response = await fetch(
    `${API_BASE_URL}/api/credits/regenerations/${rfxId}`,
    {
      method: 'GET',
      headers: await getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch regeneration info: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get all available plans
 * GET /api/credits/plans
 */
export async function getAvailablePlans(): Promise<PlanInfo[]> {
  const response = await fetch(`${API_BASE_URL}/api/credits/plans`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch plans: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get specific plan details
 * GET /api/credits/plan/:tier
 */
export async function getPlanDetails(tier: string): Promise<PlanInfo> {
  const response = await fetch(`${API_BASE_URL}/api/credits/plan/${tier}`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Plan not found: ${tier}`);
    }
    throw new Error(`Failed to fetch plan details: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get credit costs for operations
 * GET /api/credits/costs
 */
export async function getCreditCosts(): Promise<CreditCosts> {
  const response = await fetch(`${API_BASE_URL}/api/credits/costs`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch credit costs: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Check if user has sufficient credits for an operation
 * Local helper function (optimistic check)
 */
export function hasSufficientCredits(
  creditsAvailable: number,
  requiredCredits: number
): boolean {
  return creditsAvailable >= requiredCredits;
}

/**
 * Calculate credits needed for operation
 * Helper function
 */
export function calculateCreditsNeeded(
  operationType: 'complete' | 'extraction' | 'generation' | 'chat_message' | 'regeneration',
  costs: CreditCosts
): number {
  return costs[operationType];
}
