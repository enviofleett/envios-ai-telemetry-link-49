
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MaintenanceStatsCards from './MaintenanceStatsCards';
import MaintenanceAppointmentsList from './MaintenanceAppointmentsList';
import ConnectedWorkshopsList from './ConnectedWorkshopsList';
import { MaintenanceHistory } from './MaintenanceHistory';

const DatabaseIntegratedMaintenancePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Maintenance Management</h1>
        <p className="text-muted-foreground">
          Manage your vehicle maintenance, appointments, and workshop connections
        </p>
      </div>

      {/* Stats Overview */}
      <MaintenanceStatsCards />

      {/* Main Content Tabs */}
      <Tabs defaultValue="appointments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="workshops">Workshops</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          <MaintenanceAppointmentsList />
        </TabsContent>

        <TabsContent value="workshops" className="space-y-4">
          <ConnectedWorkshopsList />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <MaintenanceHistory />
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">Maintenance Schedules</h3>
            <p className="text-muted-foreground">
              Automated maintenance scheduling based on time and mileage will be displayed here
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DatabaseIntegratedMaintenancePage;
