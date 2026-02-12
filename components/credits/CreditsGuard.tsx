'use client';

import { useState } from 'react';
import { useCreditsVerification } from '@/hooks/use-credits-verification';
import { LowCreditsAlert } from './LowCreditsAlert';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { CreditCosts } from '@/lib/api-credits';

interface CreditsGuardProps {
  operation: keyof CreditCosts;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onUpgradeClick?: () => void;
}

/**
 * Guard simple que verifica créditos antes de mostrar children
 * Principio KISS: Si no hay créditos → muestra alerta, si hay → muestra children
 */
export function CreditsGuard({ 
  operation, 
  children, 
  fallback,
  onUpgradeClick 
}: CreditsGuardProps) {
  const { canPerformOperation, getOperationCost, credits, isLoading } = useCreditsVerification();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (isLoading || !credits) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const hasCredits = canPerformOperation(operation);
  const requiredCredits = getOperationCost(operation);

  if (!hasCredits) {
    const handleUpgrade = () => {
      if (onUpgradeClick) {
        onUpgradeClick();
      } else {
        setShowUpgrade(true);
      }
    };

    return (
      <>
        {fallback || (
          <div className="space-y-4 p-6 border border-red-200 rounded-lg bg-red-50">
            <LowCreditsAlert
              currentCredits={credits.credits_available}
              requiredCredits={requiredCredits}
            />
            <Button 
              onClick={handleUpgrade} 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Ver Planes
            </Button>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
