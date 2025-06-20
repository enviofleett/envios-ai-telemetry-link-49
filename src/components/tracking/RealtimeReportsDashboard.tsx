
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, AlertCircle, Car } from 'lucide-react';
import { realtimeReportsService } from '@/services/reports/realtimeReportsService';
import { exportService } from '@/services/reports/exportService';
import AdvancedReportFilters from './AdvancedReportFilters';
import MileageReportCharts from './charts/MileageReportCharts';
import type { ReportMetrics, ReportFilters, VehicleItem } from '@/types/reports';

const RealtimeReportsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeReport, setActiveReport] = useState<string>('fleet_summary');
  const [reportData, setReportData] = useState<any>(null);
  const [vehicles] = useState<VehicleItem[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dateTo: new Date(),
    vehicleIds: [],
    reportType: 'fleet_summary'
  });

  useEffect(() => {
    loadMetrics();
    
    // Subscribe to real-time updates
    const subscriptionKey = realtimeReportsService.subscribeToVehicleUpdates(
      (data) => {
        console.log('Real-time update received:', data);
        loadMetrics();
      },
      filters
    );

    return () => {
      realtimeReportsService.unsubscribe(subscriptionKey);
    };
  }, []);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      const metricsData = await realtimeReportsService.getReportMetrics(filters, {});
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async () => {
    if (!metrics) return;
    
    try {
      setIsLoading(true);
      let data;
      
      switch (activeReport) {
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
          title: `${activeReport.replace('_', ' ').toUpperCase()} Report`,
          data: Array.isArray(reportData) ? reportData : [reportData],
          metadata: {
            generatedAt: new Date().toISOString(),
            filters
          }
        },
        { format }
      );
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (!metrics) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Real-time Reports Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          Last updated: {new Date(metrics.lastGenerated).toLocaleTimeString()}
        </Badge>
      </div>

      {/* Filters */}
      <AdvancedReportFilters
        vehicles={vehicles}
        filters={filters}
        onFiltersChange={setFilters}
        onGenerate={generateReport}
        isLoading={isLoading}
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalVehicles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeVehicles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.alertCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Speed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageSpeed} km/h</div>
          </CardContent>
        </Card>
      </div>

      {/* Report Content */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {activeReport.replace('_', ' ').toUpperCase()} Report
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleExport('csv')}>
                  Export CSV
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport('excel')}>
                  Export Excel
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport('pdf')}>
                  Export PDF
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.totalMileage}</div>
                <div className="text-sm text-gray-500">Total Mileage (km)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.fuelEfficiency}</div>
                <div className="text-sm text-gray-500">Fuel Efficiency (L/100km)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{(metrics.utilizationRate * 100).toFixed(1)}%</div>
                <div className="text-sm text-gray-500">Utilization Rate</div>
              </div>
            </div>

            {activeReport === 'mileage' && (
              <MileageReportCharts data={reportData} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealtimeReportsDashboard;
