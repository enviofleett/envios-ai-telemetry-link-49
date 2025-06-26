
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Wifi, WifiOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useEnhancedVehicleData } from '@/hooks/useEnhancedVehicleData';

export const RealtimeSyncStatus: React.FC = () => {
  const { 
    syncStatus, 
    isConnected, 
    forceSync, 
    isLoading, 
    isRefreshing,
    lastUpdate,
    vehicles 
  } = useEnhancedVehicleData();

  const handleForceSync = async () => {
    await forceSync();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
            Realtime Sync Status
          </CardTitle>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {vehicles.length}
            </div>
            <div className="text-sm text-gray-600">Total Vehicles</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {vehicles.filter(v => v.isOnline).length}
            </div>
            <div className="text-sm text-gray-600">Online</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {vehicles.filter(v => v.isMoving).length}
            </div>
            <div className="text-sm text-gray-600">Moving</div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            {syncStatus.isSync ? (
              <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <div>
              <div className="text-sm font-medium">
                {syncStatus.isSync ? 'Syncing...' : 'Last Sync'}
              </div>
              <div className="text-xs text-gray-600">
                {lastUpdate.toLocaleString()}
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleForceSync}
            disabled={isLoading || isRefreshing}
            variant="outline"
            size="sm"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Force Sync
              </>
            )}
          </Button>
        </div>

        {!isConnected && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <div className="text-sm text-red-700">
              Connection lost. Vehicle positions may not be current.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
