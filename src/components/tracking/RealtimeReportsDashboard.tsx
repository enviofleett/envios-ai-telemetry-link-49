
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Download, 
  RefreshCw, 
  BarChart3, 
  TrendingUp,
  AlertTriangle,
  MapPin,
  Gauge
} from 'lucide-react';
import { realtimeReportsService, type ReportMetrics } from '@/services/reports/realtimeReportsService';
import { exportService } from '@/services/reports/exportService';
import TripReportCharts from './charts/TripReportCharts';
import MaintenanceReportCharts from './charts/MaintenanceReportCharts';
import AlertReportCharts from './charts/AlertReportCharts';
import GeofenceReportCharts from './charts/GeofenceReportCharts';
import MileageReportCharts from './charts/MileageReportCharts';
import AdvancedReportFilters from './AdvancedReportFilters';

interface VehicleItem {
  id: string;
  name: string;
  device_id: string;
}

const RealtimeReportsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('fleet');
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [filters, setFilters] = useState({
    dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dateTo: new Date(),
    vehicleIds: [] as string[],
    reportType: 'fleet_summary'
  });

  // Mock vehicle data with proper structure
  const vehicles: VehicleItem[] = [
    { id: '1', name: 'Vehicle 001', device_id: 'DEV001' },
    { id: '2', name: 'Vehicle 002', device_id: 'DEV002' },
    { id: '3', name: 'Vehicle 003', device_id: 'DEV003' }
  ];

  const [reportData, setReportData] = useState({
    trip: null,
    geofence: null,
    maintenance: null,
    alert: null,
    mileage: null
  });

  useEffect(() => {
    loadMetrics();
    
    // Subscribe to real-time updates
    const unsubscribe = realtimeReportsService.subscribeToVehicleUpdates((data) => {
      console.log('Real-time update received:', data);
      loadMetrics(); // Refresh metrics on updates
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      const metricsData = await realtimeReportsService.getReportMetrics();
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async (reportType: string) => {
    try {
      setIsLoading(true);
      
      switch (reportType) {
        case 'trip':
          const tripData = await realtimeReportsService.generateTripReport(filters);
          setReportData(prev => ({ ...prev, trip: tripData }));
          break;
        case 'geofence':
          const geofenceData = await realtimeReportsService.generateGeofenceReport(filters);
          setReportData(prev => ({ ...prev, geofence: geofenceData }));
          break;
        case 'maintenance':
          const maintenanceData = await realtimeReportsService.generateMaintenanceReport(filters);
          setReportData(prev => ({ ...prev, maintenance: maintenanceData }));
          break;
        case 'alert':
          const alertData = await realtimeReportsService.generateAlertReport(filters);
          setReportData(prev => ({ ...prev, alert: alertData }));
          break;
        case 'mileage':
          const mileageData = await realtimeReportsService.generateMileageReport(filters);
          setReportData(prev => ({ ...prev, mileage: mileageData }));
          break;
        default:
          await loadMetrics();
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      setIsLoading(true);
      
      // Export current tab data
      const currentData = reportData[activeTab as keyof typeof reportData];
      if (!currentData) {
        console.warn('No data to export for current tab');
        return;
      }

      await exportService.exportReport({
        title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`,
        data: Array.isArray(currentData) ? currentData : [currentData],
        metadata: {
          generatedAt: new Date().toLocaleString(),
          filters
        }
      }, { format });
    } catch (error) {
      console.error('Error exporting report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    color = 'text-blue-600' 
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: number;
    color?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend !== undefined && (
              <p className={`text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? '+' : ''}{trend}% from last period
              </p>
            )}
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Realtime Reports Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Generate and analyze comprehensive fleet reports in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMetrics}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportReport('csv')}
            disabled={isLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Vehicles"
            value={metrics.totalVehicles}
            icon={BarChart3}
            trend={5}
          />
          <MetricCard
            title="Active Vehicles"
            value={metrics.activeVehicles}
            icon={TrendingUp}
            trend={2}
            color="text-green-600"
          />
          <MetricCard
            title="Total Alerts"
            value={metrics.alertCount}
            icon={AlertTriangle}
            trend={-12}
            color="text-red-600"
          />
          <MetricCard
            title="Avg Speed"
            value={`${metrics.averageSpeed} mph`}
            icon={Gauge}
            trend={3}
            color="text-blue-600"
          />
        </div>
      )}

      {/* Filters */}
      <AdvancedReportFilters
        vehicles={vehicles}
        filters={filters}
        onFiltersChange={setFilters}
        onGenerate={() => generateReport(activeTab)}
        isLoading={isLoading}
      />

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="fleet">Fleet</TabsTrigger>
          <TabsTrigger value="trip">Trips</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="alert">Alerts</TabsTrigger>
          <TabsTrigger value="mileage">Mileage</TabsTrigger>
        </TabsList>

        <TabsContent value="fleet" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Fleet Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Key Metrics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Mileage:</span>
                        <Badge variant="outline">{metrics.totalMileage.toLocaleString()} km</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Fuel Efficiency:</span>
                        <Badge variant="outline">{metrics.fuelEfficiency} MPG</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Utilization Rate:</span>
                        <Badge variant="outline">{(metrics.utilizationRate * 100).toFixed(1)}%</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-center py-8">
                    <Button onClick={() => generateReport('fleet')}>
                      Generate Detailed Fleet Report
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading fleet data...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trip" className="mt-6">
          {reportData.trip ? (
            <TripReportCharts data={reportData.trip} />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Button onClick={() => generateReport('trip')} disabled={isLoading}>
                  {isLoading ? 'Generating...' : 'Generate Trip Report'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6">
          {reportData.maintenance ? (
            <MaintenanceReportCharts data={reportData.maintenance} />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Button onClick={() => generateReport('maintenance')} disabled={isLoading}>
                  {isLoading ? 'Generating...' : 'Generate Maintenance Report'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alert" className="mt-6">
          {reportData.alert ? (
            <AlertReportCharts data={reportData.alert} />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Button onClick={() => generateReport('alert')} disabled={isLoading}>
                  {isLoading ? 'Generating...' : 'Generate Alert Report'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="mileage" className="mt-6">
          {reportData.mileage ? (
            <MileageReportCharts data={reportData.mileage} />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Button onClick={() => generateReport('mileage')} disabled={isLoading}>
                  {isLoading ? 'Generating...' : 'Generate Mileage Report'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealtimeReportsDashboard;
