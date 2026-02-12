/**
 * Plans Page
 * View current plan and compare available plans
 * Shows CTA to create organization if user doesn't have one
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2, CreditCard, ArrowRight } from 'lucide-react';
import { PLANS } from '@/constants/organization';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useCredits } from '@/contexts/CreditsContext';
import { getAvailablePlans, type OrganizationPlan } from '@/lib/api-organizations';
import { UpgradeModal } from '@/components/organization/UpgradeModal';
import { CreateOrganizationCTA } from '@/components/organization/CreateOrganizationCTA';
import { Separator } from '@/components/ui/separator';

export default function PlansPage() {
  const router = useRouter();
  const { organization, isLoading, error: orgError } = useOrganization();
  const { credits } = useCredits();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [backendPlans, setBackendPlans] = useState<OrganizationPlan[] | null>(null);

  // Load plans from backend
  useEffect(() => {
    getAvailablePlans()
      .then(setBackendPlans)
      .catch((err) => console.warn('Failed to load plans from backend, using local constants:', err));
  }, []);
  
  const isInOrganization = !!organization;
  const currentPlan = organization?.plan?.tier || 'free';
  const currentPlanConfig = PLANS[currentPlan as keyof typeof PLANS];

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // If user has no organization, show CTA to create one
  if (!isInOrganization) {
    return (
      <div className="flex flex-1 flex-col space-y-6 p-6">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Plans & Billing</h2>
          <p className="text-muted-foreground">
            Create an organization to access plans and billing
          </p>
        </div>

        <Separator />

        <CreateOrganizationCTA />

        {/* Show available plans for reference */}
        <div className="space-y-4 mt-8">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Available Plans</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a plan when creating your organization
            </p>
          </div>

          <PlansGrid 
            plans={backendPlans} 
            currentPlan={null} 
            onSelectPlan={() => {}} 
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-1 flex-col space-y-6 p-6">
      {/* Page Header */}
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Plans & Billing</h2>
        <p className="text-muted-foreground">
          Manage your subscription and view available plans
        </p>
      </div>

      <Separator />

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Your Current Plan
          </CardTitle>
          <CardDescription>
            Your organization&apos;s active subscription
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {organization.plan.name || `${currentPlanConfig?.name} Plan`}
                </h3>
                <p className="text-lg text-muted-foreground">
                  ${organization.plan.price_monthly_usd ?? currentPlanConfig?.price ?? 0}/month
                </p>
              </div>
            </div>
            
            <Button 
              variant="outline"
              onClick={() => router.push('/settings/organization/general')}
            >
              Manage Organization
            </Button>
          </div>

          <Separator />

          {/* Usage from real data */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">Credits</p>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">{credits?.credits_available ?? '—'}</span> / {credits?.credits_total ?? organization.plan.credits_per_month} available
                </p>
                {credits && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        credits.credits_percentage >= 50 ? 'bg-green-500' :
                        credits.credits_percentage >= 20 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${credits.credits_percentage}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">Team</p>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">{organization.usage.users.current}</span> / {organization.usage.users.limit} members
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">RFX This Month</p>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">{organization.usage.rfx_this_month.current}</span> / {organization.usage.rfx_this_month.limit} processed
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Available Plans</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Compare plans and upgrade or downgrade your subscription
          </p>
        </div>

        <PlansGrid 
          plans={backendPlans} 
          currentPlan={currentPlan}
          onSelectPlan={(planKey) => {
            if (planKey === 'enterprise') {
              alert('Contact sales for Enterprise plan');
            } else {
              router.push(`/checkout?plan=${planKey}`);
            }
          }}
        />
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Need help choosing?</CardTitle>
          <CardDescription>Common questions about our plans</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">Can I change my plan anytime?</p>
            <p className="text-sm text-muted-foreground">
              Yes! You can upgrade or downgrade at any time. Changes take effect immediately with prorated billing.
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">Need an Enterprise plan?</p>
            <p className="text-sm text-muted-foreground">
              Contact our sales team for custom pricing, dedicated support, and advanced features.
            </p>
            <Button variant="outline" size="sm" className="mt-2">Contact Sales</Button>
          </div>
        </CardContent>
      </Card>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}

// Extracted reusable PlansGrid component
function PlansGrid({ 
  plans, 
  currentPlan, 
  onSelectPlan 
}: { 
  plans: OrganizationPlan[] | null; 
  currentPlan: string | null;
  onSelectPlan: (planKey: string) => void;
}) {
  // Use backend plans if available, otherwise fall back to local constants
  const planEntries = plans 
    ? plans.map(p => [p.tier, { 
        id: p.tier, 
        name: p.name, 
        price: p.price_monthly_usd, 
        priceLabel: p.price_monthly_usd === 0 ? 'Free' : `$${p.price_monthly_usd}`,
        features: p.features,
        popular: p.tier === 'pro',
        tier: ['free', 'starter', 'pro', 'enterprise'].indexOf(p.tier) + 1,
      }] as const)
    : Object.entries(PLANS).map(([key, plan]) => [key, plan] as const);

  const currentTierIndex = currentPlan 
    ? ['free', 'starter', 'pro', 'enterprise'].indexOf(currentPlan) 
    : -1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {planEntries.map(([key, plan]) => {
        const isCurrent = key === currentPlan;
        const planTierIndex = ['free', 'starter', 'pro', 'enterprise'].indexOf(key as string);
        const isUpgrade = currentPlan !== null && planTierIndex > currentTierIndex;
        const isDowngrade = currentPlan !== null && planTierIndex < currentTierIndex;
        
        return (
          <Card key={key} className={isCurrent ? 'border-2 border-primary ring-1 ring-primary/20' : ''}>
            <CardHeader>
              {plan.popular && (
                <div className="mb-2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded">
                    Most Popular
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="mb-2">
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                    Current Plan
                  </span>
                </div>
              )}
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900">
                  {plan.priceLabel}
                </span>
                {plan.price !== null && plan.price !== 0 && (
                  <span className="text-muted-foreground">/month</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className={
                  isCurrent 
                    ? 'w-full bg-muted text-muted-foreground cursor-default' 
                    : 'w-full bg-primary hover:bg-primary-dark text-primary-foreground shadow-sm'
                }
                disabled={isCurrent}
                onClick={() => onSelectPlan(key as string)}
              >
                {isCurrent ? 'Current Plan' : 
                 key === 'enterprise' ? 'Contact Sales' :
                 isUpgrade ? (<>Upgrade <ArrowRight className="ml-2 h-4 w-4" /></>) :
                 isDowngrade ? 'Downgrade' : 'Select Plan'}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
