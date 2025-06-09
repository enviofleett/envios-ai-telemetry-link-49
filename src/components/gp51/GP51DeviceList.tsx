
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { gp51ApiService } from '@/services/gp51/gp51ApiService';
import { Loader2, RefreshCw, MapPin, Clock, Signal } from 'lucide-react';

interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: number;
  simnum: string;
  overduetime: number;
  lastactivetime: number;
  isfree: number;
  allowedit: number;
  stared: number;
}

export const GP51DeviceList: React.FC = () => {
  const [devices, setDevices] = useState<GP51Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const fetchDevices = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await gp51ApiService.getDeviceList();
      
      if (result.success && result.devices) {
        setDevices(result.devices);
        toast({
          title: 'Devices Loaded',
          description: `Found ${result.devices.length} devices`
        });
      } else {
        setError(result.error || 'Failed to fetch devices');
        toast({
          title: 'Load Failed',
          description: result.error || 'Failed to fetch devices',
          variant: 'destructive'
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMsg);
      toast({
        title: 'Error',
        description: 'An error occurred while fetching devices',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const getDeviceTypeName = (type: number): string => {
    const types: { [key: number]: string } = {
      1: 'Vehicle Tracker',
      2: 'Personal Tracker',
      3: 'Asset Tracker',
      4: 'Pet Tracker',
      5: 'Fleet Tracker'
    };
    return types[type] || `Type ${type}`;
  };

  const getStatusBadge = (isfree: number) => {
    switch (isfree) {
      case 1:
        return <Badge className="bg-green-100 text-green-800">Normal</Badge>;
      case 2:
        return <Badge className="bg-blue-100 text-blue-800">Experiencing</Badge>;
      case 3:
        return <Badge variant="destructive">Disabled</Badge>;
      case 4:
        return <Badge className="bg-yellow-100 text-yellow-800">Fee Overdue</Badge>;
      case 5:
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatLastActive = (timestamp: number): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>GP51 Devices</CardTitle>
          <CardDescription>Manage your GP51 tracking devices</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchDevices} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>GP51 Devices</CardTitle>
            <CardDescription>
              Manage your GP51 tracking devices ({devices.length} total)
            </CardDescription>
          </div>
          <Button onClick={fetchDevices} disabled={isLoading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading devices...</span>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No devices found</p>
            <Button onClick={fetchDevices} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>SIM Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.deviceid}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{device.devicename}</p>
                        <p className="text-sm text-muted-foreground">ID: {device.deviceid}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getDeviceTypeName(device.devicetype)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Signal className="h-4 w-4 mr-1 text-gray-400" />
                        {device.simnum || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(device.isfree)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        {formatLastActive(device.lastactivetime)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <MapPin className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
