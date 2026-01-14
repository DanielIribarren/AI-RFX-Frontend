/**
 * PendingInvitationCard Component
 * Individual pending invitation card with actions
 */

'use client';

import { Button } from '@/components/ui/button';
import { Mail, RefreshCw, X } from 'lucide-react';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { useInvitations } from '@/hooks/useInvitations';
import type { Invitation } from '@/types/organization';

interface Props {
  invitation: Invitation;
  canManage: boolean;
}

export function PendingInvitationCard({ invitation, canManage }: Props) {
  const { cancelInvitation, resendInvitation, isProcessing } = useInvitations();
  
  const handleResend = async () => {
    try {
      await resendInvitation(invitation.id);
    } catch (error) {
      console.error('Failed to resend invitation:', error);
    }
  };
  
  const handleCancel = async () => {
    try {
      await cancelInvitation(invitation.id);
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
    }
  };
  
  const daysUntilExpiry = Math.ceil(
    (new Date(invitation.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  
  return (
    <div className="p-4 flex items-center justify-between hover:bg-secondary transition-colors">
      <div className="flex items-center gap-3 flex-1">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-full flex items-center justify-center">
          <Mail className="w-5 h-5 text-muted-foreground" />
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {invitation.email}
          </p>
          <p className="text-sm text-muted-foreground">
            Invited by {invitation.invited_by.name || invitation.invited_by.email}
            {' • '}
            Expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}
          </p>
        </div>
        
        {/* Role Badge */}
        <RoleBadge role={invitation.role} />
      </div>
      
      {/* Actions */}
      {canManage && (
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={isProcessing}
            className="border-input"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Resend
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isProcessing}
            className="text-destructive hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
