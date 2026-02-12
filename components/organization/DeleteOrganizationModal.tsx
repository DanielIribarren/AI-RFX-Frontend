/**
 * DeleteOrganizationModal Component
 * Confirmation modal for deleting organization
 */

'use client';

import { useState } from 'react';
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
import { AlertTriangle } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';

interface Props {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteOrganizationModal({ organizationId, isOpen, onClose }: Props) {
  const [confirmText, setConfirmText] = useState('');
  const { deleteOrganization, isDeleting } = useOrganization();
  
  const CONFIRM_TEXT = 'DELETE';
  const isConfirmed = confirmText === CONFIRM_TEXT;
  
  const handleDelete = async () => {
    if (!isConfirmed) return;
    
    try {
      await deleteOrganization(organizationId);
      onClose();
    } catch (error) {
      // Error already handled by hook
      console.error('Failed to delete organization:', error);
    }
  };
  
  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText('');
      onClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Delete Organization
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your organization.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Warning */}
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-sm text-red-800">
              <p className="font-medium mb-2">This will permanently delete:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All organization data</li>
                <li>All team members</li>
                <li>All RFX and proposals</li>
                <li>All billing information</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          {/* Confirmation Input */}
          <div>
            <Label htmlFor="confirm">
              Type <span className="font-mono font-bold">{CONFIRM_TEXT}</span> to confirm
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_TEXT}
              className="mt-1 font-mono"
              disabled={isDeleting}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Organization'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
