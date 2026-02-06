'use client';

/**
 * Client wrapper for Organization General Settings
 * Uses CreditsContext to fetch credits info client-side
 */

import { useEffect, useState } from 'react';
import { CreditsUsageCard } from '@/components/credits/CreditsUsageCard';
import { useCredits } from '@/contexts/CreditsContext';

interface OrganizationGeneralClientProps {
  organizationId: string;
  planTier: string;
}

export function OrganizationGeneralClient({ 
  organizationId, 
  planTier 
}: OrganizationGeneralClientProps) {
  const { credits, isLoading, error } = useCredits();

  // ✅ Debug logging detallado
  console.log('🔍 OrganizationGeneralClient - Props:', { organizationId, planTier });
  console.log('🔍 OrganizationGeneralClient - Credits State:', { 
    credits, 
    isLoading, 
    error,
    hasCredits: !!credits,
    creditsKeys: credits ? Object.keys(credits) : []
  });

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="animate-pulse bg-gray-100 h-32 rounded-lg" />
      </div>
    );
  }

  if (error) {
    console.error('❌ Credits error:', error);
    return (
      <div className="w-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">
            Error loading credits: {error}
          </p>
        </div>
      </div>
    );
  }

  if (!credits) {
    console.warn('⚠️ No credits data available');
    return (
      <div className="w-full">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-600">
            No credits information available. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  // Map API fields to component props
  // API returns: credits_total, credits_used, credits_available, reset_date, plan_tier
  return (
    <div className="w-full">
      <CreditsUsageCard 
        creditsTotal={credits.credits_total}
        creditsUsed={credits.credits_used}
        resetDate={credits.reset_date}
        planName={credits.plan_tier}
      />
    </div>
  );
}
