/**
 * Organizations API Service
 * Handles all organization-related API calls
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

export interface OrganizationPlan {
  tier: 'free' | 'starter' | 'pro' | 'enterprise';
  name: string;
  max_users: number;
  max_rfx_per_month: number;
  credits_per_month: number;
  price_monthly_usd: number;
  features: string[];
  free_regenerations: number | 'unlimited';
}

export interface OrganizationUsage {
  users: {
    current: number;
    limit: number;
    can_add_more: boolean;
  };
  rfx_this_month: {
    current: number;
    limit: number;
    can_create_more: boolean;
  };
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  trial_ends_at: string | null;
  created_at: string;
  plan: OrganizationPlan;
  usage: OrganizationUsage;
}

export interface OrganizationMember {
  id: string;
  email: string;
  full_name: string;
  username: string | null;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export interface UpgradeInfo {
  current_plan: {
    tier: string;
    name: string;
    max_users: number;
    max_rfx_per_month: number;
    credits_per_month: number;
    price_monthly_usd: number;
  };
  upgrade_available: boolean;
  next_plan: {
    tier: string;
    name: string;
    max_users: number;
    max_rfx_per_month: number;
    credits_per_month: number;
    price_monthly_usd: number;
  } | null;
  benefits: string[];
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get current user's organization
 * GET /api/organization/current
 */
export async function getCurrentOrganization(): Promise<Organization> {
  const response = await fetch(`${API_BASE_URL}/api/organization/current`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('User must belong to an organization');
    }
    throw new Error(`Failed to fetch organization: ${response.statusText}`);
  }

  // Get response text first to debug JSON parsing issues
  const responseText = await response.text();
  
  try {
    // WORKAROUND: Replace JavaScript Infinity with "unlimited" string
    // Backend should fix this by returning "unlimited" instead of Infinity
    const fixedText = responseText.replace(/:\s*Infinity\s*,/g, ': "unlimited",');
    
    // Try to parse JSON
    const data = JSON.parse(fixedText);
    return data.data;
  } catch (error) {
    console.error('Failed to parse JSON response:', responseText);
    console.error('Parse error:', error);
    throw new Error(`Invalid JSON response from server: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get organization members
 * GET /api/organization/members
 */
export async function getOrganizationMembers(): Promise<OrganizationMember[]> {
  const response = await fetch(`${API_BASE_URL}/api/organization/members`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch members: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get available plans (public endpoint)
 * GET /api/organization/plans
 */
export async function getAvailablePlans(): Promise<OrganizationPlan[]> {
  const response = await fetch(`${API_BASE_URL}/api/organization/plans`, {
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
 * Get upgrade information
 * GET /api/organization/upgrade-info
 */
export async function getUpgradeInfo(): Promise<UpgradeInfo> {
  const response = await fetch(`${API_BASE_URL}/api/organization/upgrade-info`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch upgrade info: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Update organization information (name, slug)
 * PATCH /api/organization/current
 * Permissions: owner, admin
 */
export async function updateOrganization(updates: {
  name?: string;
  slug?: string;
}): Promise<Organization> {
  const response = await fetch(`${API_BASE_URL}/api/organization/current`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to update organization: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Change member role
 * PATCH /api/organization/members/{user_id}/role
 * Permissions: owner, admin (only owners can assign owner role)
 */
export async function updateMemberRole(userId: string, role: 'owner' | 'admin' | 'member'): Promise<OrganizationMember> {
  const response = await fetch(`${API_BASE_URL}/api/organization/members/${userId}/role`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to update member role: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Remove member from organization
 * DELETE /api/organization/members/{user_id}
 * Permissions: owner, admin
 */
export async function removeMember(userId: string): Promise<{ removed_user_id: string; removed_user_email: string }> {
  const response = await fetch(`${API_BASE_URL}/api/organization/members/${userId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to remove member: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Invite user to organization
 * POST /api/organization/invite
 * Permissions: owner, admin (only owners can invite owners)
 */
export async function inviteMember(email: string, role: 'admin' | 'member'): Promise<{
  email: string;
  role: string;
  user_id?: string;
  note?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/organization/invite`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ email, role }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to invite member: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user can add more members
 */
export function canAddMoreMembers(organization: Organization): boolean {
  return organization.usage.users.can_add_more;
}

/**
 * Check if user can create more RFX
 */
export function canCreateMoreRFX(organization: Organization): boolean {
  return organization.usage.rfx_this_month.can_create_more;
}

/**
 * Get plan display name
 */
export function getPlanDisplayName(tier: string): string {
  const names: Record<string, string> = {
    free: 'Free Plan',
    starter: 'Starter Plan',
    pro: 'Professional Plan',
    enterprise: 'Enterprise Plan',
  };
  return names[tier] || tier;
}

/**
 * Get plan color for badges
 */
export function getPlanColor(tier: string): string {
  const colors: Record<string, string> = {
    free: 'gray',
    starter: 'blue',
    pro: 'purple',
    enterprise: 'gold',
  };
  return colors[tier] || 'gray';
}
