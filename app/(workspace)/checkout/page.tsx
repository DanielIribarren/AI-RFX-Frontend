/**
 * Checkout Page (KISS approach)
 * Simple checkout flow - Stripe integration placeholder
 */

'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { PlanBadge } from '@/components/shared/PlanBadge';
import { PLANS } from '@/constants/organization';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planKey = searchParams.get('plan') || 'starter';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const plan = PLANS[planKey as keyof typeof PLANS];
  
  // KISS: Simple validation
  if (!plan || plan.price === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invalid Plan</CardTitle>
            <CardDescription>
              The selected plan is not available for checkout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/plans')}>
              View Available Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // KISS: Simple checkout handler (Stripe placeholder)
  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    
    try {
      // TODO: Integrate with Stripe
      // For now, just simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock success - redirect to dashboard
      alert(`Checkout successful! Welcome to ${plan.name} plan.`);
      router.push('/dashboard');
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-1 flex-col space-y-6 p-6">
      {/* Header */}
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Checkout</h2>
        <p className="text-muted-foreground">
          Complete your purchase to activate your plan
        </p>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Order Summary */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Review your plan details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plan Details */}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <PlanBadge plan={planKey as any} />
                  <h3 className="text-xl font-bold text-gray-900">{plan.name} Plan</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Monthly subscription - billed monthly
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{plan.priceLabel}</p>
                <p className="text-sm text-gray-600">/month</p>
              </div>
            </div>

            <Separator />

            {/* Features */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-900">What's included:</p>
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Billing Info */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{plan.priceLabel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium text-gray-900">$0.00</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium text-gray-900">Total due today</span>
                <span className="text-xl font-bold text-gray-900">{plan.priceLabel}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment
            </CardTitle>
            <CardDescription>Secure payment processing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* KISS: Simple placeholder for Stripe */}
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-600 text-center">
                  Stripe payment form will appear here
                </p>
                <p className="text-xs text-gray-500 text-center mt-2">
                  (Integration pending)
                </p>
              </div>
              
              <Button 
                className="w-full bg-black hover:bg-gray-800 text-white"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Complete Purchase
                  </>
                )}
              </Button>
              
              <p className="text-xs text-gray-500 text-center">
                Your payment is secure and encrypted
              </p>
            </div>

            <Separator />

            {/* Cancel */}
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => router.push('/plans')}
              disabled={loading}
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Terms */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-xs text-gray-600 text-center">
            By completing this purchase, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
            Your subscription will automatically renew monthly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutContent />
    </Suspense>
  );
}
