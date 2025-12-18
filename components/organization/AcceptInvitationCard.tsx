/**
 * AcceptInvitationCard Component
 * Card for accepting or declining organization invitations
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertCircle, PartyPopper } from 'lucide-react';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { PlanBadge } from '@/components/shared/PlanBadge';
import { useInvitations } from '@/hooks/useInvitations';
import type { Invitation } from '@/types/organization';

interface Props {
  invitation: Invitation;
  hasPersonalPlan: boolean;
}

export function AcceptInvitationCard({ invitation, hasPersonalPlan }: Props) {
  const router = useRouter();
  const { acceptInvitation, declineInvitation, isAccepting, isProcessing } = useInvitations();
  const [isDeclined, setIsDeclined] = useState(false);
  
  const handleAccept = async () => {
    try {
      await acceptInvitation(invitation.token);
      router.push('/settings/organization/general');
    } catch (error) {
      console.error('Failed to accept invitation:', error);
    }
  };
  
  const handleDecline = async () => {
    try {
      await declineInvitation(invitation.token);
      setIsDeclined(true);
    } catch (error) {
      console.error('Failed to decline invitation:', error);
    }
  };
  
  if (isDeclined) {
    return (
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-5xl mb-4">👋</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Invitation Declined
        </h2>
        <p className="text-gray-600 mb-6">
          You've declined the invitation to join {invitation.organization.name}
        </p>
        <Button 
          onClick={() => router.push('/dashboard')}
          variant="outline"
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }
  
  const orgInitials = invitation.organization.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
  
  return (
    <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8">
      {/* Header Icon */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <PartyPopper className="w-8 h-8 text-gray-700" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          You're Invited!
        </h1>
        <p className="text-gray-600">
          {invitation.invited_by.name || invitation.invited_by.email} invited you to join their organization
        </p>
      </div>
      
      {/* Organization Info */}
      <div className="border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={invitation.organization.logo_url} />
            <AvatarFallback className="bg-black text-white text-lg">
              {orgInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {invitation.organization.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <PlanBadge plan={invitation.organization.plan_tier} />
            </div>
          </div>
        </div>
        
        <div className="pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            You'll join as:
          </p>
          <RoleBadge role={invitation.role} />
        </div>
      </div>
      
      {/* Warning about personal plan */}
      {hasPersonalPlan && (
        <Alert className="mb-6 border-gray-300 bg-gray-50">
          <AlertCircle className="h-4 w-4 text-gray-600" />
          <AlertDescription className="text-sm text-gray-700">
            <p className="font-medium">Your personal plan will be canceled</p>
            <p className="mt-1">
              You'll receive a prorated refund for any unused days.
            </p>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleDecline}
          disabled={isAccepting || isProcessing}
          className="flex-1"
        >
          Decline
        </Button>
        <Button
          onClick={handleAccept}
          disabled={isAccepting || isProcessing}
          className="flex-1 bg-black hover:bg-gray-800 text-white"
        >
          {isAccepting ? 'Accepting...' : 'Accept Invitation'}
        </Button>
      </div>
      
      {/* Footer */}
      <p className="text-xs text-gray-500 text-center mt-6">
        This invitation will expire in{' '}
        {Math.ceil((new Date(invitation.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}{' '}
        days
      </p>
    </div>
  );
}
