/**
 * CreateOrganizationCTA Component
 * Call-to-action card for creating an organization
 */

'use client';

import { Check } from 'lucide-react';

export function CreateOrganizationCTA() {
  return (
    <div className="border border rounded-lg p-8 text-center space-y-6 bg-background">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create an Organization
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Organizations allow you to collaborate with your team, 
            manage RFX together, and centralize billing.
          </p>
        </div>
        
        {/* Benefits */}
        <div className="space-y-3 max-w-md mx-auto">
          <div className="flex items-center gap-3 text-left">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
              <Check className="w-3 h-3 text-background" />
            </div>
            <span className="text-sm text-gray-700">
              Share RFX with team members
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-left">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
              <Check className="w-3 h-3 text-background" />
            </div>
            <span className="text-sm text-gray-700">
              Centralized billing and management
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-left">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
              <Check className="w-3 h-3 text-background" />
            </div>
            <span className="text-sm text-gray-700">
              Unified branding across all proposals
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-left">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
              <Check className="w-3 h-3 text-background" />
            </div>
            <span className="text-sm text-gray-700">
              Analytics and reporting
            </span>
          </div>
        </div>
        
        {/* Contact Message */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-900 font-medium">
            To create an organization, please contact us
          </p>
          <p className="text-xs text-primary-dark mt-1">
            We are currently in testing mode and organization creation requires approval.
          </p>
        </div>
      </div>
  );
}
