
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, Download, MoreVertical } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import DeviceStatusBadge from '@/components/devices/DeviceStatusBadge';
import BatteryIndicator from '@/components/devices/BatteryIndicator';
import SignalIndicator from '@/components/devices/SignalIndicator';
import DeviceDetailsModal from '@/components/devices/DeviceDetailsModal';
import AddDeviceModal from '@/components/devices/AddDeviceModal';
import { useDeviceManagement } from '@/hooks/useDeviceManagement';

const DeviceManagementTable: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const { devices, isLoading } = useDeviceManagement(searchQuery);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Device Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Device Management
            </CardTitle>
            <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Device
            </Button>
          </div>
          
          {/* Search and Filter Section */}
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search devices, IMEI, vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-28">Device ID</TableHead>
                  <TableHead className="w-32">Vehicle</TableHead>
                  <TableHead className="w-28">Type</TableHead>
                  <TableHead className="w-40">IMEI</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-20">Battery</TableHead>
                  <TableHead className="w-20">Signal</TableHead>
                  <TableHead className="w-28">Last Update</TableHead>
                  <TableHead className="w-24">Firmware</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices?.map((device) => (
                  <TableRow
                    key={device.device_id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedDevice(device.device_id)}
                  >
                    <TableCell className="font-medium text-blue-600">
                      {device.device_id}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{device.device_id}</span>
                        <span className="text-sm text-gray-500">
                          {device.license_plate || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">GPS Tracker</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {device.gp51_metadata?.imei || '860123456789012'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DeviceStatusBadge status="online" />
                    </TableCell>
                    <TableCell>
                      <BatteryIndicator level={85} />
                    </TableCell>
                    <TableCell>
                      <SignalIndicator strength={4} />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">2 mins ago</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">v2.1.3</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedDevice(device.device_id)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>Configure</DropdownMenuItem>
                          <DropdownMenuItem>Update Firmware</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Remove Device
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Device Details Modal */}
      {selectedDevice && (
        <DeviceDetailsModal
          deviceId={selectedDevice}
          isOpen={!!selectedDevice}
          onClose={() => setSelectedDevice(null)}
        />
      )}

      {/* Add Device Modal */}
      <AddDeviceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </>
  );
};

export default DeviceManagementTable;
