
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Wrench, BarChart3 } from 'lucide-react';

interface DeviceMaintenanceTabProps {
  deviceId: string;
}

const DeviceMaintenanceTab: React.FC<DeviceMaintenanceTabProps> = ({ deviceId }) => {
  const maintenanceData = {
    lastService: '2024-05-15',
    nextService: '2024-08-15',
    warrantyExpiry: '2025-01-15'
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Maintenance Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Maintenance Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <span className="text-gray-600">Last Service</span>
              <span className="font-medium">{maintenanceData.lastService}</span>
              
              <span className="text-gray-600">Next Service</span>
              <span className="font-medium">{maintenanceData.nextService}</span>
              
              <span className="text-gray-600">Warranty Expiry</span>
              <span className="font-medium">{maintenanceData.warrantyExpiry}</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Maintenance
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Update Firmware
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Wrench className="h-4 w-4 mr-2" />
              Run Diagnostics
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeviceMaintenanceTab;
