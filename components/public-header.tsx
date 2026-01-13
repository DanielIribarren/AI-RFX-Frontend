/**
 * PublicHeader Component (KISS)
 * Reusable header for public pages (landing, pricing)
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandButton } from '@/components/brand-button';
import { BrandBadge } from '@/components/brand-badge';
import { Sparkles } from 'lucide-react';

export function PublicHeader() {
  const pathname = usePathname();
  
  return (
    <header className="sticky top-0 z-50 border-b border-brand-border bg-white/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl font-bold text-black hover:text-indigo-600 transition-colors">
            AI-RFX
          </Link>
          <BrandBadge variant="indigo" className="hidden sm:inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Nuevo APU
          </BrandBadge>
        </div>
        
        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/pricing"
            className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/casos-de-estudio"
            className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
          >
            Casos
          </Link>
        </nav>
        
        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Link href={`/login?from=${pathname}`}>
            <BrandButton 
              variant="secondary"
              size="sm"
            >
              Log in
            </BrandButton>
          </Link>
          <Link href={`/signup?from=${pathname}`}>
            <BrandButton 
              variant="primary"
              size="sm"
            >
              Sign up
            </BrandButton>
          </Link>
        </div>
      </div>
    </header>
  );
}
