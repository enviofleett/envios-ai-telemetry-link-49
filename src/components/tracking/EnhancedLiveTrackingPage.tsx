import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { RefreshCw, Wifi, WifiOff, Car, MapPin, BarChart3, Command, Filter, Users } from 'lucide-react';
import VehicleStatusCard from './VehicleStatusCard';
import VehicleStatisticsModal from './VehicleStatisticsModal';
import VehicleProfileTab from './VehicleProfileTab';
import CommandPalette from './CommandPalette';
import ThemeAwareMap from './ThemeAwareMap';
import VehicleDetailPanel from './VehicleDetailPanel';
import AdvancedFilters from './AdvancedFilters';
import GroupedVehicleList from './GroupedVehicleList';
import type { Vehicle } from '@/services/unifiedVehicleData';

const EnhancedLiveTrackingPage: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [isEngineControlLoading, setIsEngineControlLoading] = useState(false);
  const [showVehiclePanel, setShowVehiclePanel] = useState(false);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [grouping, setGrouping] = useState<'none' | 'driver' | 'status' | 'geofence'>('none');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const { toast } = useToast();
  const {
    vehicles,
    metrics,
    isLoading,
    isRefreshing,
    forceRefresh
  } = useUnifiedVehicleData();

  const {
    isOpen: isCommandOpen,
    open: openCommand,
    close: closeCommand,
    navigate
  } = useCommandPalette();

  // Use filtered vehicles or all vehicles if no filters applied
  const displayVehicles = filteredVehicles.length > 0 ? filteredVehicles : vehicles;

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
    const vehiclesToAnalyze = displayVehicles;
    const onlineVehicles = vehiclesToAnalyze.filter(v => getVehicleStatus(v) === 'online');
    const offlineVehicles = vehiclesToAnalyze.filter(v => getVehicleStatus(v) === 'offline');
    return {
      online: onlineVehicles.length,
      offline: offlineVehicles.length,
      total: vehiclesToAnalyze.length
    };
  };

  const statistics = getStatistics();

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowVehiclePanel(true);
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: 'Engine Shutdown Initiated',
        description: `Vehicle ${vehicleId} engine shutdown command sent successfully.`
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: 'Engine Enable Initiated',
        description: `Vehicle ${vehicleId} engine enable command sent successfully.`
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

  const handleWorkshopAssign = async (vehicleId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Workshop Assigned',
        description: `Vehicle ${vehicleId} has been assigned to a workshop.`
      });
    } catch (error) {
      toast({
        title: 'Assignment Failed',
        description: 'Failed to assign workshop. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleReportGenerate = async (vehicleId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: 'Report Generated',
        description: `Report for vehicle ${vehicleId} has been generated and will be downloaded shortly.`
      });
    } catch (error) {
      toast({
        title: 'Report Generation Failed',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Fleet data export has been initiated. Download will start shortly.'
    });
  };

  const handleClosePanelAndClearSelection = () => {
    setShowVehiclePanel(false);
    setSelectedVehicle(null);
  };

  const handleFiltersChange = (filtered: Vehicle[]) => {
    setFilteredVehicles(filtered);
  };

  const handleGroupingChange = (newGrouping: 'none' | 'driver' | 'status' | 'geofence') => {
    setGrouping(newGrouping);
  };

  if (isLoading) {
    return <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-lg"></div>)}
        </div>
        <div className="h-96 bg-muted rounded-lg"></div>
      </div>;
  }

  return <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold">Enhanced Live Tracking</h1>
          <p className="text-sm text-muted-foreground">
            Advanced fleet monitoring with filtering, grouping, and mobile support
          </p>
        </div>
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-2">
          <Button 
            variant="outline" 
            onClick={openCommand}
            className="flex items-center gap-2 w-full md:w-auto"
            size="sm"
          >
            <Command className="h-4 w-4" />
            <span className="md:hidden">Command Palette</span>
            <span className="hidden md:inline">Command</span>
            <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2 w-full md:w-auto"
            size="sm"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button onClick={forceRefresh} disabled={isRefreshing} className="flex items-center gap-2 w-full md:w-auto" size="sm">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Advanced Filters (Collapsible) */}
      {showAdvancedFilters && (
        <AdvancedFilters
          vehicles={vehicles}
          onFiltersChange={handleFiltersChange}
          onGroupingChange={handleGroupingChange}
        />
      )}

      {/* Real-Time Statistics - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowOnlineModal(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehicles Online</CardTitle>
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-green-600">{statistics.online}</div>
            <p className="text-xs text-muted-foreground">
              {filteredVehicles.length > 0 ? 'In filtered view' : 'Click to view details'}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowOfflineModal(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehicles Offline</CardTitle>
            <WifiOff className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-red-600">{statistics.offline}</div>
            <p className="text-xs text-muted-foreground">
              {filteredVehicles.length > 0 ? 'In filtered view' : 'Click to view details'}
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fleet</CardTitle>
            <Car className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{statistics.total}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.total > 0 ? (statistics.online / statistics.total * 100).toFixed(1) : 0}% online
              {filteredVehicles.length > 0 && (
                <span className="ml-1">• Filtered</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs - Mobile Optimized */}
      <Tabs defaultValue="map" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="map" className="flex flex-col items-center gap-1 py-2 text-xs md:flex-row md:gap-2 md:text-sm">
            <MapPin className="h-4 w-4" />
            <span className="hidden md:inline">Enhanced</span> Map
          </TabsTrigger>
          <TabsTrigger value="list" className="flex flex-col items-center gap-1 py-2 text-xs md:flex-row md:gap-2 md:text-sm">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Grouped</span> List
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex flex-col items-center gap-1 py-2 text-xs md:flex-row md:gap-2 md:text-sm">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden md:inline">Vehicle</span> Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          {/* Theme-Aware Map with Mobile Height */}
          <ThemeAwareMap 
            vehicles={displayVehicles}
            onVehicleSelect={handleVehicleSelect}
            selectedVehicle={selectedVehicle}
            height="300px md:500px"
            className="w-full"
          />

          {/* Legacy Vehicle Status Card for compatibility */}
          <VehicleStatusCard 
            vehicle={selectedVehicle} 
            onEngineShutdown={handleEngineShutdown} 
            onEngineEnable={handleEngineEnable} 
            canControlEngine={canControlEngine} 
            isLoading={isEngineControlLoading} 
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          {/* Grouped Vehicle List */}
          <GroupedVehicleList 
            vehicles={displayVehicles}
            grouping={grouping}
            onVehicleSelect={handleVehicleSelect}
            selectedVehicle={selectedVehicle}
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
        vehicles={displayVehicles} 
        statusType="online" 
      />

      <VehicleStatisticsModal 
        isOpen={showOfflineModal} 
        onClose={() => setShowOfflineModal(false)} 
        title="Offline Vehicles" 
        vehicles={displayVehicles} 
        statusType="offline" 
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={closeCommand}
        vehicles={displayVehicles}
        onVehicleSelect={handleVehicleSelect}
        onRefresh={forceRefresh}
        onExport={handleExport}
        onNavigate={navigate}
      />

      {/* Enhanced Vehicle Detail Panel */}
      <VehicleDetailPanel
        vehicle={selectedVehicle}
        isOpen={showVehiclePanel}
        onClose={handleClosePanelAndClearSelection}
        onEngineControl={(vehicleId, action) => {
          if (action === 'shutdown') {
            handleEngineShutdown(vehicleId);
          } else {
            handleEngineEnable(vehicleId);
          }
        }}
        onGenerateReport={handleReportGenerate}
        onAssignWorkshop={handleWorkshopAssign}
        canControlEngine={canControlEngine}
        isLoading={isEngineControlLoading}
      />
    </div>;
};

export default EnhancedLiveTrackingPage;
