
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Bell,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Wrench,
  Package,
  Plus
} from 'lucide-react';
import type { Vehicle } from '@/services/unifiedVehicleData';
import { VehicleOverviewTab } from './tabs/VehicleOverviewTab';
import { VehicleSubscriptionTab } from './tabs/VehicleSubscriptionTab';
import { VehicleMaintenanceTab } from './tabs/VehicleMaintenanceTab';
import { VehicleOwnerTab } from './tabs/VehicleOwnerTab';

interface VehicleDetailsModalProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onViewHistory?: (vehicle: Vehicle) => void;
  onSendAlert?: (vehicle: Vehicle) => void;
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

  const status = getVehicleStatus();
  const hasAlert = vehicle.status?.toLowerCase().includes('alert') || 
                  vehicle.status?.toLowerCase().includes('alarm');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            {vehicle.devicename}
          </DialogTitle>
          <DialogDescription>Comprehensive vehicle information and management</DialogDescription>
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

          {/* Tabbed Content */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="owner">Owner Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <VehicleOverviewTab vehicle={vehicle} status={status} />
            </TabsContent>

            <TabsContent value="subscription" className="space-y-4">
              <VehicleSubscriptionTab vehicle={vehicle} />
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4">
              <VehicleMaintenanceTab vehicle={vehicle} />
            </TabsContent>

            <TabsContent value="owner" className="space-y-4">
              <VehicleOwnerTab vehicle={vehicle} />
            </TabsContent>
          </Tabs>

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
