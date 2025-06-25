
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Download } from 'lucide-react';
import { gps51DataService } from '@/services/gp51/GPS51DataService';
import type { GPS51Device, GPS51Position } from '@/types/gp51';

const GP51HistoricalData: React.FC = () => {
  const [devices, setDevices] = useState<GPS51Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [historicalData, setHistoricalData] = useState<GPS51Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const result = await gps51DataService.getDataDirectly();
      if (result.success && result.data) {
        setDevices(result.data.devices.slice(0, 100));
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const loadHistoricalData = async () => {
    if (!selectedDevice) return;

    setLoading(true);
    try {
      // Mock historical data for now - replace with actual API call
      const mockData: GPS51Position[] = [
        {
          id: '1',
          device_id: selectedDevice,
          latitude: 40.7128,
          longitude: -74.0060,
          speed: 45.5,
          course: 180,
          update_time: new Date().toISOString(),
          moving: true,
          address: 'New York, NY',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          device_id: selectedDevice,
          latitude: 40.7589,
          longitude: -73.9851,
          speed: 0,
          course: 0,
          update_time: new Date(Date.now() - 3600000).toISOString(),
          moving: false,
          address: 'Times Square, NY',
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      
      setHistoricalData(mockData);
    } catch (error) {
      console.error('Failed to load historical data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Time', 'Latitude', 'Longitude', 'Speed', 'Moving', 'Address'],
      ...historicalData.map(position => [
        position.update_time || '',
        position.latitude?.toString() || '',
        position.longitude?.toString() || '',
        position.speed?.toString() || '',
        position.moving ? 'Yes' : 'No',
        position.address || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historical_data_${selectedDevice}_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            GPS51 Historical Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Select value={selectedDevice} onValueChange={setSelectedDevice}>
              <SelectTrigger>
                <SelectValue placeholder="Select Device" />
              </SelectTrigger>
              <SelectContent>
                {devices.map(device => (
                  <SelectItem key={device.device_id} value={device.device_id}>
                    {device.device_name} ({device.device_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            
            <Button
              onClick={loadHistoricalData}
              disabled={loading || !selectedDevice}
            >
              {loading ? 'Loading...' : 'Load Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {historicalData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Historical Positions ({historicalData.length} records)
              </CardTitle>
              <Button onClick={exportData} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Latitude</TableHead>
                    <TableHead>Longitude</TableHead>
                    <TableHead>Speed</TableHead>
                    <TableHead>Moving</TableHead>
                    <TableHead>Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicalData.slice(0, 100).map((position, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">
                        {position.update_time ? 
                          new Date(position.update_time).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {position.latitude?.toFixed(6) || 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {position.longitude?.toFixed(6) || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {position.speed?.toFixed(1) || 'N/A'} km/h
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          position.moving ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {position.moving ? 'Moving' : 'Stopped'}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {position.address || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {historicalData.length > 100 && (
              <p className="text-center text-gray-500 text-sm mt-4">
                Showing first 100 records. Export CSV for complete data.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GP51HistoricalData;
