
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sync, Database, Clock } from 'lucide-react';
import GP51SyncMonitor from '../GP51SyncMonitor';

const GP51SyncTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Sync className="h-5 w-5 text-blue-600" />
            <CardTitle>GP51 Vehicle Synchronization</CardTitle>
          </div>
          <CardDescription>
            Automated synchronization of vehicle data from GP51 platform with enhanced metadata and position tracking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <Database className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="font-semibold text-blue-800">Enhanced Data Sync</div>
                <div className="text-sm text-blue-600">Complete device metadata and positions</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <Clock className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="font-semibold text-green-800">Automated Scheduling</div>
                <div className="text-sm text-green-600">Regular synchronization via cron jobs</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-purple-50 rounded-lg">
              <Sync className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="font-semibold text-purple-800">Real-time Monitoring</div>
                <div className="text-sm text-purple-600">Track sync status and performance</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <GP51SyncMonitor />
    </div>
  );
};

export default GP51SyncTab;
