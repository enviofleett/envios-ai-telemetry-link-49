
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Car, Navigation, Eye, MapPin, Clock } from 'lucide-react';

interface UserVehicle {
  id: string;
  gp51_device_id: string;
  name: string;
  sim_number?: string;
  created_at: string;
  updated_at: string;
}

const UserVehicleOverview: React.FC = () => {
  const { user } = useAuth();

  const { data: userVehicles = [], isLoading } = useQuery({
    queryKey: ['user-vehicles-overview', user?.id],
    queryFn: async (): Promise<UserVehicle[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id, name, sim_number, created_at, updated_at')
        .eq('user_id', user.id)
        .order('name', { ascending: true })
        .limit(6); // Show only first 6 vehicles

      if (error) {
        console.error('Error fetching user vehicles:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const getStatusColor = () => {
    // For now, we'll use a default offline status since we don't have real-time data
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            My Vehicles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading vehicles...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userVehicles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            My Vehicles
          </CardTitle>
          <CardDescription>No vehicles assigned to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Car className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Contact your administrator to assign vehicles
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              My Vehicles
            </CardTitle>
            <CardDescription>
              {userVehicles.length} vehicle{userVehicles.length !== 1 ? 's' : ''} assigned
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.href = '/vehicles'}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {userVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                <div>
                  <p className="font-medium">{vehicle.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.gp51_device_id}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Offline
                </Badge>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.location.href = `/vehicles?vehicle=${vehicle.gp51_device_id}`}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.location.href = `/tracking?vehicle=${vehicle.gp51_device_id}`}
                  >
                    <Navigation className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {userVehicles.length >= 6 && (
            <div className="text-center pt-2">
              <Button 
                variant="link" 
                size="sm"
                onClick={() => window.location.href = '/vehicles'}
              >
                View all {userVehicles.length} vehicles →
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserVehicleOverview;
