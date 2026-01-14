/**
 * Accept Invitation Page
 * Page for accepting organization invitations
 */

import { AcceptInvitationCard } from '@/components/organization/AcceptInvitationCard';

// TODO: Replace with actual invitation fetching from API
async function getInvitationData(token: string) {
  // Mock data - replace with actual API call
  return {
    invitation: {
      id: 'inv-1',
      organization_id: '1',
      email: 'newuser@example.com',
      role: 'member' as const,
      status: 'pending' as const,
      token: token,
      organization: {
        id: '1',
        name: 'Acme Catering',
        slug: 'acme-catering',
        logo_url: undefined,
        plan_tier: 'pro' as const,
        credits_total: 1500,
        credits_used: 450,
      },
      invited_by: {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@acme.com',
      },
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    hasPersonalPlan: false, // TODO: Get from user context
  };
}

export default async function AcceptInvitationPage({
  params,
}: {
  params: { token: string };
}) {
  const { invitation, hasPersonalPlan } = await getInvitationData(params.token);
  
  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-6">
      <AcceptInvitationCard 
        invitation={invitation}
        hasPersonalPlan={hasPersonalPlan}
      />
    </div>
  );
}
