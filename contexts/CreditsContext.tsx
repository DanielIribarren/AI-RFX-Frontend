'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCreditsInfo, type CreditsInfo } from '@/lib/api-credits';

// ============================================================================
// TYPES
// ============================================================================

interface CreditsContextType {
  // State
  credits: CreditsInfo | null;
  isLoading: boolean;
  error: string | null;
  
  // Methods
  refreshCredits: () => Promise<void>;
  checkCredits: (required: number) => boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState<CreditsInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch credits from API
   */
  const refreshCredits = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get token from localStorage
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No authentication token found');
        setIsLoading(false);
        return;
      }

      // Fetch credits info
      const creditsData = await getCreditsInfo(token);
      setCredits(creditsData);
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch credits');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check if user has sufficient credits (optimistic check)
   */
  const checkCredits = useCallback((required: number): boolean => {
    if (!credits) return false;
    return credits.credits_available >= required;
  }, [credits]);

  /**
   * Initial load
   */
  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  const value: CreditsContextType = {
    credits,
    isLoading,
    error,
    refreshCredits,
    checkCredits,
  };

  return (
    <CreditsContext.Provider value={value}>
      {children}
    </CreditsContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to use credits context
 * @throws Error if used outside CreditsProvider
 */
export function useCredits(): CreditsContextType {
  const context = useContext(CreditsContext);
  
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  
  return context;
}
