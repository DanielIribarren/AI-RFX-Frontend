/**
 * CreateOrganizationCTA Component
 * Call-to-action card for creating an organization
 */

'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateOrganizationModal } from './CreateOrganizationModal';

const BENEFITS = [
  'Share RFX with team members',
  'Centralized billing and management',
  'Unified branding across all proposals',
  'Analytics and reporting',
];

export function CreateOrganizationCTA() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="border border-border rounded-xl p-8 text-center space-y-6 bg-background">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create an Organization
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Organizations allow you to collaborate with your team, 
            manage RFX together, and centralize billing.
          </p>
        </div>
        
        <div className="space-y-3 max-w-md mx-auto">
          {BENEFITS.map((benefit) => (
            <div key={benefit} className="flex items-center gap-3 text-left">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="text-sm text-gray-700">{benefit}</span>
            </div>
          ))}
        </div>
        
        <Button 
          size="lg" 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-dark text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200"
        >
          Create Organization
        </Button>
      </div>

      <CreateOrganizationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
