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
    console.log('🔄 CreditsContext: Starting refreshCredits...');
    
    try {
      setIsLoading(true);
      setError(null);

      // ✅ Verificar token antes de hacer la llamada
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      console.log('🔑 CreditsContext: Token exists?', !!token);

      // Fetch credits info (getCreditsInfo handles token internally)
      console.log('📡 CreditsContext: Calling getCreditsInfo()...');
      const creditsData = await getCreditsInfo();
      
      console.log('✅ CreditsContext: Credits fetched successfully:', {
        creditsData,
        keys: Object.keys(creditsData),
        values: {
          total: creditsData.credits_total,
          used: creditsData.credits_used,
          available: creditsData.credits_available,
          percentage: creditsData.credits_percentage,
          plan: creditsData.plan_tier
        }
      });
      
      setCredits(creditsData);
    } catch (err) {
      console.error('❌ CreditsContext: Error fetching credits:', err);
      console.error('❌ CreditsContext: Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err.message : 'Failed to fetch credits');
    } finally {
      setIsLoading(false);
      console.log('🏁 CreditsContext: refreshCredits completed');
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
