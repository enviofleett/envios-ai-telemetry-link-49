
import React from 'react';
import { Users } from 'lucide-react';
import EnhancedUserManagement from '@/components/users/EnhancedUserManagement';

const EnhancedUserManagementPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Enhanced User Management</h1>
          <p className="text-sm text-muted-foreground">
            Advanced user management with system health monitoring and enhanced error handling
          </p>
        </div>
      </div>
      
      <EnhancedUserManagement />
    </div>
  );
};

export default EnhancedUserManagementPage;
