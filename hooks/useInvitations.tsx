/**
 * useInvitations Hook
 * Handles organization invitations
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { 
  InviteMemberInput, 
  Invitation,
  AcceptInvitationResponse 
} from '@/types/organization';

export function useInvitations() {
  const router = useRouter();
  const [isInviting, setIsInviting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  /**
   * Invite a new member to organization (owner/admin)
   */
  const inviteMember = async (
    organizationId: string,
    data: InviteMemberInput
  ): Promise<Invitation> => {
    setIsInviting(true);
    
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/invitations`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify(data),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send invitation');
      }
      
      const result: Invitation = await response.json();
      
      toast.success('Invitation sent successfully', {
        description: `Invitation sent to ${data.email}`,
      });
      
      router.refresh();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send invitation';
      toast.error('Error sending invitation', {
        description: message,
      });
      throw error;
    } finally {
      setIsInviting(false);
    }
  };
  
  /**
   * Accept an invitation
   */
  const acceptInvitation = async (token: string): Promise<AcceptInvitationResponse> => {
    setIsAccepting(true);
    
    try {
      const response = await fetch(`/api/invitations/accept/${token}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to accept invitation');
      }
      
      const result: AcceptInvitationResponse = await response.json();
      
      toast.success('Welcome to the organization!', {
        description: `You are now a member of ${result.organization.name}`,
      });
      
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to accept invitation';
      toast.error('Error accepting invitation', {
        description: message,
      });
      throw error;
    } finally {
      setIsAccepting(false);
    }
  };
  
  /**
   * Decline an invitation
   */
  const declineInvitation = async (token: string): Promise<void> => {
    setIsProcessing(true);
    
    try {
      const response = await fetch(`/api/invitations/decline/${token}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to decline invitation');
      }
      
      toast.success('Invitation declined');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to decline invitation';
      toast.error('Error declining invitation', {
        description: message,
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Cancel a pending invitation (owner/admin)
   */
  const cancelInvitation = async (invitationId: string): Promise<void> => {
    setIsProcessing(true);
    
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel invitation');
      }
      
      toast.success('Invitation canceled');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel invitation';
      toast.error('Error canceling invitation', {
        description: message,
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Resend a pending invitation (owner/admin)
   */
  const resendInvitation = async (invitationId: string): Promise<void> => {
    setIsProcessing(true);
    
    try {
      const response = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to resend invitation');
      }
      
      toast.success('Invitation resent successfully');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resend invitation';
      toast.error('Error resending invitation', {
        description: message,
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  
  return {
    inviteMember,
    acceptInvitation,
    declineInvitation,
    cancelInvitation,
    resendInvitation,
    isInviting,
    isAccepting,
    isProcessing,
  };
}
