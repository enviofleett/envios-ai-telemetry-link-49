
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
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
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

  const formatLastUpdate = (updatetime: string) => {
    const date = new Date(updatetime);
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
            {vehicle.deviceName}
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
                  <span className="font-mono">{vehicle.deviceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Device Name:</span>
                  <span>{vehicle.deviceName}</span>
                </div>
                {vehicle.envio_user_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">User ID:</span>
                    <span className="font-mono text-xs">{vehicle.envio_user_id}</span>
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
              </div>
            </div>
          </div>

          {/* Position Data */}
          {vehicle.lastPosition && (
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
                        {vehicle.lastPosition.lat.toFixed(6)}, {vehicle.lastPosition.lon.toFixed(6)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Gauge className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Speed:</span>
                      </div>
                      <span className="font-medium">{vehicle.lastPosition.speed} km/h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Navigation className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Course:</span>
                      </div>
                      <span className="font-medium">{vehicle.lastPosition.course}°</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Last Update:</span>
                      </div>
                      <span className="text-sm">
                        {formatLastUpdate(vehicle.lastPosition.updatetime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Full Date:</span>
                      <span className="text-sm">
                        {new Date(vehicle.lastPosition.updatetime).toLocaleString()}
                      </span>
                    </div>
                    {vehicle.lastPosition.statusText && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Status Text:</span>
                        <span className="text-sm">{vehicle.lastPosition.statusText}</span>
                      </div>
                    )}
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
                <ExternalLink className="w-4 h-4 mr-2" />
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
