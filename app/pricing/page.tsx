/**
 * Public Pricing Page (KISS approach)
 * Simple landing page showing plans - no auth required
 * Reuses: PublicHeader, Card, Button, PLANS
 */

'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PublicHeader } from '@/components/public-header';
import { Check, ArrowRight } from 'lucide-react';
import { PLANS } from '@/constants/organization';

export default function PricingPage() {
  const router = useRouter();
  
  // Simple: Check if user is logged in
  const isAuthenticated = typeof window !== 'undefined' && localStorage.getItem('access_token');
  
  const handleSelectPlan = (planKey: string) => {
    // KISS: Simple logic
    if (planKey === 'free') {
      // Free plan - go to signup with from param
      router.push('/signup?from=/pricing');
      return;
    }
    
    if (planKey === 'enterprise') {
      // Enterprise - contact sales
      alert('Contact sales@sabra.com for Enterprise plan');
      return;
    }
    
    // Paid plans
    if (isAuthenticated) {
      // Logged in - go to checkout
      router.push(`/checkout?plan=${planKey}`);
    } else {
      // Not logged in - signup with plan + from param
      router.push(`/signup?plan=${planKey}&from=/pricing`);
    }
  };
  
  return (
    <div className="min-h-screen bg-white">
      {/* Reuse PublicHeader */}
      <PublicHeader />

      {/* Hero Section - Simple */}
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Choose the plan that fits your needs. No hidden fees.
        </p>
      </div>

      {/* Plans Grid - Reuse existing design */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(PLANS).map(([key, plan]) => (
            <Card 
              key={key}
              className={plan.popular ? 'border-2 border-black' : ''}
            >
              <CardHeader>
                {plan.popular && (
                  <div className="mb-2">
                    <span className="bg-black text-white text-xs font-medium px-2 py-1 rounded">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {plan.priceLabel}
                  </span>
                  {plan.price !== null && (
                    <span className="text-gray-600">/month</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 text-black mt-0.5 flex-shrink-0" />
                      <span className={feature.toLowerCase().includes('credits') ? 'font-bold text-gray-900' : ''}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full bg-black hover:bg-gray-800 text-white"
                  onClick={() => handleSelectPlan(key)}
                >
                  {key === 'enterprise' ? 'Contact Sales' : 'Get Started'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-600">
          <p>© 2024 AI-RFX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
