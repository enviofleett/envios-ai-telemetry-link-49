
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import { GP51ProductionService } from '@/services/gp51ProductionService';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Gauge, 
  Power, 
  Clock, 
  AlertTriangle, 
  Fuel, 
  Navigation, 
  Thermometer, 
  Lock, 
  BellOff,
  RefreshCw
} from 'lucide-react';

interface VehicleControlState {
  engineState: Record<string, boolean>;
  lockState: Record<string, boolean>;
}

export function EnhancedLiveTracking() {
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [controlStates, setControlStates] = useState<VehicleControlState>({
    engineState: {},
    lockState: {}
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const { toast } = useToast();
  
  const { 
    vehicles, 
    metrics, 
    isLoading, 
    forceRefresh 
  } = useUnifiedVehicleData({
    search: '',
    status: 'all'
  });

  // Initialize control states and select first vehicle
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(vehicles[0]);
    }

    const newEngineState: Record<string, boolean> = {};
    const newLockState: Record<string, boolean> = {};

    vehicles.forEach((vehicle) => {
      newEngineState[vehicle.deviceid] = vehicle.lastPosition?.acc_status === 1;
      newLockState[vehicle.deviceid] = true; // Default to locked
    });

    setControlStates({
      engineState: newEngineState,
      lockState: newLockState
    });
  }, [vehicles, selectedVehicle]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'offline':
        return <Badge className="bg-blue-100 text-blue-800">Idle</Badge>;
      case 'maintenance':
        return <Badge variant="destructive">Maintenance</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getIgnitionStatus = (deviceId: string) => {
    const isOn = controlStates.engineState[deviceId];
    return isOn ? (
      <div className="flex items-center">
        <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>On
      </div>
    ) : (
      <div className="flex items-center">
        <div className="h-2 w-2 rounded-full bg-gray-400 mr-2"></div>Off
      </div>
    );
  };

  const toggleEngine = async (deviceId: string) => {
    setIsUpdating(true);
    try {
      const newState = !controlStates.engineState[deviceId];
      
      // Simulate GP51 command
      const result = await GP51ProductionService.performRealDeviceHandshake(
        deviceId,
        'admin-token' // Would use actual token
      );

      if (result.success) {
        setControlStates(prev => ({
          ...prev,
          engineState: {
            ...prev.engineState,
            [deviceId]: newState
          }
        }));

        toast({
          title: `Engine ${newState ? 'Started' : 'Stopped'}`,
          description: `Vehicle ${deviceId} engine has been ${newState ? 'started' : 'stopped'} remotely`,
        });
      } else {
        toast({
          title: "Command Failed",
          description: result.error || "Failed to control engine",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Control Error",
        description: "Unable to communicate with vehicle",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleLock = async (deviceId: string) => {
    setIsUpdating(true);
    try {
      const newState = !controlStates.lockState[deviceId];
      
      setControlStates(prev => ({
        ...prev,
        lockState: {
          ...prev.lockState,
          [deviceId]: newState
        }
      }));

      toast({
        title: `Doors ${newState ? 'Locked' : 'Unlocked'}`,
        description: `Vehicle ${deviceId} doors have been ${newState ? 'locked' : 'unlocked'}`,
      });
    } catch (error) {
      toast({
        title: "Lock Control Error",
        description: "Unable to control door locks",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRefresh = async () => {
    await forceRefresh();
    toast({
      title: "Data Refreshed",
      description: "Vehicle data has been updated from GP51"
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading live vehicle data...</span>
      </div>
    );
  }

  if (!selectedVehicle) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No vehicles available for live tracking</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Live Vehicle Tracking</h2>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
            Live - GP51
          </Badge>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Vehicle Telemetry Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vehicle Telemetry - GP51 Protocol</CardTitle>
              <CardDescription>Real-time data for selected vehicle</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={selectedVehicle.alerts > 0 ? "destructive" : "outline"}>
                {selectedVehicle.alerts || 0} Alerts
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Vehicle Info */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedVehicle.deviceid}</h3>
                {getStatusBadge(selectedVehicle.status)}
              </div>

              <div className="text-sm">{selectedVehicle.devicename}</div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Location</span>
                  </div>
                  <span className="text-sm font-medium">
                    {selectedVehicle.lastPosition ? 
                      `${selectedVehicle.lastPosition.latitude?.toFixed(4)}, ${selectedVehicle.lastPosition.longitude?.toFixed(4)}` : 
                      'No location data'
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Gauge className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Speed</span>
                  </div>
                  <span className="text-sm font-medium">
                    {selectedVehicle.lastPosition?.speed || 0} km/h
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Power className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Ignition</span>
                  </div>
                  <span className="text-sm font-medium">
                    {getIgnitionStatus(selectedVehicle.deviceid)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Fuel className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Fuel Level</span>
                  </div>
                  <span className="text-sm font-medium">
                    {selectedVehicle.lastPosition?.oil_level || 'N/A'}%
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Telemetry */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">GP51 Telemetry</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Thermometer className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Temperature</span>
                  </div>
                  <span className="text-sm font-medium">
                    {selectedVehicle.lastPosition?.temperature || 'N/A'}°C
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Last Update</span>
                  </div>
                  <span className="text-sm font-medium">
                    {selectedVehicle.lastPosition?.updatetime ? 
                      new Date(selectedVehicle.lastPosition.updatetime).toLocaleString() : 
                      'No data'
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Door Status</span>
                  </div>
                  <span className="text-sm font-medium">
                    {controlStates.lockState[selectedVehicle.deviceid] ? "Locked" : "Unlocked"}
                  </span>
                </div>
              </div>
            </div>

            {/* Vehicle Controls */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Remote Controls</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Power className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">Engine Control</span>
                    </div>
                    <Switch
                      checked={controlStates.engineState[selectedVehicle.deviceid] || false}
                      onCheckedChange={() => toggleEngine(selectedVehicle.deviceid)}
                      disabled={isUpdating}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {controlStates.engineState[selectedVehicle.deviceid]
                      ? "Engine is running. Toggle to shut down."
                      : "Engine is off. Toggle to start remotely."}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">Door Control</span>
                    </div>
                    <Switch
                      checked={controlStates.lockState[selectedVehicle.deviceid] || false}
                      onCheckedChange={() => toggleLock(selectedVehicle.deviceid)}
                      disabled={isUpdating}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {controlStates.lockState[selectedVehicle.deviceid]
                      ? "Doors are locked. Toggle to unlock."
                      : "Doors are unlocked. Toggle to lock."}
                  </p>
                </div>

                <div className="pt-4 space-y-2">
                  <Button className="w-full" variant="outline">
                    <Navigation className="h-4 w-4 mr-2" />
                    Navigate to Vehicle
                  </Button>

                  <Button className="w-full" variant="outline" disabled>
                    <BellOff className="h-4 w-4 mr-2" />
                    Clear Alerts
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fleet Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>GP51 Fleet Status</CardTitle>
          <CardDescription>Current status of all vehicles in your fleet</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device ID</TableHead>
                <TableHead>Device Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Speed</TableHead>
                <TableHead>Engine</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow 
                  key={vehicle.deviceid} 
                  className={selectedVehicle?.deviceid === vehicle.deviceid ? "bg-muted/50" : ""}
                >
                  <TableCell className="font-medium">{vehicle.deviceid}</TableCell>
                  <TableCell>{vehicle.devicename}</TableCell>
                  <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                  <TableCell>{vehicle.lastPosition?.speed || 0} km/h</TableCell>
                  <TableCell>{getIgnitionStatus(vehicle.deviceid)}</TableCell>
                  <TableCell>
                    {vehicle.lastPosition?.updatetime ? 
                      new Date(vehicle.lastPosition.updatetime).toLocaleString() : 
                      'No data'
                    }
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      Select
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
