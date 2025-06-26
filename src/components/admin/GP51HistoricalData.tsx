
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, Download, Calendar, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { gp51DataService } from '@/services/gp51/GP51DataService';
import type { GP51DeviceData } from '@/types/gp51-unified';

interface HistoricalDataFilters {
  dateRange: {
    start: string;
    end: string;
  };
  deviceType: string;
  status: string;
  searchTerm: string;
}

const GP51HistoricalData: React.FC = () => {
  const [devices, setDevices] = useState<GP51DeviceData[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<GP51DeviceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HistoricalDataFilters>({
    dateRange: {
      start: '',
      end: ''
    },
    deviceType: '',
    status: '',
    searchTerm: ''
  });
  const { toast } = useToast();

  const fetchHistoricalData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await gp51DataService.getDataDirectly();
      
      if (response.success && response.data) {
        const deviceData = Array.isArray(response.data) ? response.data : [];
        setDevices(deviceData);
        setFilteredDevices(deviceData);
        
        toast({
          title: "Success",
          description: `Loaded ${deviceData.length} historical records`,
        });
      } else {
        throw new Error(response.error || 'Failed to fetch historical data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch historical data';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = devices;

    // Apply search filter
    if (filters.searchTerm) {
      filtered = filtered.filter(device =>
        device.deviceName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        device.deviceId.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(device => {
        const deviceStatus = device.isActive ? 'active' : 'inactive';
        return deviceStatus === filters.status;
      });
    }

    // Apply device type filter
    if (filters.deviceType) {
      filtered = filtered.filter(device => 
        (device.deviceType || 'unknown').toLowerCase().includes(filters.deviceType.toLowerCase())
      );
    }

    setFilteredDevices(filtered);
  };

  const clearFilters = () => {
    setFilters({
      dateRange: { start: '', end: '' },
      deviceType: '',
      status: '',
      searchTerm: ''
    });
    setFilteredDevices(devices);
  };

  const exportData = () => {
    const csvData = filteredDevices.map(device => ({
      'Device ID': device.deviceId,
      'Device Name': device.deviceName,
      'Device Type': device.deviceType || 'Unknown',
      'Status': device.isActive ? 'Active' : 'Inactive',
      'Group ID': device.groupId || '',
      'Group Name': device.groupName || '',
      'SIM Number': device.simNumber || '',
      'Last Active': device.lastActiveTime ? 
        (typeof device.lastActiveTime === 'string' ? device.lastActiveTime : device.lastActiveTime.toISOString()) : 
        'Never'
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `gp51-historical-data-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredDevices.length} records to CSV`,
    });
  };

  const getStatusBadge = (device: GP51DeviceData) => {
    const isActive = device.isActive;
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const formatDate = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return 'Never';
    
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
  };

  useEffect(() => {
    fetchHistoricalData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, devices]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Historical Data</h2>
          <p className="text-gray-600">View and analyze historical device data from GP51</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={exportData} disabled={filteredDevices.length === 0} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={fetchHistoricalData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Device Type</label>
              <Input
                placeholder="Filter by type..."
                value={filters.deviceType}
                onChange={(e) => setFilters(prev => ({ ...prev, deviceType: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button onClick={clearFilters} variant="outline" className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Device Records ({filteredDevices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-600 mb-4 p-3 bg-red-50 rounded-md">
              Error: {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Loading historical data...
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No historical data found</p>
              <p className="text-sm text-gray-500">Try adjusting your filters or refreshing the data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDevices.map((device) => (
                <div key={`${device.deviceId}-${device.deviceId}`} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{device.deviceName}</h4>
                      <p className="text-sm text-gray-600">ID: {device.deviceId}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Type: {device.deviceType || 'Unknown'}</span>
                        {device.groupName && <span>Group: {device.groupName}</span>}
                        {device.simNumber && <span>SIM: {device.simNumber}</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(device)}
                      <div className="text-right text-sm">
                        <div className="text-gray-500">Last Active</div>
                        <div className="font-medium">{formatDate(device.lastActiveTime)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51HistoricalData;
