
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, Route, Download, Clock, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const GP51HistoricalData: React.FC = () => {
  const [deviceId, setDeviceId] = useState('');
  const [deviceIds, setDeviceIds] = useState('');
  const [beginTime, setBeginTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [timezone, setTimezone] = useState(8);
  const [includeTrips, setIncludeTrips] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 16);
  };

  const getDeviceTracks = async () => {
    if (!deviceId.trim() || !beginTime || !endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log(`Getting tracks for device: ${deviceId}`);

      const { data, error } = await supabase.functions.invoke('gp51-historical-data', {
        body: {
          action: 'get_device_tracks',
          deviceId: deviceId.trim(),
          beginTime,
          endTime,
          timezone
        }
      });

      if (error) throw error;

      if (data.success) {
        setResults({
          type: 'tracks',
          data: data.data
        });
        toast({
          title: "Tracks Retrieved",
          description: data.message
        });
      } else {
        throw new Error(data.error || 'Failed to get tracks');
      }
    } catch (error) {
      console.error('Failed to get tracks:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to get tracks',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceTrips = async () => {
    if (!deviceId.trim() || !beginTime || !endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log(`Getting trips for device: ${deviceId}`);

      const { data, error } = await supabase.functions.invoke('gp51-historical-data', {
        body: {
          action: 'get_device_trips',
          deviceId: deviceId.trim(),
          beginTime,
          endTime,
          timezone
        }
      });

      if (error) throw error;

      if (data.success) {
        setResults({
          type: 'trips',
          data: data.data
        });
        toast({
          title: "Trips Retrieved",
          description: data.message
        });
      } else {
        throw new Error(data.error || 'Failed to get trips');
      }
    } catch (error) {
      console.error('Failed to get trips:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to get trips',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMultiDeviceData = async () => {
    if (!deviceIds.trim() || !beginTime || !endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const deviceIdArray = deviceIds.split(',').map(id => id.trim()).filter(id => id);
    if (deviceIdArray.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one device ID",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log(`Getting data for ${deviceIdArray.length} devices`);

      const { data, error } = await supabase.functions.invoke('gp51-historical-data', {
        body: {
          action: 'get_multi_device_data',
          deviceIds: deviceIdArray,
          beginTime,
          endTime,
          timezone,
          includeTrips
        }
      });

      if (error) throw error;

      if (data.success) {
        setResults({
          type: 'multi_device',
          data: data.data
        });
        toast({
          title: "Multi-Device Data Retrieved",
          description: data.message
        });
      } else {
        throw new Error(data.error || 'Failed to get multi-device data');
      }
    } catch (error) {
      console.error('Failed to get multi-device data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to get multi-device data',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportHistoricalData = async () => {
    if (!deviceIds.trim() || !beginTime || !endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields for export",
        variant: "destructive"
      });
      return;
    }

    const deviceIdArray = deviceIds.split(',').map(id => id.trim()).filter(id => id);
    if (deviceIdArray.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one device ID",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log(`Exporting historical data for ${deviceIdArray.length} devices`);

      const { data, error } = await supabase.functions.invoke('gp51-historical-data', {
        body: {
          action: 'export_historical_data',
          deviceIds: deviceIdArray,
          beginTime,
          endTime,
          timezone,
          format: 'json'
        }
      });

      if (error) throw error;

      if (data.success) {
        // Create downloadable file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gp51-historical-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Export Complete",
          description: data.message
        });
      } else {
        throw new Error(data.error || 'Export failed');
      }
    } catch (error) {
      console.error('Failed to export historical data:', error);
      toast({
        title: "Export Error",
        description: error instanceof Error ? error.message : 'Failed to export data',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            GP51 Historical Data
          </CardTitle>
          <CardDescription>
            Retrieve tracks, trips, and historical data from GP51 devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="beginTime">Begin Time</Label>
              <Input
                id="beginTime"
                type="datetime-local"
                value={formatDateTime(beginTime)}
                onChange={(e) => setBeginTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formatDateTime(endTime)}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="timezone">Timezone Offset</Label>
            <Input
              id="timezone"
              type="number"
              value={timezone}
              onChange={(e) => setTimezone(parseInt(e.target.value) || 8)}
              placeholder="8"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Single Device Operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="singleDeviceId">Device ID</Label>
            <Input
              id="singleDeviceId"
              placeholder="Enter device ID"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={getDeviceTracks} disabled={isLoading}>
              <MapPin className="h-4 w-4 mr-2" />
              Get Tracks
            </Button>
            <Button onClick={getDeviceTrips} disabled={isLoading}>
              <Route className="h-4 w-4 mr-2" />
              Get Trips
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Multi-Device Operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="multiDeviceIds">Device IDs (comma-separated)</Label>
            <Textarea
              id="multiDeviceIds"
              placeholder="Enter device IDs separated by commas"
              value={deviceIds}
              onChange={(e) => setDeviceIds(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="includeTrips"
              checked={includeTrips}
              onCheckedChange={setIncludeTrips}
            />
            <Label htmlFor="includeTrips">Include trip data</Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={getMultiDeviceData} disabled={isLoading}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Get Multi-Device Data
            </Button>
            <Button onClick={exportHistoricalData} disabled={isLoading} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Historical Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            {results.type === 'tracks' && (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Badge variant="outline">
                    Device: {results.data.deviceId}
                  </Badge>
                  <Badge variant="outline">
                    Points: {results.data.totalPoints}
                  </Badge>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <pre className="text-xs bg-muted p-4 rounded">
                    {JSON.stringify(results.data.tracks.slice(0, 5), null, 2)}
                    {results.data.tracks.length > 5 && '\n... and more'}
                  </pre>
                </div>
              </div>
            )}

            {results.type === 'trips' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{results.data.summary.totalTrips}</div>
                    <div className="text-sm text-muted-foreground">Total Trips</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{results.data.summary.totalDistance}</div>
                    <div className="text-sm text-muted-foreground">Distance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{results.data.summary.maxSpeed}</div>
                    <div className="text-sm text-muted-foreground">Max Speed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{results.data.summary.avgSpeed}</div>
                    <div className="text-sm text-muted-foreground">Avg Speed</div>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <pre className="text-xs bg-muted p-4 rounded">
                    {JSON.stringify(results.data.trips.slice(0, 3), null, 2)}
                    {results.data.trips.length > 3 && '\n... and more'}
                  </pre>
                </div>
              </div>
            )}

            {results.type === 'multi_device' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{results.data.summary.totalDevices}</div>
                    <div className="text-sm text-muted-foreground">Total Devices</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{results.data.summary.successfulDevices}</div>
                    <div className="text-sm text-muted-foreground">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{results.data.summary.failedDevices}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{results.data.summary.totalTrackPoints}</div>
                    <div className="text-sm text-muted-foreground">Track Points</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {results.data.devices.map((device: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant={device.success ? "default" : "destructive"}>
                          {device.deviceId}
                        </Badge>
                        <span className="text-sm">
                          {device.success ? `${device.trackCount} points` : device.error}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GP51HistoricalData;
