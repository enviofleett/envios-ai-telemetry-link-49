
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, RefreshCw, Settings, Shield, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { enhancedGP51SessionValidator } from '@/services/gp51/enhancedGP51ApiService';
import { useErrorTracking, usePerformanceMonitoring } from '@/hooks/useMonitoring';
import { vehicleImportService } from '@/services/gp51/vehicleImportService';

const ProductionGP51SyncControlPanel: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'running' | 'error' | 'success'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [sessionValid, setSessionValid] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [isValidating, setIsValidating] = useState(false);
  
  const { toast } = useToast();
  const { reportError } = useErrorTracking();
  const { startOperation, completeOperation } = usePerformanceMonitoring();

  useEffect(() => {
    validateSession();
    const interval = setInterval(validateSession, 30000); // Validate every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const validateSession = async () => {
    setIsValidating(true);
    try {
      const validation = await enhancedGP51SessionValidator.validateGP51Session();
      setSessionValid(validation.valid);
      
      if (!validation.valid) {
        await reportError(
          'session',
          'medium',
          'GP51 session validation failed',
          'gp51_sync',
          { error: validation.error }
        );
      }
    } catch (error) {
      console.error('Session validation error:', error);
      setSessionValid(false);
      await reportError(
        'session',
        'high',
        'Critical session validation failure',
        'gp51_sync',
        { error }
      );
    } finally {
      setIsValidating(false);
    }
  };

  const performSync = async (forceFullSync: boolean = false) => {
    if (!sessionValid) {
      toast({
        title: "Authentication Required",
        description: "Please re-authenticate with GP51 before syncing.",
        variant: "destructive",
      });
      return;
    }

    const operationId = `sync_${Date.now()}`;
    setSyncStatus('running');
    setSyncProgress(0);
    
    try {
      // Start performance monitoring
      startOperation(operationId, forceFullSync ? 'full_sync' : 'incremental_sync');
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const result = await vehicleImportService.importFromGP51(forceFullSync);
      
      clearInterval(progressInterval);
      setSyncProgress(100);
      
      // Complete performance monitoring
      await completeOperation(operationId, {
        recordsProcessed: result.statistics.totalDevicesProcessed,
        recordsSuccessful: result.statistics.newDevicesAdded + result.statistics.devicesUpdated,
        recordsFailed: result.statistics.errors,
        apiCallsMade: 1
      });

      if (result.success) {
        setSyncStatus('success');
        setLastSyncTime(new Date());
        toast({
          title: "Sync Completed Successfully",
          description: result.message,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      setSyncProgress(0);
      
      await reportError(
        'sync_operation',
        'high',
        'GP51 sync operation failed',
        'gp51_sync',
        { error, operationId, forceFullSync }
      );

      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : 'Unknown sync error',
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle>Production Sync Control</CardTitle>
          </div>
          <Badge variant={sessionValid ? "default" : "destructive"}>
            {sessionValid ? "Authenticated" : "Auth Required"}
          </Badge>
        </div>
        <CardDescription>
          Production-grade GP51 synchronization with enhanced monitoring and error recovery.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* System Health Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">System Health</span>
          </div>
          <Badge className={getStatusColor()}>
            {getStatusIcon()}
            <span className="ml-1 capitalize">{syncStatus}</span>
          </Badge>
        </div>

        {/* Session Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">GP51 Session</span>
          </div>
          <div className="flex items-center space-x-2">
            {isValidating && <RefreshCw className="h-3 w-3 animate-spin" />}
            <Badge variant={sessionValid ? "default" : "destructive"}>
              {sessionValid ? "Valid" : "Invalid"}
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        {syncStatus === 'running' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sync Progress</span>
              <span>{syncProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Last Sync Info */}
        {lastSyncTime && (
          <div className="text-sm text-gray-600">
            Last successful sync: {lastSyncTime.toLocaleString()}
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={() => performSync(false)}
            disabled={!sessionValid || syncStatus === 'running'}
            className="flex-1"
          >
            {syncStatus === 'running' ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Quick Sync
              </>
            )}
          </Button>
          
          <Button 
            onClick={() => performSync(true)}
            disabled={!sessionValid || syncStatus === 'running'}
            variant="outline"
          >
            Full Sync
          </Button>
        </div>

        {/* Validation Button */}
        <Button 
          onClick={validateSession}
          disabled={isValidating}
          variant="secondary"
          className="w-full"
        >
          {isValidating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Validate Session
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProductionGP51SyncControlPanel;
