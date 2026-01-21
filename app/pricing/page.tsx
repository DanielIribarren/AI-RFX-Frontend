'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PublicHeader } from '@/components/layout/PublicHeader';
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
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden">
      {/* Fondo con blobs índigo */}
      <div className="landing-background">
        <div className="landing-blob-1"></div>
        <div className="landing-blob-2"></div>
        <div className="landing-blob-3"></div>
        <div className="landing-noise"></div>
      </div>

      <PublicHeader />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-[#0B0B0F] mb-6">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-[#475569] max-w-2xl mx-auto mb-16">
          Choose the plan that fits your needs. No hidden fees.
        </p>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(PLANS).map(([key, plan]) => (
            <div 
              key={key}
              className={`landing-card-glass rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                plan.popular ? 'ring-2 ring-[#4F46E5] ring-offset-2' : ''
              }`}
            >
              {plan.popular && (
                <div className="mb-4">
                  <span className="landing-badge-indigo text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-xl font-bold text-[#0B0B0F] mb-2">{plan.name}</h3>
              <div className="mt-2 mb-6">
                <span className="text-3xl font-bold text-[#0B0B0F]">
                  {plan.priceLabel}
                </span>
                {plan.price !== null && (
                  <span className="text-[#475569]">/month</span>
                )}
              </div>
              
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#475569]">
                    <Check className="h-4 w-4 text-[#4F46E5] mt-0.5 flex-shrink-0" />
                    <span className={feature.toLowerCase().includes('credits') ? 'font-bold text-[#0B0B0F]' : ''}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full bg-[#0B0B0F] text-white hover:opacity-90 shadow-md transition-all duration-200"
                onClick={() => handleSelectPlan(key)}
              >
                {key === 'enterprise' ? 'Contact Sales' : 'Get Started'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <footer className="relative z-10 border-t border-[#0B0B0F]/10 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-[#475569]">
          <p>© {new Date().getFullYear()} AI-RFX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
