
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagementTable from './UserManagementTable';
import RoleManagementTab from './RoleManagementTab';
import ImportHistoryTab from './ImportHistoryTab';

interface UserManagementTabsProps {
  refreshTrigger: number;
  onCreateUser: () => void;
  onEditUser: (user: any) => void;
  onImportUsers: () => void;
  onAssignVehicles: (user: any) => void;
}

const UserManagementTabs: React.FC<UserManagementTabsProps> = ({
  refreshTrigger,
  onCreateUser,
  onEditUser,
  onImportUsers,
  onAssignVehicles
}) => {
  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
        <TabsTrigger value="import-history">Import History</TabsTrigger>
      </TabsList>
      
      <TabsContent value="users" className="space-y-4">
        <UserManagementTable 
          refreshTrigger={refreshTrigger}
          onCreateUser={onCreateUser}
          onEditUser={onEditUser}
          onImportUsers={onImportUsers}
          onAssignVehicles={onAssignVehicles}
        />
      </TabsContent>
      
      <TabsContent value="roles" className="space-y-4">
        <RoleManagementTab />
      </TabsContent>
      
      <TabsContent value="import-history" className="space-y-4">
        <ImportHistoryTab />
      </TabsContent>
    </Tabs>
  );
};

export default UserManagementTabs;
