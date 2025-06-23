
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Database, Clock, Settings, BarChart3, Shield } from 'lucide-react';
import GP51SyncMonitor from '../GP51SyncMonitor';
import GP51SyncControlPanel from '../GP51SyncControlPanel';
import GP51RealTimeMonitor from '../GP51RealTimeMonitor';
import GP51PerformanceOptimizer from '../GP51PerformanceOptimizer';

const GP51SyncTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            <CardTitle>GP51 Vehicle Synchronization - Production Ready</CardTitle>
          </div>
          <CardDescription>
            Production-grade vehicle synchronization with enhanced monitoring, error handling, and performance optimization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <Database className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="font-semibold text-blue-800">Production Sync</div>
                <div className="text-sm text-blue-600">Enterprise-grade reliability</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <Clock className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="font-semibold text-green-800">Real-Time Monitoring</div>
                <div className="text-sm text-green-600">Live status with alerts</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-purple-50 rounded-lg">
              <Shield className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="font-semibold text-purple-800">Production Hardened</div>
                <div className="text-sm text-purple-600">Error recovery & monitoring</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="realtime" className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Real-Time</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GP51SyncControlPanel />
            <GP51SyncMonitor />
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <GP51RealTimeMonitor />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <GP51PerformanceOptimizer />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GP51SyncTab;
