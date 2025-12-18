/**
 * EmptyState Component
 * Displays empty state with icon, title, description and optional action
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center py-12 px-4',
      className
    )}>
      {/* Icon */}
      <div className="text-5xl mb-4 text-gray-400">
        {icon}
      </div>
      
      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-sm text-gray-600 max-w-md mb-6">
        {description}
      </p>
      
      {/* Optional Action */}
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}
