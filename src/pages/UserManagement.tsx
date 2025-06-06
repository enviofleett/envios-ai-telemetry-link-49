
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Users, UserCheck, UserPlus, Car, Database, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SummaryCard } from '@/components/ui/summary-card';
import ImportUsersDialog from '@/components/users/ImportUsersDialog';
import FullGP51ImportDialog from '@/components/admin/FullGP51ImportDialog';
import CreateUserDialog from '@/components/users/CreateUserDialog';
import VehicleAssignmentDialog from '@/components/users/VehicleAssignmentDialog';
import UserManagementTabs from '@/components/users/UserManagementTabs';

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

  // Mock data for summary cards (replace with real data)
  const summaryData = {
    totalUsers: 1247,
    activeUsers: 1198,
    pendingUsers: 23,
    vehiclesAssigned: 842
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage users, roles, and import data from GP51 platform
          </p>
        </div>
        
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button 
            variant="outline" 
            onClick={handleImportUsers}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Users
          </Button>
          <Button 
            onClick={() => setShowFullImportDialog(true)}
            className="flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            Full GP51 Import
            <Badge variant="secondary" className="ml-1 bg-accent/20 text-accent-foreground">
              New
            </Badge>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Users"
          value={summaryData.totalUsers}
          icon={Users}
          description="All registered users"
          trend={{ value: 12, isPositive: true }}
        />
        <SummaryCard
          title="Active Users"
          value={summaryData.activeUsers}
          icon={UserCheck}
          description="Currently active users"
          trend={{ value: 8, isPositive: true }}
        />
        <SummaryCard
          title="Pending Approvals"
          value={summaryData.pendingUsers}
          icon={UserPlus}
          description="Awaiting activation"
          trend={{ value: 3, isPositive: false }}
        />
        <SummaryCard
          title="Vehicles Assigned"
          value={summaryData.vehiclesAssigned}
          icon={Car}
          description="Total vehicle assignments"
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* Import Status Card */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-700 font-medium">
            Database cleaned and ready for fresh data
          </span>
        </div>
        <p className="text-xs text-green-600 mt-1">
          All previous data has been safely backed up and the system is ready for new imports
        </p>
      </div>

      {/* Main Content */}
      <UserManagementTabs
        refreshTrigger={refreshTrigger}
        onCreateUser={handleCreateUser}
        onEditUser={handleEditUser}
        onImportUsers={handleImportUsers}
        onAssignVehicles={handleAssignVehicles}
      />

      {/* Dialogs */}
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
  );
};

export default UserManagement;
