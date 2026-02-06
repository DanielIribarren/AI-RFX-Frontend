/**
 * Organization General Settings Page
 * General configuration, plan info, members management, and danger zone
 */

// Force dynamic rendering - this page requires authentication
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { OrganizationGeneralSettings } from '@/components/organization/OrganizationGeneralSettings';
import { DangerZone } from '@/components/organization/DangerZone';
import { MembersList } from '@/components/organization/MembersList';
import { PendingInvitationsList } from '@/components/organization/PendingInvitationsList';
import { InviteMemberButton } from '@/components/organization/InviteMemberButton';
import { LimitIndicator } from '@/components/shared/LimitIndicator';
import { getCurrentOrganization, getOrganizationMembers } from '@/lib/api-organizations';
import { OrganizationGeneralClient } from './OrganizationGeneralClient';

async function getOrganizationData() {
  try {
    // ✅ Fetch organization and members from server (no JWT needed - uses cookies)
    // ❌ Credits info moved to client-side (requires JWT from localStorage)
    const [organization, apiMembers] = await Promise.all([
      getCurrentOrganization(),
      getOrganizationMembers(),
    ]);

    // Find current user's membership (assuming first owner/admin is current user)
    const currentUserMembership = apiMembers.find(m => m.role === 'owner') || apiMembers[0];

    // Transform API members to match component interface
    const members = apiMembers.map(member => ({
      id: member.id,
      organization_id: organization.id,
      user_id: member.id,
      role: member.role,
      user: {
        id: member.id,
        name: member.full_name,
        email: member.email,
        avatar_url: undefined, // TODO: Add avatar support if needed
      },
      joined_at: member.created_at,
    }));

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        plan_tier: organization.plan.tier,
        billing_email: '', // TODO: Add to API if needed
        max_users: organization.plan.max_users,
        max_rfx_per_month: organization.plan.max_rfx_per_month,
        credits_total: 0, // Will be loaded client-side
        credits_used: 0, // Will be loaded client-side
        created_at: organization.created_at,
        updated_at: organization.created_at, // Using created_at as fallback
        owner_id: currentUserMembership?.id || '',
      },
      membership: {
        id: currentUserMembership?.id || '',
        organization_id: organization.id,
        user_id: currentUserMembership?.id || '',
        role: currentUserMembership?.role || 'member' as const,
        user: {
          id: currentUserMembership?.id || '',
          name: currentUserMembership?.full_name || '',
          email: currentUserMembership?.email || '',
        },
        joined_at: currentUserMembership?.created_at || new Date().toISOString(),
      },
      members,
      pendingInvitations: [], // TODO: Add pending invitations API endpoint
      currentMemberCount: members.length,
    };
  } catch (error) {
    console.error('Error fetching organization data:', error);
    
    // If user doesn't have organization, redirect to create page
    if (error instanceof Error && error.message.includes('must belong to an organization')) {
      redirect('/settings/organization');
    }
    
    throw error;
  }
}

export default async function OrganizationGeneralPage() {
  const { organization, membership, members, pendingInvitations, currentMemberCount } = await getOrganizationData();
  
  const isOwner = membership.role === 'owner';
  const canEdit = isOwner;
  const canInvite = membership.role === 'owner' || membership.role === 'admin';
  const canManageMembers = membership.role === 'owner' || membership.role === 'admin';
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="w-full">
        <h1 className="text-2xl font-bold text-gray-900">General Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your organization details and plan
        </p>
      </div>
      
      {/* General Information */}
      <div className="w-full">
        <OrganizationGeneralSettings 
          organization={organization}
          canEdit={canEdit}
        />
      </div>
      
      {/* Credits Usage - Client-side component with JWT */}
      <OrganizationGeneralClient 
        organizationId={organization.id}
        planTier={organization.plan_tier}
      />

      {/* Team Members Section */}
      <div className="w-full space-y-6">
        {/* Members Header */}
        <div className="w-full flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
            <p className="text-muted-foreground mt-1">
              Manage your team and invite new members
            </p>
          </div>
          
          {canInvite && (
            <InviteMemberButton organizationId={organization.id} />
          )}
        </div>
        
        {/* Usage Indicator */}
        {organization.max_users !== null && (
          <div className="w-full">
            <LimitIndicator
              current={members.length}
              max={organization.max_users}
              label="team members"
            />
          </div>
        )}
        
        {/* Members List */}
        <div className="w-full">
          <MembersList 
            members={members}
            organizationId={organization.id}
            currentUserRole={membership.role}
            canManage={canManageMembers}
          />
        </div>
        
        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && canManageMembers && (
          <div className="w-full">
            <PendingInvitationsList 
              invitations={pendingInvitations}
              canManage={canManageMembers}
            />
          </div>
        )}
      </div>
      
      {/* Danger Zone (Owner only) */}
      {isOwner && (
        <div className="w-full">
          <DangerZone organizationId={organization.id} />
        </div>
      )}
    </div>
  );
}
