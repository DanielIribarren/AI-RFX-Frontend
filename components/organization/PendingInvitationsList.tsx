/**
 * PendingInvitationsList Component
 * List of pending invitations with actions
 */

'use client';

import { PendingInvitationCard } from './PendingInvitationCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Mail } from 'lucide-react';
import type { Invitation } from '@/types/organization';

interface Props {
  invitations: Invitation[];
  canManage: boolean;
}

export function PendingInvitationsList({ invitations, canManage }: Props) {
  if (invitations.length === 0) {
    return null;
  }
  
  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Pending Invitations ({invitations.length})
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Invitations waiting to be accepted
        </p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {invitations.map((invitation) => (
          <PendingInvitationCard
            key={invitation.id}
            invitation={invitation}
            canManage={canManage}
          />
        ))}
      </div>
    </div>
  );
}
