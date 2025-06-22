
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, AlertTriangle, BarChart3, Settings } from 'lucide-react';
import ErrorTrackingDashboard from '../monitoring/ErrorTrackingDashboard';
import PerformanceMonitoringDashboard from '../monitoring/PerformanceMonitoringDashboard';
import SystemHealthDashboard from '../SystemHealthDashboard';

const MonitoringTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <CardTitle>System Monitoring & Alerts</CardTitle>
          </div>
          <CardDescription>
            Comprehensive monitoring dashboard for system health, performance, and error tracking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="font-semibold text-blue-800">Error Tracking</div>
                <div className="text-sm text-blue-600">Real-time error monitoring</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <BarChart3 className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="font-semibold text-green-800">Performance Metrics</div>
                <div className="text-sm text-green-600">Sync operation monitoring</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-purple-50 rounded-lg">
              <Activity className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="font-semibold text-purple-800">System Health</div>
                <div className="text-sm text-purple-600">Overall system status</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="health" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="health" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>System Health</span>
          </TabsTrigger>
          <TabsTrigger value="errors" className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Error Tracking</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-6">
          <SystemHealthDashboard />
        </TabsContent>

        <TabsContent value="errors" className="space-y-6">
          <ErrorTrackingDashboard />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceMonitoringDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringTab;
