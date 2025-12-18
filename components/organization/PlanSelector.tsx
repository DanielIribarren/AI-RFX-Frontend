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
            'relative border-2 rounded-lg p-4 text-left transition-all hover:border-gray-400',
            selected === plan.id
              ? 'border-black bg-gray-50'
              : 'border-gray-200 bg-white'
          )}
        >
          {/* Popular Badge */}
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-black text-white text-xs font-medium px-3 py-1 rounded-full">
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
                  <span className="text-sm font-normal text-gray-600">/mo</span>
                )}
              </p>
            </div>
            
            {/* Features */}
            <ul className="space-y-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-black mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Selected Indicator */}
          {selected === plan.id && (
            <div className="absolute top-3 right-3">
              <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
