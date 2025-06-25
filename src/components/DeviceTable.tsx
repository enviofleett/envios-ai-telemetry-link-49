
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RefreshCw, Car } from 'lucide-react';
import type { GPS51Device } from '@/types/gp51';

interface DeviceTableProps {
  devices: GPS51Device[];
  loading: boolean;
  onRefresh: () => void;
}

const DeviceTable: React.FC<DeviceTableProps> = ({ devices, loading, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDevices = devices.filter(device =>
    device.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (device.gps51_groups?.group_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (device: GPS51Device) => {
    if (device.is_active) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  const formatDate = (timestamp: number | null): string => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
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
              Manage and monitor your GPS51 devices
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Table */}
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
                      'No devices available. Try importing data from GPS51.'
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredDevices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-mono text-sm">
                      {device.device_id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {device.device_name}
                    </TableCell>
                    <TableCell>
                      {device.gps51_groups?.group_name || 'No Group'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(device)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {device.sim_number || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(device.last_active_time)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceTable;
