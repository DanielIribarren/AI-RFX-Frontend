/**
 * RemoveMemberModal Component
 * Confirmation modal for removing a member
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import type { OrganizationMember } from '@/types/organization';

interface Props {
  member: OrganizationMember;
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RemoveMemberModal({ member, organizationId, isOpen, onClose }: Props) {
  const { removeMember, isRemoving } = useOrganizationMembers(organizationId);
  
  const handleRemove = async () => {
    try {
      await removeMember(member.user_id);
      onClose();
    } catch (error) {
      // Error already handled by hook
      console.error('Failed to remove member:', error);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Remove Member
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this member?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Member Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="font-medium text-gray-900">
              {member.user.name || 'Unknown'}
            </p>
            <p className="text-sm text-gray-600">{member.user.email}</p>
          </div>
          
          {/* Warning */}
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-sm text-red-800">
              <p className="font-medium mb-1">This action will:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Remove their access to the organization</li>
                <li>Remove them from all shared RFX</li>
                <li>This action cannot be undone</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isRemoving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleRemove}
            disabled={isRemoving}
            className="bg-red-600 hover:bg-red-700"
          >
            {isRemoving ? 'Removing...' : 'Remove Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
