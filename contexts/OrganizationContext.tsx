'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentOrganization, type Organization } from '@/lib/api-organizations';

interface OrganizationContextType {
  organization: Organization | null;
  isLoading: boolean;
  error: string | null;
  refreshOrganization: () => Promise<void>;
  canAddMoreMembers: () => boolean;
  canCreateMoreRFX: () => boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshOrganization = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getCurrentOrganization();
      setOrganization(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch organization';
      setError(errorMessage);
      console.error('Error fetching organization:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const canAddMoreMembers = useCallback((): boolean => {
    if (!organization) return false;
    return organization.usage.users.can_add_more;
  }, [organization]);

  const canCreateMoreRFX = useCallback((): boolean => {
    if (!organization) return false;
    return organization.usage.rfx_this_month.can_create_more;
  }, [organization]);

  useEffect(() => {
    refreshOrganization();
  }, [refreshOrganization]);

  const value: OrganizationContextType = {
    organization,
    isLoading,
    error,
    refreshOrganization,
    canAddMoreMembers,
    canCreateMoreRFX,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization(): OrganizationContextType {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
