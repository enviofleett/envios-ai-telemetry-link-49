
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import UserManagementTable from './UserManagementTable';
import VehicleImportTab from './VehicleImportTab';

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
    <div className="w-full">
      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="vehicle-import">Vehicle Import</TabsTrigger>
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

        <TabsContent value="vehicle-import" className="space-y-4">
          <VehicleImportTab />
        </TabsContent>
        
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                Role management interface coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="import-history" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                Import history and audit logs coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagementTabs;
