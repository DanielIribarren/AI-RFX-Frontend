/**
 * InviteMemberModal Component
 * Modal for inviting new members to organization
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/constants/organization';
import type { OrganizationRole } from '@/types/organization';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InviteMemberModal({ organizationId, isOpen, onClose }: Props) {
  const { inviteMember, isInviting } = useOrganizationMembers(organizationId);
  
  const { 
    register, 
    handleSubmit, 
    setValue,
    watch,
    reset,
    formState: { errors } 
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'member',
    },
  });
  
  const selectedRole = watch('role');
  
  const onSubmit = async (data: FormData) => {
    try {
      await inviteMember(data.email, data.role);
      reset();
      onClose();
    } catch (error) {
      // Error already handled by hook
      console.error('Failed to invite member:', error);
    }
  };
  
  const handleClose = () => {
    if (!isInviting) {
      reset();
      onClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your organization
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              {...register('email')}
              type="email"
              placeholder="colleague@example.com"
              className="mt-1"
              disabled={isInviting}
              autoFocus
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>
          
          {/* Role Selection */}
          <div>
            <Label htmlFor="role">Role *</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setValue('role', value as 'admin' | 'member')}
              disabled={isInviting}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{ROLE_LABELS.member}</span>
                    <span className="text-xs text-muted-foreground">
                      {ROLE_DESCRIPTIONS.member}
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{ROLE_LABELS.admin}</span>
                    <span className="text-xs text-muted-foreground">
                      {ROLE_DESCRIPTIONS.admin}
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive mt-1">{errors.role.message}</p>
            )}
          </div>
          
          {/* Role Description */}
          <div className="bg-secondary border border rounded-lg p-3">
            <p className="text-sm text-gray-700">
              <span className="font-medium">{ROLE_LABELS[selectedRole as OrganizationRole]}:</span>{' '}
              {ROLE_DESCRIPTIONS[selectedRole as OrganizationRole]}
            </p>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isInviting}
              className="bg-primary hover:bg-primary-dark text-primary-foreground shadow-sm"
            >
              {isInviting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
