'use client';

import { useCredits } from '@/contexts/CreditsContext';
import { Gem, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Badge simple para mostrar créditos disponibles
 * Principio KISS: Solo muestra número y cambia color si están bajos
 */
export function CreditsBadge() {
  const { credits, isLoading } = useCredits();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!credits) return null;

  const isLow = credits.credits_percentage < 20;
  const isMedium = credits.credits_percentage < 50 && credits.credits_percentage >= 20;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
        isLow && "bg-red-50 text-red-700 border border-red-200",
        isMedium && "bg-yellow-50 text-yellow-700 border border-yellow-200",
        !isLow && !isMedium && "bg-green-50 text-green-700 border border-green-200"
      )}
    >
      <Gem className="h-4 w-4" />
      <span>{credits.credits_available} créditos</span>
    </div>
  );
}
