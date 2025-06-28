
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  MapPin, 
  Navigation, 
  Clock,
  MoreVertical,
  Truck,
  Circle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { gps51TrackingService, Device } from '@/services/gps51/GPS51TrackingService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DeviceListPanelProps {
  onDeviceSelect?: (device: Device) => void;
  selectedDeviceId?: string;
  className?: string;
}

const DeviceListPanel: React.FC<DeviceListPanelProps> = ({
  onDeviceSelect,
  selectedDeviceId,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'moving' | 'parked'>('all');

  const {
    data: deviceData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['gps51-devices'],
    queryFn: () => gps51TrackingService.queryDeviceList(),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000 // Consider data stale after 30 seconds
  });

  const devices = deviceData?.devices || [];

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.devicename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.deviceid.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-blue-500';
      case 'moving': return 'bg-green-500';
      case 'parked': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'moving': return 'Moving';
      case 'parked': return 'Parked';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  const getFreeStatusText = (isfree: number) => {
    switch (isfree) {
      case 1: return 'Normal';
      case 2: return 'Trial';
      case 3: return 'Disabled';
      case 4: return 'Overdue';
      case 5: return 'Expired';
      default: return 'Unknown';
    }
  };

  const handleDeviceAction = (action: string, device: Device) => {
    console.log(`${action} action for device:`, device.deviceid);
    // Actions will be implemented based on requirements
    switch (action) {
      case 'track':
        if (onDeviceSelect) {
          onDeviceSelect(device);
        }
        break;
      case 'history':
        // Navigate to history view
        break;
      case 'settings':
        // Open device settings
        break;
    }
  };

  if (error) {
    return (
      <Card className={`bg-red-900/20 border-red-700 ${className}`}>
        <CardContent className="p-4">
          <div className="text-red-400 text-center">
            <p>Failed to load devices</p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="mt-2 border-red-600 text-red-400"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-400" />
            Fleet Devices
            <Badge variant="secondary" className="bg-blue-600 text-white">
              {filteredDevices.length}
            </Badge>
          </div>
          <Button
            onClick={() => refetch()}
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className="text-gray-300 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter === 'all' ? 'All' : getStatusText(statusFilter)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700">
              <DropdownMenuItem 
                onClick={() => setStatusFilter('all')}
                className="text-gray-300 focus:bg-gray-700"
              >
                All Devices
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setStatusFilter('online')}
                className="text-gray-300 focus:bg-gray-700"
              >
                Online
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setStatusFilter('moving')}
                className="text-gray-300 focus:bg-gray-700"
              >
                Moving
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setStatusFilter('parked')}
                className="text-gray-300 focus:bg-gray-700"
              >
                Parked
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setStatusFilter('offline')}
                className="text-gray-300 focus:bg-gray-700"
              >
                Offline
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Device List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading devices...
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No devices found</p>
              {searchTerm && (
                <p className="text-sm mt-1">Try adjusting your search or filter</p>
              )}
            </div>
          ) : (
            filteredDevices.map((device) => (
              <Card
                key={device.deviceid}
                className={`border-gray-600 transition-all duration-200 cursor-pointer hover:border-blue-500 ${
                  selectedDeviceId === device.deviceid 
                    ? 'bg-blue-900/30 border-blue-500' 
                    : 'bg-gray-700/50 hover:bg-gray-700'
                }`}
                onClick={() => onDeviceSelect && onDeviceSelect(device)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)}`} />
                        <h3 className="font-medium text-white truncate">
                          {device.devicename}
                        </h3>
                        <Badge variant="outline" className="text-xs border-gray-500 text-gray-300">
                          {getFreeStatusText(device.isfree)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Circle className="h-3 w-3" />
                          <span>ID: {device.deviceid}</span>
                        </div>
                        {device.simnum && (
                          <div className="flex items-center gap-1">
                            <Navigation className="h-3 w-3" />
                            <span>SIM: {device.simnum}</span>
                          </div>
                        )}
                        {device.lastactivetime > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Last: {new Date(device.lastactivetime * 1000).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge 
                        className={`${getStatusColor(device.status)} text-white border-0`}
                      >
                        {getStatusText(device.status)}
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-gray-800 border-gray-700">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeviceAction('track', device);
                            }}
                            className="text-gray-300 focus:bg-gray-700"
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            Track Device
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeviceAction('history', device);
                            }}
                            className="text-gray-300 focus:bg-gray-700"
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            View History
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeviceAction('settings', device);
                            }}
                            className="text-gray-300 focus:bg-gray-700"
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            Settings
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceListPanel;
