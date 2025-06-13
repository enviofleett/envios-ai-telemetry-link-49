
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  Navigation,
  Gauge,
  Clock,
  Activity,
  AlertTriangle,
  User,
  Car,
  ExternalLink,
  History,
  Bell
} from 'lucide-react';
import type { VehicleData } from '@/types/vehicle';

interface VehicleDetailsModalProps {
  vehicle: VehicleData | null;
  isOpen: boolean;
  onClose: () => void;
  onViewHistory?: (vehicle: VehicleData) => void;
  onSendAlert?: (vehicle: VehicleData) => void;
}

const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({
  vehicle,
  isOpen,
  onClose,
  onViewHistory,
  onSendAlert
}) => {
  if (!vehicle) return null;

  const getVehicleStatus = () => {
    if (!vehicle.last_position?.timestamp) return 'offline';
    
    const lastUpdate = new Date(vehicle.last_position.timestamp);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const formatLastUpdate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const status = getVehicleStatus();
  const hasAlert = vehicle.status?.toLowerCase().includes('alert') || 
                  vehicle.status?.toLowerCase().includes('alarm');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            {vehicle.device_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Overview */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant={status === 'online' ? 'default' : 'secondary'} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></div>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
              {hasAlert && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Alert Active
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {onViewHistory && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewHistory(vehicle)}
                >
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
              )}
              {onSendAlert && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSendAlert(vehicle)}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Alert
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Device Information</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Device ID:</span>
                  <span className="font-mono">{vehicle.device_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Device Name:</span>
                  <span>{vehicle.device_name}</span>
                </div>
                {vehicle.license_plate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">License Plate:</span>
                    <span>{vehicle.license_plate}</span>
                  </div>
                )}
                {vehicle.vin && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">VIN:</span>
                    <span className="font-mono text-xs">{vehicle.vin}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span>{vehicle.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Current Status</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600">Connection:</span>
                  </div>
                  <span className={`font-medium ${status === 'online' ? 'text-green-600' : 'text-gray-600'}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>
                {vehicle.status && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">System Status:</span>
                    <span>{vehicle.status}</span>
                  </div>
                )}
                {vehicle.envio_users && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">Assigned User:</span>
                    </div>
                    <span>{vehicle.envio_users.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Position Data */}
          {vehicle.last_position && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3">Latest Position Data</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Coordinates:</span>
                      </div>
                      <span className="font-mono text-sm">
                        {vehicle.last_position.lat.toFixed(6)}, {vehicle.last_position.lng.toFixed(6)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Gauge className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Speed:</span>
                      </div>
                      <span className="font-medium">{vehicle.last_position.speed || 0} km/h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Navigation className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Course:</span>
                      </div>
                      <span className="font-medium">{vehicle.last_position.course || 0}°</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Last Update:</span>
                      </div>
                      <span className="text-sm">
                        {formatLastUpdate(vehicle.last_position.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Timestamp:</span>
                      <span className="text-sm font-mono">
                        {new Date(vehicle.last_position.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <Separator />
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Map
              </Button>
              <Button size="sm">
                Track Live
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleDetailsModal;
