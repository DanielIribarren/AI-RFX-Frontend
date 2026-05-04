'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentOrganization, type Organization } from '@/lib/api-organizations';
import { budyApi, type BusinessUnit } from '@/lib/api-budy';

const getBusinessUnitStorageKey = (organizationId: string) => `budy.activeBusinessUnitId.${organizationId}`;

interface OrganizationContextType {
  organization: Organization | null;
  businessUnits: BusinessUnit[];
  activeBusinessUnitId: string | null;
  isLoading: boolean;
  isBusinessUnitsLoading: boolean;
  error: string | null;
  refreshOrganization: () => Promise<void>;
  refreshBusinessUnits: () => Promise<void>;
  setActiveBusinessUnitId: (id: string | null) => void;
  canAddMoreMembers: () => boolean;
  canCreateMoreRFX: () => boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [activeBusinessUnitId, setActiveBusinessUnitIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusinessUnitsLoading, setIsBusinessUnitsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncActiveBusinessUnit = useCallback((units: BusinessUnit[], organizationId: string) => {
    const fallbackId = units.find((unit) => unit.is_default)?.id || units[0]?.id || null;

    if (typeof window === 'undefined') {
      setActiveBusinessUnitIdState(fallbackId);
      return;
    }

    const storedValue = localStorage.getItem(getBusinessUnitStorageKey(organizationId));
    const nextValue = units.some((unit) => unit.id === storedValue) ? storedValue : fallbackId;
    setActiveBusinessUnitIdState(nextValue);

    if (nextValue) {
      localStorage.setItem(getBusinessUnitStorageKey(organizationId), nextValue);
    }
  }, []);

  const refreshBusinessUnits = useCallback(async () => {
    if (!organization?.id) {
      setBusinessUnits([]);
      setActiveBusinessUnitIdState(null);
      return;
    }

    try {
      setIsBusinessUnitsLoading(true);
      const units = await budyApi.getBusinessUnits();
      setBusinessUnits(units);
      syncActiveBusinessUnit(units, organization.id);
    } catch (err) {
      console.error('Error fetching business units:', err);
      setBusinessUnits([]);
      setActiveBusinessUnitIdState(null);
    } finally {
      setIsBusinessUnitsLoading(false);
    }
  }, [organization?.id, syncActiveBusinessUnit]);

  const refreshOrganization = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getCurrentOrganization();
      setOrganization(data);
      if (!data?.id) {
        setBusinessUnits([]);
        setActiveBusinessUnitIdState(null);
        return;
      }
      setIsBusinessUnitsLoading(true);
      const units = await budyApi.getBusinessUnits();
      setBusinessUnits(units);
      syncActiveBusinessUnit(units, data.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch organization';
      setError(errorMessage);
      console.error('Error fetching organization:', err);
      setBusinessUnits([]);
      setActiveBusinessUnitIdState(null);
    } finally {
      setIsBusinessUnitsLoading(false);
      setIsLoading(false);
    }
  }, [syncActiveBusinessUnit]);

  const setActiveBusinessUnitId = useCallback((id: string | null) => {
    setActiveBusinessUnitIdState(id);

    if (typeof window !== 'undefined' && organization?.id) {
      const storageKey = getBusinessUnitStorageKey(organization.id);
      if (id) {
        localStorage.setItem(storageKey, id);
      } else {
        localStorage.removeItem(storageKey);
      }
    }
  }, [organization?.id]);

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
    businessUnits,
    activeBusinessUnitId,
    isLoading,
    isBusinessUnitsLoading,
    error,
    refreshOrganization,
    refreshBusinessUnits,
    setActiveBusinessUnitId,
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
