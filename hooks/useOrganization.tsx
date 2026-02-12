/**
 * useOrganization Hook
 * Handles organization CRUD operations
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createOrganization as createOrgAPI, updateOrganization as updateOrgAPI, type CreateOrganizationResult } from '@/lib/api-organizations';
import type { 
  CreateOrganizationInput, 
  UpdateOrganizationInput,
} from '@/types/organization';

export function useOrganization() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  /**
   * Create a new organization
   */
  const createOrganization = async (
    data: CreateOrganizationInput
  ): Promise<CreateOrganizationResult> => {
    setIsCreating(true);
    
    try {
      const result = await createOrgAPI({
        name: data.name,
        slug: data.slug,
        plan_tier: data.plan_tier,
        billing_email: data.billing_email,
      });
      
      if (result.stripe_checkout_url) {
        toast.success('Organization created!', { description: 'Redirecting to payment...' });
      } else if (result.plan_request) {
        toast.success('Organization created!', { 
          description: `Your ${result.plan_request.requested_tier} plan request is pending approval.` 
        });
      } else {
        toast.success('Organization created!', { description: 'Your organization is ready.' });
      }
      
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create organization';
      toast.error('Error creating organization', {
        description: message,
      });
      throw error;
    } finally {
      setIsCreating(false);
    }
  };
  
  /**
   * Update organization details (name, slug)
   * Uses new PATCH endpoint for partial updates
   */
  const updateOrganization = async (
    id: string, 
    data: UpdateOrganizationInput
  ): Promise<void> => {
    setIsUpdating(true);
    
    try {
      await updateOrgAPI(data);
      
      toast.success('Organization updated successfully!');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update organization';
      toast.error('Error updating organization', {
        description: message,
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };
  
  /**
   * Delete organization (owner only)
   */
  const deleteOrganization = async (id: string): Promise<void> => {
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/organizations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete organization');
      }
      
      toast.success('Organization deleted successfully');
      router.push('/settings/organization');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete organization';
      toast.error('Error deleting organization', {
        description: message,
      });
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };
  
  return {
    createOrganization,
    updateOrganization,
    deleteOrganization,
    isCreating,
    isUpdating,
    isDeleting,
  };
}
