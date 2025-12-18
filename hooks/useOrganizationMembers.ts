/**
 * useOrganizationMembers Hook
 * Handles member management operations (change role, remove, invite)
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
import type { OrganizationRole } from '@/types/organization';

export function useOrganizationMembers() {
  const router = useRouter();
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  
  /**
   * Change member role
   * PATCH /api/organization/members/{user_id}/role
   */
  const changeRole = async (
    userId: string,
    newRole: OrganizationRole,
    memberName: string
  ): Promise<void> => {
    setIsChangingRole(true);
    
    try {
      await updateMemberRoleAPI(userId, newRole);
      
      toast.success('Role updated successfully', {
        description: `${memberName} is now ${newRole}`,
      });
      
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update role';
      toast.error('Error updating role', {
        description: message,
      });
      throw error;
    } finally {
      setIsChangingRole(false);
    }
  };
  
  /**
   * Remove member from organization
   * DELETE /api/organization/members/{user_id}
   */
  const removeMember = async (
    userId: string,
    memberName: string
  ): Promise<void> => {
    setIsRemoving(true);
    
    try {
      await removeMemberAPI(userId);
      
      toast.success('Member removed successfully', {
        description: `${memberName} has been removed from the organization`,
      });
      
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
  const inviteMember = async (
    email: string,
    role: 'admin' | 'member'
  ): Promise<void> => {
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
  
  return {
    changeRole,
    removeMember,
    inviteMember,
    isChangingRole,
    isRemoving,
    isInviting,
  };
}
