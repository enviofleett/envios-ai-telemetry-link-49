
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Database, Upload, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface SyncResult {
  success: boolean;
  data?: {
    type: string;
    statistics: {
      totalDevices: number;
      totalPositions: number;
      persistedVehicles: number;
      persistedPositions: number;
      persistenceErrors: number;
    };
    metadata: {
      fetchedAt: string;
      syncType: string;
      sessionUsername: string;
    };
  };
  error?: string;
}

const GP51DataSyncTab: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);
  const { toast } = useToast();

  const handleSync = async (forceFullSync: boolean = false) => {
    setIsLoading(true);
    
    try {
      console.log(`🚀 Starting ${forceFullSync ? 'full' : 'incremental'} GP51 data sync...`);
      
      const { data, error } = await supabase.functions.invoke('fetchLiveGp51Data', {
        body: { forceFullSync }
      });

      if (error) {
        console.error('❌ Sync error:', error);
        toast({
          title: "Sync Failed",
          description: `Failed to sync GP51 data: ${error.message}`,
          variant: "destructive"
        });
        setLastSync({ success: false, error: error.message });
        return;
      }

      if (!data.success) {
        console.error('❌ Sync failed:', data.error);
        toast({
          title: "Sync Failed",
          description: data.error || 'Unknown error occurred',
          variant: "destructive"
        });
        setLastSync({ success: false, error: data.error });
        return;
      }

      console.log('✅ Sync completed successfully:', data.data);
      setLastSync({ success: true, data: data.data });
      
      toast({
        title: "Sync Completed",
        description: `Successfully synced ${data.data.statistics.persistedVehicles} vehicles and ${data.data.statistics.persistedPositions} positions from GP51`,
      });

    } catch (error) {
      console.error('💥 Critical sync error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Sync Error",
        description: errorMessage,
        variant: "destructive"
      });
      setLastSync({ success: false, error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const getSyncStatusBadge = () => {
    if (!lastSync) return <Badge variant="secondary">Never Synced</Badge>;
    if (lastSync.success) return <Badge variant="default">Success</Badge>;
    return <Badge variant="destructive">Failed</Badge>;
  };

  const formatSyncTime = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            GP51 Data Synchronization
          </CardTitle>
          <CardDescription>
            Sync vehicle data and positions from GP51 API to your Supabase database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => handleSync(false)}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Incremental Sync
            </Button>
            
            <Button 
              onClick={() => handleSync(true)}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Full Sync
            </Button>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Incremental Sync:</strong> Updates existing vehicles with latest position data.
              <br />
              <strong>Full Sync:</strong> Re-imports all devices and their complete data from GP51.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Last Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                {getSyncStatusBadge()}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Sync:</span>
                <span className="text-sm text-muted-foreground">
                  {formatSyncTime(lastSync?.data?.metadata.fetchedAt)}
                </span>
              </div>

              {lastSync?.data && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sync Type:</span>
                  <Badge variant="outline">
                    {lastSync.data.metadata.syncType}
                  </Badge>
                </div>
              )}
            </div>

            {lastSync?.data && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Devices Found:</span>
                  <span className="text-sm font-mono">
                    {lastSync.data.statistics.totalDevices}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Vehicles Persisted:</span>
                  <span className="text-sm font-mono">
                    {lastSync.data.statistics.persistedVehicles}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Positions Updated:</span>
                  <span className="text-sm font-mono">
                    {lastSync.data.statistics.persistedPositions}
                  </span>
                </div>

                {lastSync.data.statistics.persistenceErrors > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-red-600">Errors:</span>
                    <span className="text-sm font-mono text-red-600">
                      {lastSync.data.statistics.persistenceErrors}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {lastSync?.error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {lastSync.error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. <strong>Data Fetching:</strong> Connects to GP51 API using stored credentials</p>
          <p>2. <strong>Device Discovery:</strong> Retrieves all devices from your GP51 account</p>
          <p>3. <strong>Position Sync:</strong> Fetches latest position data for all devices</p>
          <p>4. <strong>Database Update:</strong> Stores/updates vehicle data in your Supabase database</p>
          <p>5. <strong>Ready for Assignment:</strong> Vehicles are now available for user assignment</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51DataSyncTab;
