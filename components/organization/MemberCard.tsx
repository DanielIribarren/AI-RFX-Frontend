/**
 * MemberCard Component
 * Individual member card with role and actions
 */

'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserCog, UserMinus } from 'lucide-react';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { ChangeRoleModal } from './ChangeRoleModal';
import { RemoveMemberModal } from './RemoveMemberModal';
import type { OrganizationMember, OrganizationRole } from '@/types/organization';

interface Props {
  member: OrganizationMember;
  organizationId: string;
  currentUserRole: OrganizationRole;
  canManage: boolean;
}

export function MemberCard({ member, organizationId, currentUserRole, canManage }: Props) {
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  
  const isOwner = member.role === 'owner';
  const canChangeRole = currentUserRole === 'owner' && !isOwner;
  const canRemove = canManage && !isOwner;
  
  const initials = member.user.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || member.user.email[0].toUpperCase();
  
  return (
    <>
      <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3 flex-1">
          {/* Avatar */}
          <Avatar className="h-10 w-10">
            <AvatarImage src={member.user.avatar_url} alt={member.user.name || ''} />
            <AvatarFallback className="bg-gray-200 text-gray-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {member.user.name || 'Unknown'}
            </p>
            <p className="text-sm text-gray-600 truncate">
              {member.user.email}
            </p>
          </div>
          
          {/* Role Badge */}
          <RoleBadge role={member.role} />
        </div>
        
        {/* Actions Menu */}
        {(canChangeRole || canRemove) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canChangeRole && (
                <DropdownMenuItem onClick={() => setIsChangeRoleModalOpen(true)}>
                  <UserCog className="h-4 w-4 mr-2" />
                  Change Role
                </DropdownMenuItem>
              )}
              {canRemove && (
                <DropdownMenuItem 
                  onClick={() => setIsRemoveModalOpen(true)}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Remove Member
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      {/* Modals */}
      <ChangeRoleModal
        member={member}
        organizationId={organizationId}
        isOpen={isChangeRoleModalOpen}
        onClose={() => setIsChangeRoleModalOpen(false)}
      />
      
      <RemoveMemberModal
        member={member}
        organizationId={organizationId}
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
      />
    </>
  );
}
