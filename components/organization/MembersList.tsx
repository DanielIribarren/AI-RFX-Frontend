/**
 * MembersList Component
 * List of organization members with actions
 */

'use client';

import { MemberCard } from './MemberCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Users } from 'lucide-react';
import type { OrganizationMember, OrganizationRole } from '@/types/organization';

interface Props {
  members: OrganizationMember[];
  organizationId: string;
  currentUserRole: OrganizationRole;
  canManage: boolean;
}

export function MembersList({ members, organizationId, currentUserRole, canManage }: Props) {
  if (members.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title="No members yet"
        description="Invite team members to start collaborating"
      />
    );
  }
  
  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Members ({members.length})
        </h2>
      </div>
      
      <div className="divide-y divide-gray-200">
        {members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            organizationId={organizationId}
            currentUserRole={currentUserRole}
            canManage={canManage}
          />
        ))}
      </div>
    </div>
  );
}
