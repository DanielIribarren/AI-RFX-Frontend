/**
 * OrganizationGeneralSettings Component
 * Form for editing organization name and slug
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrganization } from '@/hooks/useOrganization';
import { ORGANIZATION_VALIDATION } from '@/constants/organization';
import type { Organization } from '@/types/organization';

const schema = z.object({
  name: z.string()
    .min(ORGANIZATION_VALIDATION.NAME_MIN_LENGTH, `Name must be at least ${ORGANIZATION_VALIDATION.NAME_MIN_LENGTH} characters`)
    .max(ORGANIZATION_VALIDATION.NAME_MAX_LENGTH, `Name must be at most ${ORGANIZATION_VALIDATION.NAME_MAX_LENGTH} characters`),
  slug: z.string()
    .min(ORGANIZATION_VALIDATION.SLUG_MIN_LENGTH, `Slug must be at least ${ORGANIZATION_VALIDATION.SLUG_MIN_LENGTH} characters`)
    .max(ORGANIZATION_VALIDATION.SLUG_MAX_LENGTH, `Slug must be at most ${ORGANIZATION_VALIDATION.SLUG_MAX_LENGTH} characters`)
    .regex(ORGANIZATION_VALIDATION.SLUG_PATTERN, 'Only lowercase letters, numbers and hyphens'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  organization: Organization;
  canEdit: boolean;
}

export function OrganizationGeneralSettings({ organization, canEdit }: Props) {
  const { updateOrganization, isUpdating } = useOrganization();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isDirty } 
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: organization.name,
      slug: organization.slug,
    },
  });
  
  const onSubmit = async (data: FormData) => {
    try {
      await updateOrganization(organization.id, data);
    } catch (error) {
      // Error already handled by hook
      console.error('Failed to update organization:', error);
    }
  };
  
  return (
    <div className="w-full border border rounded-lg p-6 bg-background">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        General Information
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
        {/* Organization Name */}
        <div className="w-full">
          <Label htmlFor="name">Organization Name</Label>
          <Input
            id="name"
            {...register('name')}
            disabled={!canEdit}
            placeholder="Acme Catering"
            className="mt-1 w-full"
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>
        
        {/* URL Slug */}
        <div className="w-full">
          <Label htmlFor="slug">URL Slug</Label>
          <Input
            id="slug"
            {...register('slug')}
            disabled={!canEdit}
            placeholder="acme-catering"
            className="mt-1 w-full"
          />
          <p className="text-sm text-muted-foreground mt-1">
            https://ai-rfx.com/org/{organization.slug}
          </p>
          {errors.slug && (
            <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>
          )}
        </div>
        
        {/* Save Button */}
        {canEdit && (
          <Button 
            type="submit" 
            disabled={!isDirty || isUpdating}
            className="bg-primary hover:bg-primary-dark text-primary-foreground shadow-sm"
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </form>
    </div>
  );
}
