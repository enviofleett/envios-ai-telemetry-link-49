
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import FleetUserManagementTab from '@/components/settings/FleetUserManagementTab';

const UsersTab: React.FC = () => {
  return (
    <TabsContent value="users" className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Fleet User Management</h3>
        <p className="text-sm text-gray-600 mb-4">
          Manage fleet user roles, permissions, and GP51 access levels
        </p>
      </div>
      <FleetUserManagementTab />
    </TabsContent>
  );
};

export default UsersTab;
