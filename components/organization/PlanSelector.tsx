/**
 * PlanSelector Component
 * Grid of plan cards for selection
 */

'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLANS } from '@/constants/organization';
import type { PlanTier } from '@/types/organization';

interface Props {
  selected: PlanTier;
  onChange: (plan: PlanTier) => void;
}

export function PlanSelector({ selected, onChange }: Props) {
  const plans = [PLANS.starter, PLANS.pro, PLANS.enterprise];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {plans.map((plan) => (
        <button
          key={plan.id}
          type="button"
          onClick={() => onChange(plan.id as PlanTier)}
          className={cn(
            'relative border-2 rounded-xl p-4 text-left transition-all duration-200',
            selected === plan.id
              ? 'border-primary bg-accent-light ring-1 ring-primary/20'
              : 'border-border hover:border-primary/40 bg-white'
          )}
        >
          {/* Popular Badge */}
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                Most Popular
              </span>
            </div>
          )}
          
          <div className="space-y-3">
            {/* Header */}
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                {plan.name}
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {plan.priceLabel}
                {plan.price !== null && (
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                )}
              </p>
            </div>
            
            {/* Features */}
            <ul className="space-y-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Selected Indicator */}
          {selected === plan.id && (
            <div className="absolute top-3 right-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
