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
import { Check, CreditCard, Loader2, AlertCircle, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PlanBadge } from '@/components/shared/PlanBadge';
import { PLANS } from '@/constants/organization';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planKey = searchParams.get('plan') || 'starter';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showThankYouDialog, setShowThankYouDialog] = useState(false);
  
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
  
  // KISS: Contact Us handler - sends email automatically via backend with JWT auth
  const handleContactUs = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      // Send email via backend with JWT token
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/contact-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan_name: plan.name,
          plan_price: plan.priceLabel,
          recipient_email: 'iriyidan@gmail.com'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send contact request');
      }
      
      // Show success dialog
      setShowThankYouDialog(true);
    } catch (err) {
      console.error('Error sending contact request:', err);
      setError(err instanceof Error ? err.message : 'Failed to send request. Please try again or contact us directly at iriyidan@gmail.com');
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
            
            {/* Contact Us for manual plan setup */}
            <div className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription className="ml-2">
                  <p className="font-medium">Contact us to set up your plan</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    We'll create your plan manually and contact you shortly
                  </p>
                </AlertDescription>
              </Alert>
              
              <Button 
                className="w-full"
                onClick={handleContactUs}
                disabled={loading}
              >
                <Mail className="mr-2 h-4 w-4" />
                Contact Us
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                We'll respond within 24 hours
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
          <p className="text-xs text-muted-foreground text-center">
            By requesting this plan, you agree to our{' '}
            <a href="#" className="underline underline-offset-4 hover:text-primary">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="underline underline-offset-4 hover:text-primary">Privacy Policy</a>.
            Your subscription will automatically renew monthly.
          </p>
        </CardContent>
      </Card>

      {/* Thank You Dialog */}
      <Dialog open={showThankYouDialog} onOpenChange={setShowThankYouDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Thanks for your request!
            </DialogTitle>
            <DialogDescription className="text-center pt-4">
              We'll contact you shortly to set up your {plan.name} Plan.
              <br />
              <br />
              An email has been prepared for you. Please send it to complete your request.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button
              onClick={() => {
                setShowThankYouDialog(false);
                router.push('/dashboard');
              }}
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
