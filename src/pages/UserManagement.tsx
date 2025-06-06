
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Database, Plus } from 'lucide-react';
import UserManagementTable from '@/components/users/UserManagementTable';
import ImportUsersDialog from '@/components/users/ImportUsersDialog';
import FullGP51ImportDialog from '@/components/admin/FullGP51ImportDialog';
import CreateUserDialog from '@/components/users/CreateUserDialog';
import VehicleAssignmentDialog from '@/components/users/VehicleAssignmentDialog';

const UserManagement = () => {
  const { user } = useAuth();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showFullImportDialog, setShowFullImportDialog] = useState(false);
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [showVehicleAssignmentDialog, setShowVehicleAssignmentDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleImportComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCreateUser = () => {
    setShowCreateUserDialog(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setShowCreateUserDialog(true);
  };

  const handleImportUsers = () => {
    setShowImportDialog(true);
  };

  const handleAssignVehicles = (user: any) => {
    setSelectedUser(user);
    setShowVehicleAssignmentDialog(true);
  };

  const handleUserDialogClose = () => {
    setShowCreateUserDialog(false);
    setSelectedUser(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleVehicleAssignmentClose = () => {
    setShowVehicleAssignmentDialog(false);
    setSelectedUser(null);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
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
              onClick={() => setShowImportDialog(true)}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Import Users
            </Button>
            <Button 
              onClick={() => setShowFullImportDialog(true)}
              className="flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Full GP51 Import
              <Badge variant="secondary" className="ml-1">New</Badge>
            </Button>
          </div>
        </div>

        {/* Import Options Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Import Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setShowImportDialog(true)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold">User Import</h3>
                  <Badge variant="outline">Standard</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Import users from GP51 platform with passwordless authentication setup
                </p>
              </div>
              
              <div 
                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setShowFullImportDialog(true)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Database className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold">Full System Import</h3>
                  <Badge variant="default">Enhanced</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Comprehensive import with data cleanup, backup, and rollback capabilities
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="import-history">Import History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-4">
            <UserManagementTable 
              refreshTrigger={refreshTrigger}
              onCreateUser={handleCreateUser}
              onEditUser={handleEditUser}
              onImportUsers={handleImportUsers}
              onAssignVehicles={handleAssignVehicles}
            />
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

        {/* Import Dialogs */}
        <ImportUsersDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          onImportComplete={handleImportComplete}
        />

        <FullGP51ImportDialog
          open={showFullImportDialog}
          onOpenChange={setShowFullImportDialog}
          onImportComplete={handleImportComplete}
        />

        {/* User Management Dialogs */}
        <CreateUserDialog
          open={showCreateUserDialog}
          onOpenChange={handleUserDialogClose}
          editUser={selectedUser}
        />

        <VehicleAssignmentDialog
          open={showVehicleAssignmentDialog}
          onOpenChange={handleVehicleAssignmentClose}
          user={selectedUser}
        />
      </div>
    </div>
  );
};

export default UserManagement;
