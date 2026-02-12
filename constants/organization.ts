/**
 * Organization Constants
 * AI-RFX Frontend
 */

import type { PlanConfig, RolePermissions, OrganizationRole } from '@/types/organization';

// ============================================================================
// PLAN CONFIGURATIONS
// ============================================================================

export const PLANS: Record<string, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: 'Free',
    tier: 1, // Added tier for hierarchy
    features: [
      '100 credits/mo (~10 RFX)',
      '1 user (Individual)',
      'Basic Chat',
      '5 MB file limit',
      'Email support (48-72h)',
    ],
    limits: {
      max_users: 1,
      max_rfx_per_month: 10, // Estimate
      credits_per_month: 100,
      max_file_size_mb: 5,
      max_storage_gb: 1,
      custom_branding: false,
      advanced_analytics: false,
      google_integrations: false,
      priority_support: false,
      white_label: false,
      sso: false,
    },
  },

  starter: {
    id: 'starter',
    name: 'Starter',
    price: 49,
    priceLabel: '$49',
    tier: 2, // Added tier for hierarchy
    features: [
      '500 credits/mo (~50 RFX)',
      '2 users',
      'Full Chat + Attachments',
      '20 MB file limit',
      'Custom Branding',
      'Email support (24h)',
    ],
    limits: {
      max_users: 2,
      max_rfx_per_month: 50, // Estimate
      credits_per_month: 500,
      max_file_size_mb: 20,
      max_storage_gb: 10,
      custom_branding: true,
      advanced_analytics: false,
      google_integrations: false,
      priority_support: false,
      white_label: false,
      sso: false,
    },
  },
  
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 99,
    priceLabel: '$99',
    tier: 3, // Added tier for hierarchy
    features: [
      '1,500 credits/mo (~150 RFX)',
      '5 users',
      'Advanced Chat',
      '50 MB file limit',
      'Advanced Analytics',
      'Google Integrations',
      'Priority support (<4h)',
    ],
    limits: {
      max_users: 5,
      max_rfx_per_month: 150, // Estimate
      credits_per_month: 1500,
      max_file_size_mb: 50,
      max_storage_gb: 50,
      custom_branding: true,
      advanced_analytics: true,
      google_integrations: true,
      priority_support: true,
      white_label: false,
      sso: false,
    },
    popular: true,
  },
  
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    priceLabel: 'Custom',
    tier: 4, // Added tier for hierarchy - highest tier
    features: [
      '5,000+ credits/mo',
      'Unlimited users',
      'White-label solution',
      '100 MB file limit',
      'API Access & SSO',
      'Dedicated Support 24/7',
    ],
    limits: {
      max_users: null, // unlimited
      max_rfx_per_month: null, // unlimited
      credits_per_month: 5000,
      max_file_size_mb: 100,
      max_storage_gb: null, // unlimited
      custom_branding: true,
      advanced_analytics: true,
      google_integrations: true,
      priority_support: true,
      white_label: true,
      sso: true,
    },
  },
};

// ============================================================================
// ROLE PERMISSIONS
// ============================================================================

export const ROLE_PERMISSIONS: Record<OrganizationRole, RolePermissions> = {
  owner: {
    canManageOrganization: true,
    canManageMembers: true,
    canManageBilling: true,
    canManageBranding: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canChangeRoles: true,
    canDeleteOrganization: true,
    canViewAnalytics: true,
    canCreateRFX: true,
    canEditAllRFX: true,
  },
  
  admin: {
    canManageOrganization: false,
    canManageMembers: true,
    canManageBilling: false,
    canManageBranding: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canChangeRoles: false, // Only owner can change roles
    canDeleteOrganization: false,
    canViewAnalytics: true,
    canCreateRFX: true,
    canEditAllRFX: true,
  },
  
  member: {
    canManageOrganization: false,
    canManageMembers: false,
    canManageBilling: false,
    canManageBranding: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canChangeRoles: false,
    canDeleteOrganization: false,
    canViewAnalytics: false,
    canCreateRFX: true,
    canEditAllRFX: false, // Can only edit own RFX
  },
};

// ============================================================================
// ROLE DISPLAY
// ============================================================================

export const ROLE_LABELS: Record<OrganizationRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

export const ROLE_DESCRIPTIONS: Record<OrganizationRole, string> = {
  owner: 'Full access to all organization settings and billing',
  admin: 'Can manage members and all RFX, but cannot access billing',
  member: 'Can create and manage their own RFX',
};

// ============================================================================
// PLAN DISPLAY
// ============================================================================

export const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

// ============================================================================
// LIMITS & THRESHOLDS
// ============================================================================

export const USAGE_THRESHOLDS = {
  WARNING: 0.8, // 80% - Show warning
  CRITICAL: 0.95, // 95% - Show critical alert
  MAX: 1.0, // 100% - At limit
} as const;

export const INVITATION_EXPIRY_DAYS = 7;

// ============================================================================
// VALIDATION
// ============================================================================

export const ORGANIZATION_VALIDATION = {
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 50,
  SLUG_MIN_LENGTH: 3,
  SLUG_MAX_LENGTH: 50,
  SLUG_PATTERN: /^[a-z0-9-]+$/,
} as const;

// ============================================================================
// COLORS (Brand Theme)
// ============================================================================

export const ROLE_COLORS: Record<OrganizationRole, string> = {
  owner: 'bg-primary text-primary-foreground border-primary',
  admin: 'bg-primary/80 text-primary-foreground border-primary/80',
  member: 'bg-accent-light text-primary border-primary/20',
};

export const PLAN_COLORS: Record<string, string> = {
  free: 'bg-muted text-muted-foreground border-border',
  starter: 'bg-accent-light text-primary border-primary/20',
  pro: 'bg-primary text-primary-foreground border-primary',
  enterprise: 'bg-primary-dark text-primary-foreground border-primary-dark',
};

export const STATUS_COLORS = {
  active: 'bg-primary text-primary-foreground',
  pending: 'bg-amber-100 text-amber-800',
  suspended: 'bg-destructive/10 text-destructive',
  invited: 'bg-accent-light text-primary',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get permissions for a role
 */
export function getPermissionsForRole(role: OrganizationRole): RolePermissions {
  return ROLE_PERMISSIONS[role];
}

/**
 * Get plan configuration
 */
export function getPlanConfig(planTier: string): PlanConfig | undefined {
  return PLANS[planTier];
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  role: OrganizationRole,
  permission: keyof RolePermissions
): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

/**
 * Calculate usage percentage
 */
export function calculateUsagePercentage(current: number, max: number | null): number {
  if (max === null) return 0; // Unlimited
  return Math.min((current / max) * 100, 100);
}

/**
 * Check if usage is near limit
 */
export function isNearLimit(current: number, max: number | null): boolean {
  if (max === null) return false;
  const percentage = current / max;
  return percentage >= USAGE_THRESHOLDS.WARNING;
}

/**
 * Check if usage is at limit
 */
export function isAtLimit(current: number, max: number | null): boolean {
  if (max === null) return false;
  return current >= max;
}

/**
 * Generate slug from name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  return (
    slug.length >= ORGANIZATION_VALIDATION.SLUG_MIN_LENGTH &&
    slug.length <= ORGANIZATION_VALIDATION.SLUG_MAX_LENGTH &&
    ORGANIZATION_VALIDATION.SLUG_PATTERN.test(slug)
  );
}
