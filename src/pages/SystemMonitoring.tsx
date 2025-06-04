
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Activity, Database, Wifi, Clock } from 'lucide-react';
import Layout from '@/components/Layout';
import PollingControls from '@/components/dashboard/PollingControls';
import SystemHealth from '@/components/dashboard/SystemHealth';
import RealTimeStatus from '@/components/dashboard/RealTimeStatus';
import { usePollingManager } from '@/hooks/usePollingManager';

const SystemMonitoring = () => {
  const pollingManager = usePollingManager({
    intervalSeconds: 30,
    autoStart: false,
    maxRetries: 3
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
            <p className="text-gray-600 mt-1">
              Monitor and control real-time data synchronization with GP51 LIVE
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={pollingManager.isRunning ? "default" : "secondary"}>
              {pollingManager.isRunning ? "Polling Active" : "Polling Inactive"}
            </Badge>
          </div>
        </div>

        {/* System Health Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SystemHealth />
          <PollingControls />
          <RealTimeStatus />
        </div>

        <Separator />

        {/* Detailed Monitoring */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Polling Manager
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {pollingManager.isRunning ? "30s" : "Stopped"}
                  </div>
                  <div className="text-sm text-gray-500">Update Interval</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {pollingManager.errorCount}
                  </div>
                  <div className="text-sm text-gray-500">Error Count</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <Badge variant={pollingManager.isRunning ? "default" : "secondary"}>
                    {pollingManager.isRunning ? "Running" : "Stopped"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Currently Updating:</span>
                  <Badge variant={pollingManager.isUpdating ? "default" : "outline"}>
                    {pollingManager.isUpdating ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                Real-time performance data will be displayed here as the system runs.
              </div>
              
              {pollingManager.lastUpdateTime && (
                <div className="text-xs text-gray-500">
                  Last Update: {new Date(pollingManager.lastUpdateTime).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 space-y-2">
            <p>1. <strong>Check System Health:</strong> Ensure GP51 connection and database are healthy.</p>
            <p>2. <strong>Start Polling:</strong> Use the "Start Auto-Polling" button to begin real-time updates.</p>
            <p>3. <strong>Monitor Performance:</strong> Watch for errors and verify data is flowing correctly.</p>
            <p>4. <strong>Manual Updates:</strong> Use "Manual Update" to trigger immediate data refresh.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SystemMonitoring;
