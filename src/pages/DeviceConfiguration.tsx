
import React from 'react';
import { Cog } from 'lucide-react';
import DeviceStatsCards from '@/components/devices/DeviceStatsCards';
import DeviceManagementTable from '@/components/devices/DeviceManagementTable';

const DeviceConfiguration: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Title Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <Cog className="h-6 w-6 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">Device Configuration</h1>
        </div>
        <p className="text-gray-600">
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
