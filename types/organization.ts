/**
 * Types for Organization System
 * AI-RFX Frontend
 */

// ============================================================================
// ENUMS
// ============================================================================

export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';
export type OrganizationRole = 'owner' | 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

// ============================================================================
// ORGANIZATION
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  
  // Plan & Billing
  plan_tier: PlanTier;
  billing_email: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  
  // Limits
  max_users: number | null; // null = unlimited
  max_rfx_per_month: number | null; // null = unlimited (Legacy check, prefer credits)
  credits_total: number;
  credits_used: number;
  
  // Branding
  primary_color?: string;
  secondary_color?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  owner_id: string;
}

// ============================================================================
// ORGANIZATION MEMBER
// ============================================================================

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  
  // User info (populated from join)
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar_url?: string;
    username?: string;
  };
  
  // Metadata
  joined_at: string;
  invited_by?: string;
}

// ============================================================================
// INVITATION
// ============================================================================

export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: OrganizationRole;
  token: string;
  status: InvitationStatus;
  
  // Relations
  organization: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    plan_tier: PlanTier;
  };
  
  invited_by: {
    id: string;
    name: string;
    email: string;
  };
  
  // Metadata
  created_at: string;
  expires_at: string;
  accepted_at?: string;
}

// ============================================================================
// PLAN CONFIGURATION
// ============================================================================

export interface PlanLimits {
  max_users: number | null;
  max_rfx_per_month: number | null; // Legacy/Estimate
  credits_per_month: number;
  max_file_size_mb: number;
  max_storage_gb: number | null;
  custom_branding: boolean;
  advanced_analytics: boolean;
  google_integrations: boolean;
  priority_support: boolean;
  white_label: boolean;
  sso: boolean;
}

export interface PlanConfig {
  id: PlanTier;
  name: string;
  price: number | null; // null = custom pricing
  priceLabel: string; // "$49/mo" or "Custom"
  features: string[];
  limits: PlanLimits;
  popular?: boolean;
  tier?: number; // Added for plan hierarchy comparison
}

// ============================================================================
// PERMISSIONS
// ============================================================================

export interface RolePermissions {
  canManageOrganization: boolean;
  canManageMembers: boolean;
  canManageBilling: boolean;
  canManageBranding: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canChangeRoles: boolean;
  canDeleteOrganization: boolean;
  canViewAnalytics: boolean;
  canCreateRFX: boolean;
  canEditAllRFX: boolean;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  plan_tier: PlanTier;
  billing_email: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  slug?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  billing_email?: string;
}

export interface InviteMemberInput {
  email: string;
  role: OrganizationRole;
}

export interface UpdateMemberRoleInput {
  role: OrganizationRole;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface CreateOrganizationResponse {
  organization: Organization;
  stripe_checkout_url: string;
}

export interface AcceptInvitationResponse {
  organization: Organization;
  member: OrganizationMember;
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface OrganizationContextType {
  // Current state
  organization: Organization | null;
  membership: OrganizationMember | null;
  
  // Computed permissions
  permissions: RolePermissions;
  isOwner: boolean;
  isAdmin: boolean;
  canManageMembers: boolean;
  canManageBilling: boolean;
  
  // Actions
  switchOrganization: (orgId: string) => Promise<void>;
  leaveOrganization: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
  
  // Loading states
  isLoading: boolean;
}

// ============================================================================
// USAGE & ANALYTICS
// ============================================================================

export interface OrganizationUsage {
  organization_id: string;
  period_start: string;
  period_end: string;
  
  // Usage metrics
  rfx_count: number;
  storage_used_gb: number;
  active_users: number;
  
  // Limits
  rfx_limit: number | null;
  storage_limit_gb: number | null;
  users_limit: number | null;
}

export interface UsageMetrics {
  current: number;
  limit: number | null;
  percentage: number;
  isNearLimit: boolean; // > 80%
  isAtLimit: boolean; // >= 100%
}

// ============================================================================
// UPGRADE INFO
// ============================================================================

export interface UpgradeInfo {
  current_plan: {
    tier: PlanTier;
    name: string;
    credits_per_month: number;
    max_rfx_per_month: number | null;
    max_users: number | null;
  };
  next_plan: {
    tier: PlanTier;
    name: string;
    credits_per_month: number;
    max_rfx_per_month: number | null;
    max_users: number | null;
  } | null;
  benefits: string[];
}
