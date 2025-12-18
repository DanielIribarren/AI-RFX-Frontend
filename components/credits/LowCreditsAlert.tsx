import Link from 'next/link';
import { AlertCircle, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LowCreditsAlertProps {
  currentCredits: number;
  requiredCredits: number;
  className?: string;
  variant?: 'compact' | 'full';
}

export function LowCreditsAlert({ 
  currentCredits, 
  requiredCredits, 
  className,
  variant = 'full'
}: LowCreditsAlertProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 border border-gray-200 bg-gray-50 text-sm text-gray-900 rounded-md",
      variant === 'compact' ? "p-2" : "p-4",
      className
    )}>
      {variant === 'full' && (
        <div className="bg-white p-2 rounded-full border border-gray-100 shadow-sm">
          <Gem className="h-4 w-4 text-gray-900" />
        </div>
      )}
      
      {variant === 'compact' && (
        <AlertCircle className="h-4 w-4 text-gray-500 shrink-0" />
      )}

      <div className="flex-1">
        <p className="font-medium">
          Insufficient credits
        </p>
        <p className="text-gray-500 text-xs mt-0.5">
          Required: {requiredCredits} | Available: {currentCredits}
        </p>
      </div>

      <Link 
        href="/pricing"
        className="text-xs font-semibold underline underline-offset-2 hover:text-gray-600 whitespace-nowrap"
      >
        Get credits
      </Link>
    </div>
  );
}
