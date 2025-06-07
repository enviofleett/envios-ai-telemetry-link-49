
import React from 'react';
import { Cog } from 'lucide-react';
import DeviceStatsCards from '@/components/devices/DeviceStatsCards';
import DeviceManagementTable from '@/components/devices/DeviceManagementTable';

const DeviceConfiguration: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Title Section */}
      <div className="bg-card border border-border p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <Cog className="h-6 w-6 text-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Device Configuration</h1>
        </div>
        <p className="text-muted-foreground">
          Manage GPS tracking devices, monitor status, and configure settings
        </p>
      </div>

      {/* Device Statistics Cards */}
      <DeviceStatsCards />

      {/* Device Management Table */}
      <DeviceManagementTable />
    </div>
  );
};

export default DeviceConfiguration;
