'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PublicHeader } from '@/components/public-header';
import { Check, ArrowRight } from 'lucide-react';
import { PLANS } from '@/constants/organization';

export default function PricingPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  }, []);
  
  const handleSelectPlan = (planKey: string) => {
    if (planKey === 'free') {
      router.push('/signup?from=/pricing');
      return;
    }
    
    if (planKey === 'enterprise') {
      alert('Contact sales@sabra.com for Enterprise plan');
      return;
    }
    
    if (isAuthenticated) {
      router.push(`/checkout?plan=${planKey}`);
    } else {
      router.push(`/signup?plan=${planKey}&from=/pricing`);
    }
  };
  
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-16">
          Choose the plan that fits your needs. No hidden fees.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-24">
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

      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} AI-RFX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
