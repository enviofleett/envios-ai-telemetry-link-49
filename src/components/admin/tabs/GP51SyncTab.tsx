
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Database, Clock, Settings, BarChart3, Shield, Zap, Brain } from 'lucide-react';
import GP51SyncMonitor from '../GP51SyncMonitor';
import GP51SyncControlPanel from '../GP51SyncControlPanel';
import GP51RealTimeMonitor from '../GP51RealTimeMonitor';
import GP51ErrorRecoverySystem from '../GP51ErrorRecoverySystem';
import GP51PerformanceOptimizer from '../GP51PerformanceOptimizer';
import GP51AnalyticsDashboard from '../GP51AnalyticsDashboard';
import FleetAnalyticsDashboard from '../analytics/FleetAnalyticsDashboard';

const GP51SyncTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            <CardTitle>GP51 Vehicle Synchronization</CardTitle>
          </div>
          <CardDescription>
            Enhanced automated synchronization with real-time monitoring, performance optimization, and intelligent error recovery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <Database className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="font-semibold text-blue-800">Enhanced Data Sync</div>
                <div className="text-sm text-blue-600">Complete metadata and positions</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <Clock className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="font-semibold text-green-800">Real-Time Monitoring</div>
                <div className="text-sm text-green-600">Live progress and status updates</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-purple-50 rounded-lg">
              <Zap className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="font-semibold text-purple-800">Performance Optimized</div>
                <div className="text-sm text-purple-600">Intelligent batching and caching</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-orange-50 rounded-lg">
              <Shield className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <div className="font-semibold text-orange-800">Auto-Recovery</div>
                <div className="text-sm text-orange-600">Intelligent error handling</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="realtime" className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Real-Time</span>
          </TabsTrigger>
          <TabsTrigger value="recovery" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Recovery</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Intelligence</span>
          </TabsTrigger>
          <TabsTrigger value="legacy" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Legacy</span>
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

        <TabsContent value="recovery" className="space-y-6">
          <GP51ErrorRecoverySystem />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <GP51PerformanceOptimizer />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <GP51AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-6">
          <FleetAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="legacy" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GP51SyncControlPanel />
            <GP51SyncMonitor />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GP51SyncTab;
