
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    <Tabs defaultValue="users" className="w-full">
      <TabsList className="grid w-full grid-cols-4 lg:w-fit">
        <TabsTrigger value="users" className="text-sm font-medium">
          Users
        </TabsTrigger>
        <TabsTrigger value="vehicle-import" className="text-sm font-medium">
          Vehicle Import
          <Badge variant="outline" className="ml-2 h-5 px-1.5 text-xs">
            Beta
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="roles" className="text-sm font-medium">
          Roles & Permissions
        </TabsTrigger>
        <TabsTrigger value="import-history" className="text-sm font-medium">
          Import History
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="users" className="space-y-4 mt-6">
        <UserManagementTable 
          refreshTrigger={refreshTrigger}
          onCreateUser={onCreateUser}
          onEditUser={onEditUser}
          onImportUsers={onImportUsers}
          onAssignVehicles={onAssignVehicles}
        />
      </TabsContent>

      <TabsContent value="vehicle-import" className="space-y-4 mt-6">
        <VehicleImportTab />
      </TabsContent>
      
      <TabsContent value="roles" className="space-y-4 mt-6">
        <Card className="border-border">
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              <div className="text-lg font-medium mb-2">Role Management</div>
              <p className="text-sm">
                Advanced role and permission management interface coming soon...
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="import-history" className="space-y-4 mt-6">
        <Card className="border-border">
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              <div className="text-lg font-medium mb-2">Import History</div>
              <p className="text-sm">
                Import history and audit logs coming soon...
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default UserManagementTabs;
