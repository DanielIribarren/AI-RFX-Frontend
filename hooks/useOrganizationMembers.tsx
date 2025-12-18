/**
 * useOrganizationMembers Hook
 * Handles organization members management using new API endpoints
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  updateMemberRole as updateMemberRoleAPI,
  removeMember as removeMemberAPI,
  inviteMember as inviteMemberAPI
} from '@/lib/api-organizations';
import type { OrganizationRole, OrganizationMember } from '@/types/organization';

export function useOrganizationMembers(organizationId: string) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  
  /**
   * Change member role
   * PATCH /api/organization/members/{user_id}/role
   */
  const changeRole = async (
    userId: string, 
    newRole: OrganizationRole
  ): Promise<OrganizationMember> => {
    setIsUpdating(true);
    
    try {
      const result = await updateMemberRoleAPI(userId, newRole);
      
      toast.success('Member role updated successfully', {
        description: `Role changed to ${newRole}`,
      });
      
      router.refresh();
      return result as unknown as OrganizationMember;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change member role';
      toast.error('Error updating member role', {
        description: message,
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };
  
  /**
   * Remove member from organization
   * DELETE /api/organization/members/{user_id}
   */
  const removeMember = async (userId: string): Promise<void> => {
    setIsRemoving(true);
    
    try {
      await removeMemberAPI(userId);
      
      toast.success('Member removed successfully');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove member';
      toast.error('Error removing member', {
        description: message,
      });
      throw error;
    } finally {
      setIsRemoving(false);
    }
  };
  
  /**
   * Invite new member to organization
   * POST /api/organization/invite
   */
  const inviteMember = async (email: string, role: 'admin' | 'member'): Promise<void> => {
    setIsInviting(true);
    
    try {
      const result = await inviteMemberAPI(email, role);
      
      if (result.user_id) {
        // User was added immediately (already exists)
        toast.success('Member added successfully', {
          description: `${email} has been added to your organization`,
        });
      } else {
        // Invitation sent (user needs to register)
        toast.info('Invitation pending', {
          description: result.note || 'User needs to register first',
        });
      }
      
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to invite member';
      toast.error('Error inviting member', {
        description: message,
      });
      throw error;
    } finally {
      setIsInviting(false);
    }
  };
  
  /**
   * Leave organization (member self-removal)
   */
  const leaveOrganization = async (): Promise<void> => {
    setIsRemoving(true);
    
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/leave`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to leave organization');
      }
      
      toast.success('You have left the organization');
      router.push('/settings/organization');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to leave organization';
      toast.error('Error leaving organization', {
        description: message,
      });
      throw error;
    } finally {
      setIsRemoving(false);
    }
  };
  
  return {
    changeRole,
    removeMember,
    inviteMember,
    leaveOrganization,
    isUpdating,
    isRemoving,
    isInviting,
  };
}
