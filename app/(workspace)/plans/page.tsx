/**
 * Plans Page
 * View current plan and compare available plans
 */

'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Check, CreditCard, ArrowRight } from 'lucide-react';
import { PlanBadge } from '@/components/shared/PlanBadge';
import { PLANS } from '@/constants/organization';

export default function PlansPage() {
  const router = useRouter();
  
  // TODO: Get from user context
  const currentPlan = 'pro';
  const isInOrganization = false;
  
  const currentPlanConfig = PLANS[currentPlan as keyof typeof PLANS];
  
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
            {isInOrganization 
              ? "Your organization's active subscription" 
              : "Your personal subscription plan"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <PlanBadge plan={currentPlan as any} />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {currentPlanConfig?.name} Plan
                  </h3>
                  <p className="text-lg text-muted-foreground">
                    {currentPlanConfig?.priceLabel}
                    {currentPlanConfig?.price !== null && '/month'}
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground max-w-2xl">
                Full access to all features and priority support
              </p>
            </div>
            
            <Button 
              variant="outline"
              onClick={() => router.push('/settings/organization')}
            >
              Manage Billing
            </Button>
          </div>

          <Separator />

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">Features included:</p>
              <ul className="space-y-2">
                {currentPlanConfig?.features.slice(0, 4).map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">Billing:</p>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">Amount:</span> {currentPlanConfig?.priceLabel}
                  {currentPlanConfig?.price !== null && '/month'}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Next billing:</span> Dec 15, 2025
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Payment method:</span> •••• 4242
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">Usage:</p>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">Type:</span>{' '}
                  {isInOrganization ? 'Organization Plan' : 'Personal Plan'}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Status:</span>{' '}
                  <span className="text-green-600 font-medium">Active</span>
                </p>
                {!isInOrganization && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Not part of an organization
                  </p>
                )}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(PLANS).map(([key, plan]) => {
            const isCurrent = key === currentPlan;
            const canUpgrade = plan.price !== null && (
              currentPlanConfig?.price === null || 
              plan.price > (currentPlanConfig?.price || 0)
            );
            const canDowngrade = currentPlanConfig?.price !== null && (
              plan.price === null || 
              plan.price < currentPlanConfig.price
            );
            
            return (
              <Card 
                key={key}
                className={isCurrent ? 'border-2 border-black' : ''}
              >
                <CardHeader>
                  {plan.popular && (
                    <div className="mb-2">
                      <span className="bg-foreground text-background text-xs font-medium px-2 py-1 rounded">
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
                    {plan.price !== null && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="h-4 w-4 text-foreground mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={
                      isCurrent 
                        ? 'w-full bg-muted text-gray-900 hover:bg-gray-200' 
                        : 'w-full bg-foreground hover:bg-gray-800 text-white'
                    }
                    disabled={isCurrent}
                    onClick={() => {
                      if (key === 'enterprise') {
                        // TODO: Contact sales
                        alert('Contact sales for Enterprise plan');
                      } else {
                        // TODO: Checkout flow
                        router.push(`/checkout?plan=${key}`);
                      }
                    }}
                  >
                    {isCurrent ? (
                      'Current Plan'
                    ) : canUpgrade ? (
                      <>
                        Upgrade <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : canDowngrade ? (
                      'Downgrade'
                    ) : (
                      'Select Plan'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* FAQ or Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Need help choosing?</CardTitle>
          <CardDescription>
            Common questions about our plans
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">
              Can I change my plan anytime?
            </p>
            <p className="text-sm text-muted-foreground">
              Yes! You can upgrade or downgrade your plan at any time. 
              Changes take effect immediately, and we'll prorate your billing.
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">
              What happens when I upgrade?
            </p>
            <p className="text-sm text-muted-foreground">
              You'll get immediate access to all new features. We'll charge you 
              the prorated difference for the remainder of your billing cycle.
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">
              Need an Enterprise plan?
            </p>
            <p className="text-sm text-muted-foreground">
              Contact our sales team for custom pricing, dedicated support, 
              and advanced features tailored to your organization.
            </p>
            <Button variant="outline" size="sm" className="mt-2">
              Contact Sales
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
