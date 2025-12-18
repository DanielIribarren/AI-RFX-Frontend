/**
 * PublicHeader Component (KISS)
 * Reusable header for public pages (landing, pricing)
 */

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function PublicHeader() {
  const router = useRouter();
  const pathname = usePathname(); // KISS: Detectar página actual
  
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="text-xl font-bold text-gray-900 cursor-pointer hover:text-gray-700 transition-colors"
          onClick={() => router.push('/')}
        >
          AI-RFX
        </div>
        
        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => router.push('/pricing')}
            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Pricing
          </button>
        </nav>
        
        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/login?from=${pathname}`)}
            className="text-gray-700 hover:text-gray-900"
          >
            Log in
          </Button>
          <Button 
            onClick={() => router.push(`/signup?from=${pathname}`)}
            className="bg-black hover:bg-gray-800 text-white"
          >
            Sign up
          </Button>
        </div>
      </div>
    </header>
  );
}
