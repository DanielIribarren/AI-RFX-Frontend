/**
 * PublicHeader Component (KISS)
 * Reusable header for public pages (landing, pricing)
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function PublicHeader() {
  const pathname = usePathname();
  
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
          AI-RFX
        </Link>
        
        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/pricing"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/casos-de-estudio"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Casos
          </Link>
        </nav>
        
        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Link href={`/login?from=${pathname}`}>
            <Button 
              variant="ghost" 
              className="text-gray-700 hover:text-gray-900"
            >
              Log in
            </Button>
          </Link>
          <Link href={`/signup?from=${pathname}`}>
            <Button 
              className="bg-black hover:bg-gray-800 text-white"
            >
              Sign up
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
