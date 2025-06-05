
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Map, BarChart3, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import GP51ConnectionInfo from './AdminSettings/GP51ConnectionInfo';
import GP51CredentialsForm from './AdminSettings/GP51CredentialsForm';
import EnhancedMapApiManagement from './AdminSettings/EnhancedMapApiManagement';
import MapAnalyticsDashboard from '@/components/map/MapAnalyticsDashboard';
import GeofenceManager from '@/components/map/GeofenceManager';

const AdminSettings = () => {
  const { data: gp51Status, isLoading: statusLoading } = useQuery({
    queryKey: ['gp51-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Enhanced System Administration
          <Badge variant="outline" className="text-xs">
            Admin Only
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="gp51" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="gp51" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              GP51 Platform
            </TabsTrigger>
            <TabsTrigger value="maps" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Map APIs
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Map Analytics
            </TabsTrigger>
            <TabsTrigger value="geofencing" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Geofencing
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="gp51" className="space-y-4 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">GP51 LIVE Platform Connection</h3>
              <p className="text-sm text-gray-600 mb-4">
                Configure connection to GP51 platform for vehicle data synchronization
              </p>
            </div>
            <GP51ConnectionInfo 
              gp51Status={gp51Status} 
              statusLoading={statusLoading}
            />
            <GP51CredentialsForm />
          </TabsContent>
          
          <TabsContent value="maps" className="space-y-4 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Enhanced MapTiler API Management</h3>
              <p className="text-sm text-gray-600 mb-4">
                Advanced API key management with auto-switching, threshold monitoring, and performance analytics
              </p>
            </div>
            <EnhancedMapApiManagement />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Map Usage Analytics</h3>
              <p className="text-sm text-gray-600 mb-4">
                Comprehensive analytics for map usage, performance metrics, and user behavior
              </p>
            </div>
            <MapAnalyticsDashboard />
          </TabsContent>
          
          <TabsContent value="geofencing" className="space-y-4 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Geofencing Management</h3>
              <p className="text-sm text-gray-600 mb-4">
                Create and manage geographical boundaries with real-time vehicle monitoring
              </p>
            </div>
            <GeofenceManager />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminSettings;
