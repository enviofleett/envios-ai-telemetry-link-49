
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Car, 
  MapPin, 
  Clock, 
  Fuel, 
  Gauge, 
  User, 
  Power, 
  PowerOff,
  Wrench,
  FileText,
  Navigation,
  Activity
} from 'lucide-react';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface VehicleDetailPanelProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onEngineControl?: (vehicleId: string, action: 'shutdown' | 'enable') => void;
  onGenerateReport?: (vehicleId: string) => void;
  onAssignWorkshop?: (vehicleId: string) => void;
  canControlEngine?: boolean;
  isLoading?: boolean;
}

const VehicleDetailPanel: React.FC<VehicleDetailPanelProps> = ({
  vehicle,
  isOpen,
  onClose,
  onEngineControl,
  onGenerateReport,
  onAssignWorkshop,
  canControlEngine = false,
  isLoading = false
}) => {
  if (!vehicle) return null;

  const getVehicleStatus = () => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'idle':
        return <Badge className="bg-yellow-100 text-yellow-800">Idle</Badge>;
      default:
        return <Badge variant="secondary">Offline</Badge>;
    }
  };

  const status = getVehicleStatus();
  const lastUpdate = vehicle.lastPosition?.updatetime ? 
    new Date(vehicle.lastPosition.updatetime).toLocaleString() : 'Never';

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Slide-out Panel */}
      <div className={`
        fixed right-0 top-0 h-full w-96 bg-background border-l shadow-xl z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <Car className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">{vehicle.devicename}</h3>
                <p className="text-sm text-muted-foreground">ID: {vehicle.deviceid}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Status Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Vehicle Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Current Status</span>
                  {getStatusBadge(status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Update</span>
                  <span className="text-sm text-muted-foreground">{lastUpdate}</span>
                </div>
                {vehicle.lastPosition && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Speed: {vehicle.lastPosition.speed || 0} km/h</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Course: {vehicle.lastPosition.course || 0}°</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {vehicle.lastPosition.lat.toFixed(6)}, {vehicle.lastPosition.lon.toFixed(6)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Telemetry Charts */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Quick Telemetry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Fuel className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                    <div className="text-lg font-semibold">85%</div>
                    <div className="text-xs text-muted-foreground">Fuel Level</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <div className="text-lg font-semibold">8.2h</div>
                    <div className="text-xs text-muted-foreground">Engine Hours</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Gauge className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                    <div className="text-lg font-semibold">245km</div>
                    <div className="text-xs text-muted-foreground">Daily Distance</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <User className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                    <div className="text-lg font-semibold">12</div>
                    <div className="text-xs text-muted-foreground">Trips Today</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contextual Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {canControlEngine && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={() => onEngineControl?.(vehicle.deviceid, 'shutdown')}
                      disabled={isLoading || status === 'offline'}
                    >
                      <PowerOff className="h-4 w-4 mr-2" />
                      Emergency Shutdown
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={() => onEngineControl?.(vehicle.deviceid, 'enable')}
                      disabled={isLoading || status === 'offline'}
                    >
                      <Power className="h-4 w-4 mr-2" />
                      Enable Engine
                    </Button>
                    <Separator />
                  </>
                )}
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => onGenerateReport?.(vehicle.deviceid)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => onAssignWorkshop?.(vehicle.deviceid)}
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Assign Workshop
                </Button>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Vehicle Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Device ID</span>
                  <span className="font-mono">{vehicle.deviceid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Device Name</span>
                  <span>{vehicle.devicename}</span>
                </div>
                {vehicle.lastPosition?.statusText && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status Text</span>
                    <span className="font-mono text-xs">{vehicle.lastPosition.statusText}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default VehicleDetailPanel;
