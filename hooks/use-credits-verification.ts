'use client';

import { useEffect, useState } from 'react';
import { useCredits } from '@/contexts/CreditsContext';
import { getCreditCosts, type CreditCosts } from '@/lib/api-credits';

/**
 * Hook simple para verificar si hay créditos suficientes antes de operaciones
 * Principio KISS: Solo verifica y retorna boolean, sin lógica compleja
 */
export function useCreditsVerification() {
  const { credits, checkCredits } = useCredits();
  const [costs, setCosts] = useState<CreditCosts | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCreditCosts()
      .then(setCosts)
      .catch(err => console.error('Error loading credit costs:', err))
      .finally(() => setIsLoading(false));
  }, []);

  /**
   * Verifica si se puede realizar una operación
   */
  const canPerformOperation = (operation: keyof CreditCosts): boolean => {
    if (!costs || !credits) return false;
    return checkCredits(costs[operation]);
  };

  /**
   * Obtiene el costo de una operación
   */
  const getOperationCost = (operation: keyof CreditCosts): number => {
    return costs?.[operation] || 0;
  };

  return {
    canPerformOperation,
    getOperationCost,
    credits,
    costs,
    isLoading,
  };
}
