
import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings, User } from 'lucide-react';

interface AdminSetupToggleProps {
  showAdminSetup: boolean;
  onToggle: () => void;
}

const AdminSetupToggle: React.FC<AdminSetupToggleProps> = ({ showAdminSetup, onToggle }) => {
  return (
    <div className="flex justify-center mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="flex items-center gap-2 text-sm"
      >
        {showAdminSetup ? (
          <>
            <User className="h-4 w-4" />
            Regular Login
          </>
        ) : (
          <>
            <Settings className="h-4 w-4" />
            Admin Setup
          </>
        )}
      </Button>
    </div>
  );
};

export default AdminSetupToggle;
