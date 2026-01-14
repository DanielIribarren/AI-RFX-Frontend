/**
 * InviteMemberButton Component
 * Button that opens invite member modal
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { InviteMemberModal } from './InviteMemberModal';

interface Props {
  organizationId: string;
}

export function InviteMemberButton({ organizationId }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <>
      <Button 
        onClick={() => setIsModalOpen(true)}
        className="bg-foreground hover:bg-gray-800 text-background"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Invite Member
      </Button>
      
      <InviteMemberModal
        organizationId={organizationId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
