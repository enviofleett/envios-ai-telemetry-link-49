
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { gp51DataService } from '@/services/gp51/GP51DataService';
import { CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw, Settings, Activity, Database, Shield } from 'lucide-react';
import type { GP51HealthStatus, GP51Device } from '@/types/gp51-unified';
import { formatTimeString, createDefaultHealthStatus } from '@/types/gp51-unified';

const GPS51Dashboard: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<GP51HealthStatus>(createDefaultHealthStatus());
  const [devices, setDevices] = useState<GP51Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const { toast } = useToast();

  const createMockHealthStatus = (connected: boolean, error?: string): GP51HealthStatus => {
    return {
      status: connected ? 'connected' : 'disconnected',
      lastCheck: new Date().toISOString(), // Fixed: Date to string
      isConnected: connected,
      lastPingTime: new Date().toISOString(), // Fixed: Date to string
      connectionQuality: connected ? 'excellent' : 'poor',
      errorCount: connected ? 0 : 1,
      md5TestPassed: connected,
      success: connected,
      isHealthy: connected,
      connectionStatus: connected ? 'connected' : 'disconnected',
      errorMessage: error,
      activeDevices: connected ? 5 : 0,
      tokenValid: connected,
      sessionValid: connected,
      responseTime: connected ? 150 : 0
    };
  };

  const checkConnectionHealth = async () => {
    setIsLoading(true);
    try {
      const health = await gp51DataService.getHealthStatus();
      setHealthStatus(health);
      setConnectionAttempts(prev => prev + 1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Health check failed';
      setHealthStatus(createMockHealthStatus(false, errorMessage));
    } finally {
      setIsLoading(false);
      setLastRefresh(new Date());
    }
  };

  const testConnection = async () => {
    setIsConnecting(true);
    try {
      const result = await gp51DataService.testConnection();
      if (result.success) {
        toast({
          title: "Connection Test Successful",
          description: "GP51 API is responding correctly",
        });
        setHealthStatus(createMockHealthStatus(true));
      } else {
        toast({
          title: "Connection Test Failed",
          description: result.error || "Unable to connect to GP51 API",
          variant: "destructive",
        });
        setHealthStatus(createMockHealthStatus(false, result.error));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
      setHealthStatus(createMockHealthStatus(false, errorMessage));
    } finally {
      setIsConnecting(false);
      setConnectionAttempts(prev => prev + 1);
    }
  };

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const result = await gp51DataService.queryMonitorList();
      if (result.success && result.data) {
        setDevices(result.data);
        toast({
          title: "Devices Loaded",
          description: `Found ${result.data.length} devices`,
        });
      } else {
        throw new Error(result.error || 'Failed to fetch devices');
      }
    } catch (error) {
      toast({
        title: "Failed to Load Devices",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConnectionHealth();
  }, []);

  const getStatusIcon = () => {
    if (isLoading || isConnecting) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
    
    switch (healthStatus.status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'testing':
        return <Activity className="h-5 w-5 text-blue-500" />;
      case 'error':
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    const variant = healthStatus.isConnected ? 'default' : 'destructive';
    const text = healthStatus.isConnected ? 'Connected' : 'Disconnected';
    
    return <Badge variant={variant}>{text}</Badge>;
  };

  // Fixed: Handle missing properties with fallbacks
  const errorMessage = healthStatus.errorMessage || healthStatus.lastError || healthStatus.error;
  const lastCheckFormatted = formatTimeString(healthStatus.lastCheck); // Fixed: use formatTimeString
  const activeDevicesCount = healthStatus.activeDevices || 0; // Fixed: provide fallback
  const isTokenValid = healthStatus.tokenValid || false; // Fixed: provide fallback
  const isSessionValid = healthStatus.sessionValid || false; // Fixed: provide fallback

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">GP51 Integration Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and manage your GP51 vehicle tracking connection</p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          {getStatusBadge()}
        </div>
      </div>

      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Connection Status
              </CardTitle>
              <CardDescription>
                Current GP51 API connection health and diagnostics
              </CardDescription>
            </div>
            <Button 
              onClick={checkConnectionHealth} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{connectionAttempts}</div>
              <div className="text-sm text-gray-600">Connection Tests</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{activeDevicesCount}</div>
              <div className="text-sm text-gray-600">Active Devices</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{lastCheckFormatted}</div>
              <div className="text-sm text-gray-600">Last Check</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{healthStatus.responseTime || 0}ms</div>
              <div className="text-sm text-gray-600">Response Time</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Connection Quality</span>
              <span className="text-sm text-gray-600 capitalize">{healthStatus.connectionQuality}</span>
            </div>
            <Progress 
              value={healthStatus.connectionQuality === 'excellent' ? 100 : 
                     healthStatus.connectionQuality === 'good' ? 75 : 25} 
              className="h-2"
            />
          </div>

          <div className="flex space-x-4">
            <Button onClick={testConnection} disabled={isConnecting} className="flex-1">
              {isConnecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Activity className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
            <Button onClick={fetchDevices} disabled={isLoading} variant="outline" className="flex-1">
              <Database className="h-4 w-4 mr-2" />
              Load Devices
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
          <CardDescription>GP51 API authentication and session information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Token Valid</span>
              <Badge variant={isTokenValid ? 'default' : 'destructive'}>
                {isTokenValid ? 'Valid' : 'Invalid'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Session Active</span>
              <Badge variant={isSessionValid ? 'default' : 'destructive'}>
                {isSessionValid ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Devices Summary */}
      {devices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Devices</CardTitle>
            <CardDescription>Summary of GP51 devices and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{devices.length}</div>
                <div className="text-sm text-blue-600">Total Devices</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {devices.filter(d => d.isfree === 1).length}
                </div>
                <div className="text-sm text-green-600">Active Devices</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {devices.filter(d => d.isfree !== 1).length}
                </div>
                <div className="text-sm text-red-600">Inactive Devices</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GPS51Dashboard;
