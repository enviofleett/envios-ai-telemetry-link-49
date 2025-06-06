
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Database } from 'lucide-react';

interface UserManagementHeaderProps {
  onImportUsers: () => void;
  onFullImport: () => void;
}

const UserManagementHeader: React.FC<UserManagementHeaderProps> = ({
  onImportUsers,
  onFullImport
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">
          Manage users, roles, and import data from GP51 platform
        </p>
      </div>
      
      <div className="flex space-x-3">
        <Button 
          variant="outline" 
          onClick={onImportUsers}
          className="flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          Import Users
        </Button>
        <Button 
          onClick={onFullImport}
          className="flex items-center gap-2"
        >
          <Database className="w-4 h-4" />
          Full GP51 Import
          <Badge variant="secondary" className="ml-1">New</Badge>
        </Button>
      </div>
    </div>
  );
};

export default UserManagementHeader;
