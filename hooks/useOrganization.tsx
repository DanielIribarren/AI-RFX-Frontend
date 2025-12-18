/**
 * useOrganization Hook
 * Handles organization CRUD operations
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { 
  CreateOrganizationInput, 
  UpdateOrganizationInput,
  Organization,
  CreateOrganizationResponse 
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
  ): Promise<CreateOrganizationResponse> => {
    setIsCreating(true);
    
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create organization');
      }
      
      const result: CreateOrganizationResponse = await response.json();
      
      toast.success('Organization created successfully!', {
        description: 'Redirecting to payment...',
      });
      
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
      // Use new PATCH endpoint from api-organizations
      const { updateOrganization: updateOrgAPI } = await import('@/lib/api-organizations');
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
