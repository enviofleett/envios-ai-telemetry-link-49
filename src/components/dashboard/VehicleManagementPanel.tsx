
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Car, AlertTriangle } from 'lucide-react';
import { useEnhancedVehicleData } from '@/hooks/useEnhancedVehicleData';

export const VehicleManagementPanel: React.FC = () => {
  const { vehicles, isLoading, error, syncStatus, forceSync } = useEnhancedVehicleData();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicle Management
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicle Management
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Error loading vehicles</p>
            <Button onClick={forceSync} variant="outline" size="sm" className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicle Management
            <Badge variant="secondary">
              {vehicles.length} vehicles
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={syncStatus.isSync ? "default" : "secondary"}>
              {syncStatus.isSync ? 'Syncing' : 'Ready'}
            </Badge>
            <Button 
              onClick={forceSync} 
              disabled={syncStatus.isSync}
              variant="outline" 
              size="sm"
            >
              {syncStatus.isSync ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {vehicles.filter(v => !v.isOnline).length}
              </div>
              <div className="text-sm text-gray-600">Offline</div>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Last sync: {syncStatus.lastSync.toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
