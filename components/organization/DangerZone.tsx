/**
 * DangerZone Component
 * Dangerous actions like deleting organization (owner only)
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { DeleteOrganizationModal } from './DeleteOrganizationModal';

interface Props {
  organizationId: string;
}

export function DangerZone({ organizationId }: Props) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  return (
    <>
      <div className="border border-red-200 rounded-lg p-6 bg-red-50">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-red-900 mb-1">
              Danger Zone
            </h2>
            <p className="text-sm text-red-700 mb-4">
              Irreversible and destructive actions
            </p>
            
            <div className="border border-red-300 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    Delete Organization
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    This will permanently delete all data, members, and RFX
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Organization
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <DeleteOrganizationModal
        organizationId={organizationId}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
}
