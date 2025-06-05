
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Car, CreditCard, BarChart3 } from 'lucide-react';
import GP51UserManagement from '@/components/fleet/GP51UserManagement';
import GP51DeviceManagement from '@/components/fleet/GP51DeviceManagement';
import IntelligentInsights from '@/components/dashboard/IntelligentInsights';

const FleetManagement = () => {
  const [activeTab, setActiveTab] = useState('users');

  // Mock insights data - this would come from actual API calls
  const mockInsights = {
    fuelEfficiencyTrend: [
      { date: '2024-01', efficiency: 8.5 },
      { date: '2024-02', efficiency: 8.2 },
      { date: '2024-03', efficiency: 8.7 },
      { date: '2024-04', efficiency: 8.4 },
      { date: '2024-05', efficiency: 8.8 },
      { date: '2024-06', efficiency: 8.6 }
    ],
    maintenanceAlerts: [
      { vehicleId: 'V001', type: 'Oil Change', dueIn: '5 days' },
      { vehicleId: 'V003', type: 'Tire Rotation', dueIn: '2 weeks' },
      { vehicleId: 'V007', type: 'Brake Inspection', dueIn: '1 month' }
    ],
    driverBehavior: {
      fleetScore: 85,
      topIssues: [
        { issue: 'Hard Braking', percentage: 15 },
        { issue: 'Speeding', percentage: 12 },
        { issue: 'Rapid Acceleration', percentage: 8 }
      ]
    },
    anomalies: [
      { vehicleId: 'V005', description: 'Unusual fuel consumption pattern', severity: 'medium' },
      { vehicleId: 'V002', description: 'GPS signal inconsistency', severity: 'low' }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-600 mt-1">Complete GP51 fleet management and intelligence platform</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Device Management
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Service & Billing
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Fleet Intelligence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <GP51UserManagement />
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <GP51DeviceManagement />
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Service & Billing Management</h3>
            <p className="text-gray-600 mb-4">
              Manage device subscriptions, renewals, and billing operations.
            </p>
            <p className="text-sm text-gray-500">
              Coming in Phase 3 - Service & Subscription Management
            </p>
          </div>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-4">
          <IntelligentInsights insights={mockInsights} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FleetManagement;
