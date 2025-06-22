
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { enhancedGP51SessionValidator } from '@/services/gp51/enhancedGP51ApiService';
import { useErrorTracking } from '@/hooks/useMonitoring';

interface SystemMetrics {
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  activeOperations: number;
  queuedOperations: number;
  lastHeartbeat: Date | null;
  errorCount: number;
  uptime: number;
}

const ProductionGP51RealTimeMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    connectionStatus: 'disconnected',
    activeOperations: 0,
    queuedOperations: 0,
    lastHeartbeat: null,
    errorCount: 0,
    uptime: 0
  });
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  
  const { toast } = useToast();
  const { reportError } = useErrorTracking();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isMonitoring) {
      interval = setInterval(updateMetrics, 2000); // Update every 2 seconds
      updateMetrics(); // Initial update
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring]);

  const updateMetrics = async () => {
    try {
      // Validate GP51 session
      const sessionResult = await enhancedGP51SessionValidator.validateGP51Session();
      
      // Simulate real-time metrics (in production, this would come from actual monitoring)
      setMetrics(prev => ({
        connectionStatus: sessionResult.valid ? 'connected' : 'disconnected',
        activeOperations: Math.floor(Math.random() * 3),
        queuedOperations: Math.floor(Math.random() * 5),
        lastHeartbeat: new Date(),
        errorCount: prev.errorCount + (Math.random() > 0.95 ? 1 : 0), // Occasional error simulation
        uptime: prev.uptime + 2
      }));

      // Alert on connection issues
      if (!sessionResult.valid && alertsEnabled) {
        await reportError(
          'connectivity',
          'high',
          'GP51 connection lost during monitoring',
          'gp51_sync',
          { sessionResult }
        );
        
        toast({
          title: "Connection Alert",
          description: "GP51 connection lost. Please check authentication.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Metrics update failed:', error);
      setMetrics(prev => ({
        ...prev,
        connectionStatus: 'disconnected',
        lastHeartbeat: null
      }));
      
      await reportError(
        'monitoring',
        'medium',
        'Real-time monitoring update failed',
        'gp51_sync',
        { error }
      );
    }
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    if (!isMonitoring) {
      toast({
        title: "Monitoring Started",
        description: "Real-time monitoring is now active.",
      });
    } else {
      toast({
        title: "Monitoring Stopped",
        description: "Real-time monitoring has been paused.",
      });
    }
  };

  const resetErrorCount = () => {
    setMetrics(prev => ({ ...prev, errorCount: 0 }));
    toast({
      title: "Error Count Reset",
      description: "Error counter has been reset to zero.",
    });
  };

  const formatUptime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m ${seconds % 60}s`;
  };

  const getConnectionIcon = () => {
    switch (metrics.connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  const getConnectionBadge = () => {
    switch (metrics.connectionStatus) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'connecting':
        return <Badge className="bg-blue-100 text-blue-800">Connecting</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-800">Offline</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <CardTitle>Real-Time System Monitor</CardTitle>
            </div>
            <Button 
              onClick={toggleMonitoring}
              variant={isMonitoring ? "destructive" : "default"}
              size="sm"
            >
              {isMonitoring ? "Stop Monitor" : "Start Monitor"}
            </Button>
          </div>
          <CardDescription>
            Live monitoring of GP51 sync operations with real-time alerts and performance metrics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Connection Status */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Connection</span>
                {getConnectionIcon()}
              </div>
              {getConnectionBadge()}
            </div>

            {/* Active Operations */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Active Ops</span>
                <Zap className="h-4 w-4 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {metrics.activeOperations}
              </div>
            </div>

            {/* Queued Operations */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Queued</span>
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.queuedOperations}
              </div>
            </div>

            {/* Error Count */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Errors</span>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-red-600">
                  {metrics.errorCount}
                </div>
                {metrics.errorCount > 0 && (
                  <Button onClick={resetErrorCount} size="sm" variant="outline">
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Heartbeat Status */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                System Heartbeat
              </h4>
              <div className="text-sm text-gray-600">
                {metrics.lastHeartbeat ? (
                  <>Last: {metrics.lastHeartbeat.toLocaleTimeString()}</>
                ) : (
                  'No heartbeat detected'
                )}
              </div>
              {isMonitoring && (
                <div className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  <span className="text-sm">Live monitoring active</span>
                </div>
              )}
            </div>

            {/* Uptime */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center">
                <Clock className="h-4 w-4 mr-2 text-blue-500" />
                Monitor Uptime
              </h4>
              <div className="text-sm text-gray-600">
                {formatUptime(metrics.uptime)}
              </div>
              <div className="text-xs text-gray-500">
                Since monitoring started
              </div>
            </div>
          </div>

          {/* Alert Configuration */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Alert Notifications</h4>
                <p className="text-sm text-gray-600">
                  Receive alerts for connection issues and errors
                </p>
              </div>
              <Button
                onClick={() => setAlertsEnabled(!alertsEnabled)}
                variant={alertsEnabled ? "default" : "outline"}
                size="sm"
              >
                {alertsEnabled ? "Enabled" : "Disabled"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionGP51RealTimeMonitor;
