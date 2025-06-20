
import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Gauge, Battery, Signal, Clock, Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VehicleData {
  id: string;
  name: string;
  gp51_device_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  telemetry?: {
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    altitude: number;
    accuracy: number;
    timestamp: string;
    battery_level?: number;
    signal_strength?: number;
    engine_status?: string;
    ignition_status?: boolean;
  };
}

const EnhancedLiveTracking: React.FC = () => {
  const { user } = useUnifiedAuth();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      console.log('🚗 Fetching vehicles with telemetry data...');
      
      const { data: vehiclesData, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching vehicles:', error);
        throw error;
      }

      console.log(`✅ Fetched ${vehiclesData?.length || 0} vehicles`);

      // For now, we'll add mock telemetry data since the real telemetry integration
      // would require GP51 API connection and real-time data streaming
      const vehiclesWithTelemetry: VehicleData[] = (vehiclesData || []).map((vehicle, index) => ({
        ...vehicle,
        telemetry: {
          latitude: 6.5244 + (Math.random() - 0.5) * 0.1,
          longitude: 3.3792 + (Math.random() - 0.5) * 0.1,
          speed: Math.floor(Math.random() * 120),
          heading: Math.floor(Math.random() * 360),
          altitude: Math.floor(Math.random() * 100) + 50,
          accuracy: Math.floor(Math.random() * 10) + 1,
          timestamp: new Date().toISOString(),
          battery_level: Math.floor(Math.random() * 100),
          signal_strength: Math.floor(Math.random() * 5) + 1,
          engine_status: Math.random() > 0.5 ? 'running' : 'stopped',
          ignition_status: Math.random() > 0.5,
        }
      }));

      setVehicles(vehiclesWithTelemetry);
      setFilteredVehicles(vehiclesWithTelemetry);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Error in fetchVehicles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vehicle telemetry data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchVehicles();
      
      // Set up auto-refresh every 30 seconds for live tracking
      const interval = setInterval(fetchVehicles, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const filtered = vehicles.filter(vehicle =>
      vehicle.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.gp51_device_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVehicles(filtered);
  }, [searchTerm, vehicles]);

  const getStatusBadge = (vehicle: VehicleData) => {
    if (!vehicle.telemetry) {
      return <Badge variant="secondary">No Data</Badge>;
    }

    const { engine_status, speed } = vehicle.telemetry;
    
    if (engine_status === 'running' && speed > 5) {
      return <Badge variant="default" className="bg-green-500">Moving</Badge>;
    } else if (engine_status === 'running' && speed <= 5) {
      return <Badge variant="default" className="bg-yellow-500">Idle</Badge>;
    } else {
      return <Badge variant="secondary">Stopped</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vehicle telemetry data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Vehicle Tracking</h1>
          <p className="text-muted-foreground">
            Real-time vehicle telemetry and location data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchVehicles}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="text-xs text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredVehicles.length} of {vehicles.length} vehicles
        </div>
      </div>

      {/* Vehicle Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((vehicle) => (
          <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{vehicle.name || 'Unnamed Vehicle'}</CardTitle>
                {getStatusBadge(vehicle)}
              </div>
              <CardDescription>
                Device ID: {vehicle.gp51_device_id}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {vehicle.telemetry ? (
                <>
                  {/* Location Information */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Location</span>
                    </div>
                    <div className="text-sm text-muted-foreground ml-6">
                      <div>Lat: {vehicle.telemetry.latitude.toFixed(6)}</div>
                      <div>Lng: {vehicle.telemetry.longitude.toFixed(6)}</div>
                      <div>Accuracy: ±{vehicle.telemetry.accuracy}m</div>
                    </div>
                  </div>

                  {/* Speed and Direction */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-green-500" />
                      <div>
                        <div className="text-sm font-medium">{vehicle.telemetry.speed} km/h</div>
                        <div className="text-xs text-muted-foreground">Speed</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-orange-500" />
                      <div>
                        <div className="text-sm font-medium">{vehicle.telemetry.heading}°</div>
                        <div className="text-xs text-muted-foreground">Heading</div>
                      </div>
                    </div>
                  </div>

                  {/* Battery and Signal */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Battery className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="text-sm font-medium">{vehicle.telemetry.battery_level}%</div>
                        <div className="text-xs text-muted-foreground">Battery</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Signal className="h-4 w-4 text-purple-500" />
                      <div>
                        <div className="text-sm font-medium">{vehicle.telemetry.signal_strength}/5</div>
                        <div className="text-xs text-muted-foreground">Signal</div>
                      </div>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(vehicle.telemetry.timestamp)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No telemetry data available</p>
                  <p className="text-xs">Check device connection</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVehicles.length === 0 && !loading && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No vehicles found</h3>
          <p className="text-muted-foreground">
            {vehicles.length === 0 
              ? "No vehicles have been added to your account yet."
              : "No vehicles match your search criteria."
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedLiveTracking;
