/**
 * LimitIndicator Component
 * Shows usage progress with visual indicator (black & white theme)
 */

'use client';

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateUsagePercentage, isNearLimit, isAtLimit } from '@/constants/organization';

interface LimitIndicatorProps {
  current: number;
  max: number | null; // null = unlimited
  label: string;
  className?: string;
}

export function LimitIndicator({ current, max, label, className }: LimitIndicatorProps) {
  // Unlimited case
  if (max === null) {
    return (
      <div className={cn('text-sm text-gray-600', className)}>
        <span className="font-medium">{current}</span> {label} • <span className="text-gray-500">Unlimited</span>
      </div>
    );
  }
  
  const percentage = calculateUsagePercentage(current, max);
  const nearLimit = isNearLimit(current, max);
  const atLimit = isAtLimit(current, max);
  
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between text-sm">
        <span className={cn(
          'font-medium',
          atLimit && 'text-gray-900',
          nearLimit && !atLimit && 'text-gray-700'
        )}>
          {current} / {max} {label}
        </span>
        <span className="text-gray-600">{percentage.toFixed(0)}%</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            atLimit && 'bg-gray-900',
            nearLimit && !atLimit && 'bg-gray-600',
            !nearLimit && 'bg-gray-400'
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {/* Warning Messages */}
      {atLimit && (
        <div className="flex items-start gap-2 text-sm text-gray-900">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            You've reached your {label} limit. Upgrade to add more.
          </p>
        </div>
      )}
      
      {nearLimit && !atLimit && (
        <div className="flex items-start gap-2 text-sm text-gray-700">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Approaching your {label} limit. Consider upgrading soon.
          </p>
        </div>
      )}
    </div>
  );
}
