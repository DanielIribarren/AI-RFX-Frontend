/**
 * Organization Overview Page
 * Shows CTA to create org if user is not in one, otherwise redirects to general settings
 */

// Force dynamic rendering - this page requires authentication
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { CreateOrganizationCTA } from '@/components/organization/CreateOrganizationCTA';
import { getCurrentOrganization } from '@/lib/api-organizations';

async function getUserOrganization() {
  try {
    const organization = await getCurrentOrganization();
    return organization;
  } catch (error) {
    // If error is 403 (user must belong to organization), return null
    if (error instanceof Error && error.message.includes('must belong to an organization')) {
      return null;
    }
    // For other errors, log and return null to show CTA
    console.error('Error fetching organization:', error);
    return null;
  }
}

export default async function OrganizationPage() {
  const organization = await getUserOrganization();
  
  // If user is already in an organization, redirect to general settings
  if (organization) {
    redirect('/settings/organization/general');
  }
  
  // Show CTA to create organization
  return (
    <div className="max-w-4xl mx-auto p-6">
      <CreateOrganizationCTA />
    </div>
  );
}
