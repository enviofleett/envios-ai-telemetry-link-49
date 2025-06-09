
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import { 
  Search, 
  Filter,
  RefreshCw,
  Wifi,
  WifiOff,
  Car,
  MapPin,
  BarChart3
} from 'lucide-react';
import LiveMapAndVehicleList from './LiveMapAndVehicleList';
import VehicleStatusCard from './VehicleStatusCard';
import VehicleStatisticsModal from './VehicleStatisticsModal';
import VehicleProfileTab from './VehicleProfileTab';
import type { Vehicle } from '@/services/unifiedVehicleData';

const EnhancedLiveTrackingPage: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [isEngineControlLoading, setIsEngineControlLoading] = useState(false);
  
  const { toast } = useToast();
  const { 
    vehicles, 
    metrics, 
    isLoading, 
    isRefreshing, 
    forceRefresh 
  } = useUnifiedVehicleData();

  // Mock user role - in real implementation, this would come from auth
  const userRole = 'admin'; // 'admin', 'fleet_manager', 'user'
  const canControlEngine = userRole === 'admin' || userRole === 'fleet_manager';

  const getVehicleStatus = (vehicle: Vehicle) => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const getStatistics = () => {
    const onlineVehicles = vehicles.filter(v => getVehicleStatus(v) === 'online');
    const offlineVehicles = vehicles.filter(v => getVehicleStatus(v) === 'offline');
    
    return {
      online: onlineVehicles.length,
      offline: offlineVehicles.length,
      total: vehicles.length
    };
  };

  const statistics = getStatistics();

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    console.log('Vehicle selected:', vehicle);
  };

  const handleEngineShutdown = async (vehicleId: string) => {
    if (!canControlEngine) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to control vehicle engines.',
        variant: 'destructive'
      });
      return;
    }

    setIsEngineControlLoading(true);
    try {
      // Mock API call - in real implementation, this would call GP51 API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Engine Shutdown Initiated',
        description: `Vehicle ${vehicleId} engine shutdown command sent successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Engine Control Failed',
        description: 'Failed to send engine shutdown command. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsEngineControlLoading(false);
    }
  };

  const handleEngineEnable = async (vehicleId: string) => {
    if (!canControlEngine) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to control vehicle engines.',
        variant: 'destructive'
      });
      return;
    }

    setIsEngineControlLoading(true);
    try {
      // Mock API call - in real implementation, this would call GP51 API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Engine Enable Initiated',
        description: `Vehicle ${vehicleId} engine enable command sent successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Engine Control Failed',
        description: 'Failed to send engine enable command. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsEngineControlLoading(false);
    }
  };

  const handleWorkshopAssign = async (vehicleId: string, workshopId: string) => {
    try {
      // Mock API call - in real implementation, this would save to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Workshop Assigned',
        description: `Vehicle ${vehicleId} has been assigned to the selected workshop.`,
      });
    } catch (error) {
      toast({
        title: 'Assignment Failed',
        description: 'Failed to assign workshop. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleReportGenerate = async (vehicleId: string, reportType: string, dateRange: { from: Date; to: Date }) => {
    try {
      // Mock API call - in real implementation, this would generate and download report
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Report Generated',
        description: `${reportType} report for vehicle ${vehicleId} has been generated and will be downloaded shortly.`,
      });
    } catch (error) {
      toast({
        title: 'Report Generation Failed',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.devicename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.deviceid.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const vehicleStatus = getVehicleStatus(vehicle);
    const statusMatch = statusFilter === 'online' ? vehicleStatus === 'online' : vehicleStatus === 'offline';
    return matchesSearch && statusMatch;
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Monitoring & Management</h1>
          <p className="text-gray-600 mt-1">
            Real-time tracking and control of your fleet vehicles
          </p>
        </div>
        <Button
          onClick={forceRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Real-Time Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowOnlineModal(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehicles Online</CardTitle>
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{statistics.online}</div>
            <p className="text-xs text-muted-foreground">Click to view details</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowOfflineModal(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehicles Offline</CardTitle>
            <WifiOff className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{statistics.offline}</div>
            <p className="text-xs text-muted-foreground">Click to view details</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fleet</CardTitle>
            <Car className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{statistics.total}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.total > 0 ? ((statistics.online / statistics.total) * 100).toFixed(1) : 0}% online
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search vehicles by name or device ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'online', 'offline'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status as any)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-3 w-3" />
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="map" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Map & Live Tracking
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Vehicle Profile & Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          {/* Map and Vehicle List */}
          <LiveMapAndVehicleList
            vehicles={filteredVehicles}
            onVehicleSelect={handleVehicleSelect}
          />

          {/* Vehicle Status Card */}
          <VehicleStatusCard
            vehicle={selectedVehicle}
            onEngineShutdown={handleEngineShutdown}
            onEngineEnable={handleEngineEnable}
            canControlEngine={canControlEngine}
            isLoading={isEngineControlLoading}
          />
        </TabsContent>

        <TabsContent value="profile">
          <VehicleProfileTab
            vehicle={selectedVehicle}
            onWorkshopAssign={handleWorkshopAssign}
            onReportGenerate={handleReportGenerate}
          />
        </TabsContent>
      </Tabs>

      {/* Statistics Modals */}
      <VehicleStatisticsModal
        isOpen={showOnlineModal}
        onClose={() => setShowOnlineModal(false)}
        title="Online Vehicles"
        vehicles={vehicles}
        statusType="online"
      />

      <VehicleStatisticsModal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        title="Offline Vehicles"
        vehicles={vehicles}
        statusType="offline"
      />
    </div>
  );
};

export default EnhancedLiveTrackingPage;
