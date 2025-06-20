
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import AdvancedReportFilters from './AdvancedReportFilters';
import TripReportCharts from './charts/TripReportCharts';
import MaintenanceReportCharts from './charts/MaintenanceReportCharts';
import AlertReportCharts from './charts/AlertReportCharts';
import GeofenceReportCharts from './charts/GeofenceReportCharts';
import MileageReportCharts from './charts/MileageReportCharts';
import { realtimeReportsService } from '@/services/reports/realtimeReportsService';
import { exportService } from '@/services/reports/exportService';
import { useVehicleData } from '@/hooks/useVehicleData';
import { Activity, TrendingUp, Users, AlertTriangle, BarChart3, RefreshCw } from 'lucide-react';

const RealtimeReportsDashboard: React.FC = () => {
  const { toast } = useToast();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicleData();
  
  const [activeTab, setActiveTab] = useState('fleet_summary');
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [reportData, setReportData] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Generate report data when filters change
  useEffect(() => {
    generateReport();
  }, [filters, activeTab]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        generateReport(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isLoading, filters, activeTab]);

  const generateReport = async (silent = false) => {
    if (!silent) setIsLoading(true);
    
    try {
      let data;
      
      switch (activeTab) {
        case 'fleet_summary':
          data = await realtimeReportsService.generateFleetReport(filters);
          break;
        case 'trip_analysis':
          data = await realtimeReportsService.generateTripReport(filters);
          break;
        case 'maintenance':
          data = await realtimeReportsService.generateMaintenanceReport(filters);
          break;
        case 'alerts':
          data = generateMockAlertData();
          break;
        case 'geofence':
          data = generateMockGeofenceData();
          break;
        case 'mileage':
          data = generateMockMileageData();
          break;
        default:
          data = await realtimeReportsService.generateFleetReport(filters);
      }
      
      setReportData(data);
      setLastUpdated(new Date());
      
      if (!silent) {
        toast({
          title: "Report Generated",
          description: "Report data has been updated successfully."
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!reportData) return;
    
    try {
      const reportTitle = getReportTitle(activeTab);
      
      switch (activeTab) {
        case 'fleet_summary':
          await exportService.exportFleetReport(reportData, format);
          break;
        default:
          // Generic export for other report types
          const exportData = {
            title: reportTitle,
            data: Array.isArray(reportData) ? reportData : [reportData],
            metadata: {
              generatedAt: new Date().toLocaleString(),
              filters: filters
            }
          };
          await exportService.exportReport(exportData, { format });
      }
      
      toast({
        title: "Export Successful",
        description: `Report exported as ${format.toUpperCase()} successfully.`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getReportTitle = (type: string): string => {
    const titles: Record<string, string> = {
      fleet_summary: 'Fleet Performance Summary',
      trip_analysis: 'Trip Analysis Report',
      maintenance: 'Maintenance Report',
      alerts: 'Alerts Report',
      geofence: 'Geofence Report',
      mileage: 'Mileage Report'
    };
    return titles[type] || 'Fleet Report';
  };

  const generateMockAlertData = () => ({
    totalAlerts: 45,
    resolvedAlerts: 32,
    pendingAlerts: 13,
    alertsByType: [
      { type: 'Speed Violation', count: 18, severity: 'high' },
      { type: 'Geofence Breach', count: 12, severity: 'medium' },
      { type: 'Engine Fault', count: 8, severity: 'high' },
      { type: 'Low Fuel', count: 7, severity: 'low' }
    ],
    alertsByVehicle: vehicles.slice(0, 10).map((vehicle, i) => ({
      vehicle: vehicle.device_name || `Vehicle ${i + 1}`,
      count: Math.floor(Math.random() * 10) + 1
    })),
    alertsTrend: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      count: Math.floor(Math.random() * 15) + 5
    }))
  });

  const generateMockGeofenceData = () => ({
    totalGeofences: 12,
    activeGeofences: 10,
    violations: 8,
    entriesExits: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      entries: Math.floor(Math.random() * 20) + 5,
      exits: Math.floor(Math.random() * 20) + 5
    })),
    violationsByZone: [
      { zone: 'Restricted Area A', violations: 5 },
      { zone: 'School Zone', violations: 3 },
      { zone: 'Construction Zone', violations: 2 }
    ],
    violationsByVehicle: vehicles.slice(0, 8).map((vehicle, i) => ({
      vehicle: vehicle.device_name || `Vehicle ${i + 1}`,
      violations: Math.floor(Math.random() * 5)
    }))
  });

  const generateMockMileageData = () => ({
    totalMileage: 125847,
    averageMileage: Math.round(125847 / vehicles.length),
    mileageByVehicle: vehicles.slice(0, 15).map((vehicle, i) => ({
      vehicle: vehicle.device_name || `Vehicle ${i + 1}`,
      mileage: Math.floor(Math.random() * 5000) + 3000,
      efficiency: Math.round((Math.random() * 15 + 20) * 10) / 10
    })),
    mileageTrends: Array.from({ length: 14 }, (_, i) => ({
      date: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      mileage: Math.floor(Math.random() * 1000) + 500,
      fuelUsed: Math.floor(Math.random() * 50) + 20
    })),
    monthlyMileage: Array.from({ length: 6 }, (_, i) => ({
      month: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
      mileage: Math.floor(Math.random() * 20000) + 15000
    }))
  });

  const renderMetricsCards = () => {
    if (!reportData) return null;

    switch (activeTab) {
      case 'fleet_summary':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Vehicles</p>
                    <p className="text-2xl font-bold">{reportData.metrics?.totalVehicles || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Vehicles</p>
                    <p className="text-2xl font-bold">{reportData.metrics?.activeVehicles || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Mileage</p>
                    <p className="text-2xl font-bold">{reportData.metrics?.totalMileage?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Alerts</p>
                    <p className="text-2xl font-bold">{reportData.metrics?.alertCount || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'trip_analysis':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Trips</p>
                  <p className="text-2xl font-bold">{reportData.totalTrips}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Distance</p>
                  <p className="text-2xl font-bold">{reportData.totalDistance} km</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Duration</p>
                  <p className="text-2xl font-bold">{Math.round(reportData.totalDuration / 60)}h</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Avg Speed</p>
                  <p className="text-2xl font-bold">{reportData.averageSpeed} mph</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const renderCharts = () => {
    if (!reportData) return null;

    switch (activeTab) {
      case 'trip_analysis':
        return <TripReportCharts data={reportData} />;
      case 'maintenance':
        return <MaintenanceReportCharts data={reportData} />;
      case 'alerts':
        return <AlertReportCharts data={reportData} />;
      case 'geofence':
        return <GeofenceReportCharts data={reportData} />;
      case 'mileage':
        return <MileageReportCharts data={reportData} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-time Reports</h1>
          <p className="text-gray-600 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
            {isLoading && (
              <Badge variant="secondary" className="ml-2">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Updating...
              </Badge>
            )}
          </p>
        </div>
        
        <Button onClick={() => generateReport()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Report Filters */}
      <AdvancedReportFilters
        onFiltersChange={setFilters}
        onExport={handleExport}
        vehicles={vehicles}
        isLoading={isLoading}
      />

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="fleet_summary">Fleet</TabsTrigger>
          <TabsTrigger value="trip_analysis">Trips</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="geofence">Geofence</TabsTrigger>
          <TabsTrigger value="mileage">Mileage</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {/* Metrics Cards */}
          {renderMetricsCards()}

          {/* Charts */}
          {renderCharts()}

          {/* Fleet Summary Charts (only for fleet_summary tab) */}
          {activeTab === 'fleet_summary' && reportData?.charts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reportData.charts.vehicleStatus.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fleet Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Fuel Efficiency</span>
                      <span className="font-semibold">{reportData.metrics.fuelEfficiency} MPG</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Speed</span>
                      <span className="font-semibold">{reportData.metrics.averageSpeed} MPH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Utilization Rate</span>
                      <span className="font-semibold">{(reportData.metrics.utilizationRate * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealtimeReportsDashboard;
