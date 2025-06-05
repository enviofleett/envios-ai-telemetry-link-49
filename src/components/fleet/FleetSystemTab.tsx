
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import GP51UsernameConsistencyManager from './GP51UsernameConsistencyManager';
import SystemHealthDashboard from './SystemHealthDashboard';
import type { SyncMetrics } from '@/services/vehiclePosition/types';

interface FleetSystemTabProps {
  syncMetrics: SyncMetrics;
}

const FleetSystemTab: React.FC<FleetSystemTabProps> = ({ syncMetrics }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">System Management</h2>
        <p className="text-gray-600">
          Comprehensive system health monitoring, data consistency management, and performance analytics
        </p>
      </div>
      
      {/* System Health Monitoring */}
      <SystemHealthDashboard />
      
      {/* Data Consistency Management */}
      <GP51UsernameConsistencyManager />
      
      {/* Legacy System Health (kept for comparison) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Legacy Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium mb-2">Data Sync Status</div>
              <div className={`px-2 py-1 rounded text-xs ${
                syncMetrics.errors === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {syncMetrics.errors === 0 ? 'Healthy' : `${syncMetrics.errors} Errors`}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium mb-2">Last Sync</div>
              <div className="text-sm text-gray-600">
                {syncMetrics.lastSyncTime.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetSystemTab;
