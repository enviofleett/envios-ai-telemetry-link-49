import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
interface UserProfilesHeaderProps {
  onCreateUser: () => void;
}
export default function UserProfilesHeader({
  onCreateUser
}: UserProfilesHeaderProps) {
  return <div className="flex items-center justify-between">
      <div>
        
        <p className="text-muted-foreground">
          Manage user accounts and vehicle assignments
        </p>
      </div>
      <Button onClick={onCreateUser}>
        <Plus className="w-4 h-4 mr-2" />
        Create User
      </Button>
    </div>;
}