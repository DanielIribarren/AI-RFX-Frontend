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

      // Fetch credits info (getCreditsInfo handles token internally)
      const creditsData = await getCreditsInfo();
      setCredits(creditsData);
    } catch (err) {
      console.error('❌ CreditsContext: Error fetching credits:', err);
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
   * Initial load - Only fetch if user is authenticated
   */
  useEffect(() => {
    // ✅ CORS FIX: Only fetch credits if token exists
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        refreshCredits();
      } else {
        console.log('⏭️ CreditsContext: Skipping initial fetch (no token)');
        setIsLoading(false);
      }
    }
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
