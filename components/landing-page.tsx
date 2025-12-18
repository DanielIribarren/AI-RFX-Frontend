/**
 * LandingPage Component (KISS approach)
 * Main public landing - redirects to dashboard if authenticated
 * Reuses existing components: Button, Card, PublicHeader
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PublicHeader } from '@/components/public-header';
import { Check, Zap, Shield, TrendingUp, ArrowRight } from 'lucide-react';

export function LandingPage() {
  const router = useRouter();
  
  // KISS: Simple auth check
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);
  
  return (
    <div className="min-h-screen bg-white">
      {/* Reuse PublicHeader */}
      <PublicHeader />
      
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Automate Your RFX Process with AI
          </h1>
          <p className="text-xl text-gray-600">
            Process proposals 10x faster with intelligent automation. 
            Extract data, generate budgets, and create professional proposals in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg"
              onClick={() => router.push('/signup?from=/')}
              className="bg-black hover:bg-gray-800 text-white text-lg px-8"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => router.push('/pricing')}
              className="text-lg px-8"
            >
              View Pricing
            </Button>
          </div>
        </div>
      </section>
      
      {/* Features Section - Reuse Card component */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything you need to win more RFX
          </h2>
          <p className="text-lg text-gray-600">
            Powerful features designed for modern procurement teams
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 - Reuse Card */}
          <Card className="border-2 hover:border-gray-300 transition-colors">
            <CardContent className="pt-6 space-y-4">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Lightning Fast Processing
              </h3>
              <p className="text-gray-600">
                AI-powered extraction processes your RFX documents in seconds, 
                not hours. Get instant insights and data.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Automatic data extraction</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Smart product categorization</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Real-time processing</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          {/* Feature 2 - Reuse Card */}
          <Card className="border-2 hover:border-gray-300 transition-colors">
            <CardContent className="pt-6 space-y-4">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Intelligent Budget Generation
              </h3>
              <p className="text-gray-600">
                Generate accurate, professional budgets with AI assistance. 
                Customize pricing and margins with ease.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>AI-powered pricing suggestions</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Profit margin calculator</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Professional PDF export</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          {/* Feature 3 - Reuse Card */}
          <Card className="border-2 hover:border-gray-300 transition-colors">
            <CardContent className="pt-6 space-y-4">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Enterprise-Grade Security
              </h3>
              <p className="text-gray-600">
                Your data is protected with bank-level encryption. 
                SOC 2 compliant and GDPR ready.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>End-to-end encryption</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Role-based access control</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Audit logs & compliance</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to transform your RFX process?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join hundreds of teams already using AI-RFX to win more proposals
          </p>
          <Button 
            size="lg"
            onClick={() => router.push('/signup?from=/')}
            className="bg-black hover:bg-gray-800 text-white text-lg px-8"
          >
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
      
      {/* Simple Footer - Reuse existing styles */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-600">
          <p>© 2024 AI-RFX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
