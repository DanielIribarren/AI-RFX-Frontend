/**
 * PublicHeader Component (KISS)
 * Reusable header for public pages (landing, pricing)
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BrandBadge } from '@/components/brand-badge';
import { Sparkles } from 'lucide-react';

export function PublicHeader() {
  const pathname = usePathname();
  
  return (
    <header className="sticky top-0 z-50 bg-white/60 backdrop-blur-[24px] border-b border-[#0B0B0F]/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo - Negro con punto índigo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="text-2xl font-bold text-[#0B0B0F] hover:opacity-80 transition-opacity">
            AI-RFX<span className="text-[#4F46E5]">.</span>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/pricing"
            className="text-sm font-medium text-[#475569] hover:text-[#0B0B0F] transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/casos-de-estudio"
            className="text-sm font-medium text-[#475569] hover:text-[#0B0B0F] transition-colors"
          >
            Casos
          </Link>
        </nav>
        
        {/* Auth Buttons - Botón negro primary */}
        <div className="flex items-center gap-3">
          <Link href={`/login?from=${pathname}`}>
            <Button 
              variant="brand-outline"
              size="sm"
            >
              Log in
            </Button>
          </Link>
          <Link href={`/signup?from=${pathname}`}>
            <Button 
              size="sm"
              className="bg-[#0B0B0F] text-white hover:opacity-90 shadow-md transition-all duration-200"
            >
              Sign up
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
