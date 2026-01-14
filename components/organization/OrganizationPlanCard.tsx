/**
 * OrganizationPlanCard Component
 * Displays current plan, usage, and upgrade options
 */

'use client';

import { Button } from '@/components/ui/button';
import { PlanBadge } from '@/components/shared/PlanBadge';
import { LimitIndicator } from '@/components/shared/LimitIndicator';
import { PLANS } from '@/constants/organization';
import type { Organization } from '@/types/organization';

interface Props {
  organization: Organization;
  currentMemberCount: number;
  canManage: boolean;
}

export function OrganizationPlanCard({ 
  organization, 
  currentMemberCount,
  canManage 
}: Props) {
  const plan = PLANS[organization.plan_tier];
  
  if (!plan) {
    return null;
  }
  
  const handleChangePlan = () => {
    // TODO: Implement plan change flow
    console.log('Change plan clicked');
  };
  
  return (
    <div className="border border rounded-lg p-6 bg-background">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Current Plan
      </h2>
      
      <div className="space-y-4">
        {/* Plan Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PlanBadge plan={organization.plan_tier} />
            <div>
              <h3 className="font-semibold text-gray-900">{plan.name} Plan</h3>
              <p className="text-sm text-muted-foreground">
                {plan.priceLabel}
                {plan.price !== null && '/month'}
              </p>
            </div>
          </div>
          
          {canManage && (
            <Button 
              variant="outline" 
              onClick={handleChangePlan}
              className="border-input"
            >
              Change Plan
            </Button>
          )}
        </div>
        
        {/* Features */}
        <div className="pt-4 border-t border">
          <ul className="space-y-2 text-sm text-gray-700">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-muted-foreground/60">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Usage Indicator */}
        {organization.max_users !== null && (
          <div className="pt-4 border-t border">
            <LimitIndicator
              current={currentMemberCount}
              max={organization.max_users}
              label="team members"
            />
          </div>
        )}
      </div>
    </div>
  );
}
