/**
 * CreateOrganizationModal Component
 * Modal for creating a new organization with plan selection
 */

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { PlanSelector } from './PlanSelector';
import { useOrganization } from '@/hooks/useOrganization';
import { generateSlug } from '@/constants/organization';
import type { PlanTier } from '@/types/organization';

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens'),
  plan_tier: z.enum(['free', 'starter', 'pro', 'enterprise']),
  billing_email: z.string().email('Invalid email address'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateOrganizationModal({ isOpen, onClose }: Props) {
  const { createOrganization, isCreating } = useOrganization();
  const hasPersonalPlan = false; // TODO: Get from user context
  
  const { 
    register, 
    handleSubmit, 
    watch,
    setValue,
    formState: { errors } 
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      plan_tier: 'pro', // Default to Pro (most popular)
    }
  });
  
  // Auto-generate slug from name
  const name = watch('name');
  useEffect(() => {
    if (name) {
      const slug = generateSlug(name);
      setValue('slug', slug);
    }
  }, [name, setValue]);
  
  const onSubmit = async (data: FormData) => {
    try {
      const result = await createOrganization(data);
      
      // Redirect to Stripe checkout
      window.location.href = result.stripe_checkout_url;
    } catch (error) {
      // Error already handled by hook with toast
      console.error('Failed to create organization:', error);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create Organization</DialogTitle>
          <DialogDescription>
            Set up your organization to collaborate with your team
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Organization Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Acme Catering"
                autoFocus
                className="mt-1"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                {...register('slug')}
                placeholder="acme-catering"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                https://ai-rfx.com/org/{watch('slug') || 'your-slug'}
              </p>
              {errors.slug && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.slug.message}
                </p>
              )}
            </div>
          </div>
          
          {/* Plan Selection */}
          <div>
            <Label className="mb-3 block">Select Plan *</Label>
            <PlanSelector
              selected={watch('plan_tier')}
              onChange={(plan: PlanTier) => setValue('plan_tier', plan)}
            />
          </div>
          
          {/* Billing Email */}
          <div>
            <Label htmlFor="billing_email">Billing Email *</Label>
            <Input
              id="billing_email"
              {...register('billing_email')}
              type="email"
              placeholder="billing@acme.com"
              className="mt-1"
            />
            {errors.billing_email && (
              <p className="text-sm text-red-600 mt-1">
                {errors.billing_email.message}
              </p>
            )}
          </div>
          
          {/* Warning about personal plan */}
          {hasPersonalPlan && (
            <Alert className="border-gray-300 bg-gray-50">
              <AlertCircle className="h-4 w-4 text-gray-600" />
              <AlertDescription className="text-sm text-gray-700">
                <p className="font-medium">Your personal plan will be canceled</p>
                <p className="mt-1">
                  You'll receive a prorated refund for any unused days on your current plan.
                </p>
              </AlertDescription>
            </Alert>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {isCreating ? 'Creating...' : 'Continue to Payment →'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
