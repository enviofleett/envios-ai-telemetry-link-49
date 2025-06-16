import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  MoreHorizontal, 
  Power, 
  Settings, 
  MapPin,
  Clock,
  Battery,
  Smartphone
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Define the Device type
interface Device {
  device_id: string;
  device_name: string;
  activation_status?: 'active' | 'inactive' | 'error' | 'unknown';
  updated_at?: string;
  gp51_metadata?: {
    imei?: number | string;
    [key: string]: any;
  };
  [key: string]: any;
}

// Define the props for the DeviceManagementTable component
interface DeviceManagementTableProps {
  devices: Device[];
  onDeviceSelect?: (device: Device) => void;
  onBulkActivate?: (deviceIds: string[]) => void;
  isLoading?: boolean;
  selectedDevices?: string[];
  onSelectionChange?: (deviceIds: string[]) => void;
}

const DeviceManagementTable: React.FC<DeviceManagementTableProps> = ({
  devices = [],
  onDeviceSelect,
  onBulkActivate,
  isLoading = false,
  selectedDevices = [],
  onSelectionChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'error'>('all');

  const handleDeviceSelection = (deviceId: string) => {
    const isSelected = selectedDevices.includes(deviceId);
    let newSelection: string[];

    if (isSelected) {
      newSelection = selectedDevices.filter(id => id !== deviceId);
    } else {
      newSelection = [...selectedDevices, deviceId];
    }

    onSelectionChange?.(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allDeviceIds = devices.map(device => device.device_id);
      onSelectionChange?.(allDeviceIds);
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleBulkActivate = () => {
    onBulkActivate?.(selectedDevices);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      const matchesSearch = searchTerm === '' || 
        device.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.device_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || device.activation_status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [devices, searchTerm, statusFilter]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Device Management
          </CardTitle>
          {selectedDevices.length > 0 && (
            <Button 
              onClick={handleBulkActivate}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Power className="h-4 w-4" />
              Activate Selected ({selectedDevices.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'error')}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="error">Error</option>
          </select>
        </div>

        {/* Device Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedDevices.length === filteredDevices.length && filteredDevices.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Device Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IMEI</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.map((device) => (
                <TableRow key={device.device_id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedDevices.includes(device.device_id)}
                      onCheckedChange={() => handleDeviceSelection(device.device_id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{device.device_name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        {device.device_id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(device.activation_status || 'unknown')}>
                      {device.activation_status || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {device.gp51_metadata?.imei ? String(device.gp51_metadata.imei) : '860123456789012'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {device.updated_at ? new Date(device.updated_at).toLocaleDateString() : 'Never'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onDeviceSelect?.(device)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MapPin className="h-4 w-4 mr-2" />
                          View Location
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Battery className="h-4 w-4 mr-2" />
                          Check Status
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredDevices.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No devices match your search criteria.' : 'No devices available.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeviceManagementTable;
