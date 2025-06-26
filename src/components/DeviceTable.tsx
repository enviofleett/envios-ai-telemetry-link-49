
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RefreshCw, Car } from 'lucide-react';
import type { GP51Device } from '@/types/gp51';

interface DeviceTableProps {
  devices: GP51Device[];
  loading: boolean;
  onRefresh: () => void;
}

const DeviceTable: React.FC<DeviceTableProps> = ({ devices, loading, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Safe property access helper
  const getDeviceProps = (device: GP51Device) => ({
    id: device.id || device.deviceid,
    device_name: device.device_name || device.devicename,
    device_id: device.device_id || device.deviceid,
    device_type: device.device_type || device.devicetype,
    sim_number: device.sim_number || device.simnum,
    last_active_time: device.last_active_time || device.lastactivetime,
    is_active: device.is_active ?? (device.status === 'active'),
    starred: device.starred ?? false,
    gps51_groups: typeof device.gps51_groups === 'string' ? device.gps51_groups : 'No Group'
  });

  const filteredDevices = devices.filter(device => {
    const props = getDeviceProps(device);
    return (
      props.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      props.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      props.gps51_groups.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getStatusBadge = (device: GP51Device) => {
    const props = getDeviceProps(device);
    if (props.is_active) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  const formatDate = (timestamp: number | null): string => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getStarredIcon = (starred: boolean) => {
    return starred ? '⭐' : '';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Devices ({filteredDevices.length})
            </CardTitle>
            <CardDescription>
              Manage and monitor your GP51 devices
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device ID</TableHead>
                <TableHead>Device Name</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SIM Number</TableHead>
                <TableHead>Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Loading devices...
                      </div>
                    ) : searchTerm ? (
                      `No devices found matching "${searchTerm}"`
                    ) : (
                      'No devices available. Try importing data from GP51.'
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredDevices.map((device) => {
                  const props = getDeviceProps(device);
                  return (
                    <TableRow key={props.id}>
                      <TableCell className="font-mono text-sm">
                        {props.device_id}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1">
                          {props.device_name}
                          {getStarredIcon(props.starred)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {props.gps51_groups}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(device)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {props.sim_number || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(props.last_active_time)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceTable;
