/**
 * RoleBadge Component
 * Displays user role in organization with black & white styling
 */

import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS, ROLE_COLORS } from '@/constants/organization';
import type { OrganizationRole } from '@/types/organization';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: OrganizationRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-medium uppercase tracking-wide',
        ROLE_COLORS[role],
        className
      )}
    >
      {ROLE_LABELS[role]}
    </Badge>
  );
}
