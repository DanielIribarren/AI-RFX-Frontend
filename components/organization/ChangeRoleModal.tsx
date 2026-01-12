/**
 * ChangeRoleModal Component
 * Modal for changing a member's role
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/constants/organization';
import type { OrganizationMember, OrganizationRole } from '@/types/organization';

interface Props {
  member: OrganizationMember;
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ChangeRoleModal({ member, organizationId, isOpen, onClose }: Props) {
  const { changeRole, isChangingRole } = useOrganizationMembers();
  const [selectedRole, setSelectedRole] = useState<OrganizationRole>(member.role);
  
  const handleSubmit = async () => {
    if (selectedRole === member.role) {
      onClose();
      return;
    }
    
    try {
      await changeRole(member.user_id, selectedRole, member.user.name || member.user.email);
      onClose();
    } catch (error) {
      // Error already handled by hook
      console.error('Failed to change role:', error);
    }
  };
  
  const handleClose = () => {
    if (!isChangingRole) {
      setSelectedRole(member.role);
      onClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Member Role</DialogTitle>
          <DialogDescription>
            Update the role for {member.user.name || member.user.email}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Role */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Current role:</span>{' '}
              {ROLE_LABELS[member.role]}
            </p>
          </div>
          
          {/* New Role Selection */}
          <div>
            <Label htmlFor="role">New Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as OrganizationRole)}
              disabled={isChangingRole}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{ROLE_LABELS.member}</span>
                    <span className="text-xs text-gray-500">
                      {ROLE_DESCRIPTIONS.member}
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{ROLE_LABELS.admin}</span>
                    <span className="text-xs text-gray-500">
                      {ROLE_DESCRIPTIONS.admin}
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Role Description */}
          {selectedRole !== member.role && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <span className="font-medium">{ROLE_LABELS[selectedRole]}:</span>{' '}
                {ROLE_DESCRIPTIONS[selectedRole]}
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isChangingRole}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={handleSubmit}
            disabled={isChangingRole || selectedRole === member.role}
            className="bg-black hover:bg-gray-800 text-white"
          >
            {isChangingRole ? 'Updating...' : 'Update Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
