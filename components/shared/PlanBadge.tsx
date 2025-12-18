/**
 * PlanBadge Component
 * Displays organization plan tier with black & white styling
 */

import { Badge } from '@/components/ui/badge';
import { PLAN_LABELS, PLAN_COLORS } from '@/constants/organization';
import type { PlanTier } from '@/types/organization';
import { cn } from '@/lib/utils';

interface PlanBadgeProps {
  plan: PlanTier;
  className?: string;
  showLabel?: boolean;
}

export function PlanBadge({ plan, className, showLabel = true }: PlanBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-medium uppercase tracking-wide',
        PLAN_COLORS[plan],
        className
      )}
    >
      {showLabel && PLAN_LABELS[plan]}
    </Badge>
  );
}
