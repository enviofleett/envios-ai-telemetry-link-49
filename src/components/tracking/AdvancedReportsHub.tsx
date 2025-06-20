
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingUp, Calendar, Users } from 'lucide-react';
import { realtimeReportsService } from '@/services/reports/realtimeReportsService';
import { exportService } from '@/services/reports/exportService';
import AdvancedReportFilters from './AdvancedReportFilters';
import TripReportCharts from './charts/TripReportCharts';
import GeofenceReportCharts from './charts/GeofenceReportCharts';
import MaintenanceReportCharts from './charts/MaintenanceReportCharts';
import AlertReportCharts from './charts/AlertReportCharts';
import MileageReportCharts from './charts/MileageReportCharts';
import type { VehicleData } from '@/services/unifiedVehicleData';
import type { ReportFilters, VehicleItem } from '@/types/reports';

interface AdvancedReportsHubProps {
  vehicles: VehicleData[];
}

const AdvancedReportsHub: React.FC<AdvancedReportsHubProps> = ({ vehicles }) => {
  const [activeTab, setActiveTab] = useState('fleet');
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [reportMetrics, setReportMetrics] = useState<any>(null);
  const [subscriptionKey, setSubscriptionKey] = useState<string>('');
  
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    dateTo: new Date(),
    vehicleIds: [],
    reportType: 'fleet_summary'
  });

  useEffect(() => {
    loadReportMetrics();
    
    // Subscribe to real-time updates
    const subscription = realtimeReportsService.subscribeToVehicleUpdates(
      (data) => {
        console.log('Vehicle update received:', data);
        // Refresh current report
        if (reportData) {
          generateReport();
        }
      },
      filters
    );
    
    setSubscriptionKey(subscription);

    return () => {
      if (subscription) {
        realtimeReportsService.unsubscribe(subscription);
      }
    };
  }, []);

  const loadReportMetrics = async () => {
    try {
      const metrics = await realtimeReportsService.getReportMetrics(filters, {});
      setReportMetrics(metrics);
    } catch (error) {
      console.error('Error loading report metrics:', error);
    }
  };

  const generateReport = async () => {
    setIsLoading(true);
    try {
      let data;
      
      switch (activeTab) {
        case 'fleet':
          data = await realtimeReportsService.generateFleetReport(filters);
          break;
        case 'trips':
          data = await realtimeReportsService.generateTripReport(filters);
          break;
        case 'geofence':
          data = await realtimeReportsService.generateGeofenceReport(filters);
          break;
        case 'maintenance':
          data = await realtimeReportsService.generateMaintenanceReport(filters);
          break;
        case 'alerts':
          data = await realtimeReportsService.generateAlertReport(filters);
          break;
        case 'mileage':
          data = await realtimeReportsService.generateMileageReport(filters);
          break;
        default:
          data = await realtimeReportsService.generateFleetReport(filters);
      }
      
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!reportData) return;
    
    try {
      await exportService.exportReport(
        {
          title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`,
          data: Array.isArray(reportData) ? reportData : [reportData],
          metadata: {
            generatedAt: new Date().toLocaleString(),
            filters,
          }
        },
        { format }
      );
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const handleFiltersChange = (newFilters: ReportFilters) => {
    setFilters(newFilters);
  };

  const renderReportContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating report...</p>
          </div>
        </div>
      );
    }

    if (!reportData) {
      return (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Select filters and generate a report to view data</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'trips':
        return <TripReportCharts data={reportData} />;
      case 'geofence':
        return <GeofenceReportCharts data={reportData} />;
      case 'maintenance':
        return <MaintenanceReportCharts data={reportData} />;
      case 'alerts':
        return <AlertReportCharts data={reportData} />;
      case 'mileage':
        return <MileageReportCharts data={reportData} />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                    <p className="text-2xl font-bold">{reportData?.totalVehicles || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Vehicles</p>
                    <p className="text-2xl font-bold">{reportData?.activeVehicles || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Mileage</p>
                    <p className="text-2xl font-bold">{reportData?.totalMileage?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Utilization Rate</p>
                    <p className="text-2xl font-bold">{((reportData?.utilizationRate || 0) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  // Transform VehicleData to VehicleItem format
  const vehicleItems: VehicleItem[] = vehicles.map(vehicle => ({
    id: vehicle.id,
    name: vehicle.device_name || vehicle.device_id,
    device_id: vehicle.device_id
  }));

  return (
    <div className="space-y-6">
      {/* Report Metrics */}
      {reportMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Reports</p>
                  <p className="text-2xl font-bold">{reportMetrics.totalReports}</p>
                </div>
                <Badge variant="outline">{reportMetrics.totalReports > 100 ? 'High' : 'Normal'}</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Generation Time</p>
                  <p className="text-2xl font-bold">{reportMetrics.averageGenerationTime}s</p>
                </div>
                <Badge variant="outline">Fast</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-sm text-gray-600">Popular Types</p>
                <p className="text-sm">{reportMetrics.popularReportTypes?.join(', ')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-sm text-gray-600">Last Generated</p>
                <p className="text-sm">{new Date(reportMetrics.lastGenerated).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Filters */}
      <AdvancedReportFilters
        vehicles={vehicleItems}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onGenerate={generateReport}
        isLoading={isLoading}
      />

      {/* Main Reports Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Advanced Reports Dashboard</CardTitle>
            {reportData && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('excel')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="fleet">Fleet</TabsTrigger>
              <TabsTrigger value="trips">Trips</TabsTrigger>
              <TabsTrigger value="geofence">Geofence</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="mileage">Mileage</TabsTrigger>
            </TabsList>

            <TabsContent value="fleet" className="mt-6">
              {renderReportContent()}
            </TabsContent>
            <TabsContent value="trips" className="mt-6">
              {renderReportContent()}
            </TabsContent>
            <TabsContent value="geofence" className="mt-6">
              {renderReportContent()}
            </TabsContent>
            <TabsContent value="maintenance" className="mt-6">
              {renderReportContent()}
            </TabsContent>
            <TabsContent value="alerts" className="mt-6">
              {renderReportContent()}
            </TabsContent>
            <TabsContent value="mileage" className="mt-6">
              {renderReportContent()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedReportsHub;
