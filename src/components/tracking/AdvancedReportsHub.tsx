
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, TrendingUp, MapPin, Wrench, AlertTriangle, Gauge, BarChart3 } from 'lucide-react';
import { useAdvancedReports } from '@/hooks/useAdvancedReports';
import { realtimeReportsService } from '@/services/reports/realtimeReportsService';
import AdvancedReportFilters from './AdvancedReportFilters';
import AdvancedReportTable from './AdvancedReportTable';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface AdvancedReportsHubProps {
  vehicles: Vehicle[];
}

const AdvancedReportsHub: React.FC<AdvancedReportsHubProps> = ({ vehicles }) => {
  const {
    reportData,
    isLoading,
    activeTab,
    filters,
    generateReport,
    exportReport,
    updateFilters,
    setActiveReportTab,
  } = useAdvancedReports();

  const [reportMetrics, setReportMetrics] = useState<any>({});
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  useEffect(() => {
    // Load report metrics when filters change
    const loadMetrics = async () => {
      setIsLoadingMetrics(true);
      try {
        const metrics = await realtimeReportsService.getReportMetrics(
          filters.reportType,
          filters.vehicleIds.length > 0 ? filters.vehicleIds : undefined
        );
        setReportMetrics(metrics);
      } catch (error) {
        console.error('Error loading report metrics:', error);
      } finally {
        setIsLoadingMetrics(false);
      }
    };

    loadMetrics();
  }, [filters.reportType, filters.vehicleIds]);

  useEffect(() => {
    // Subscribe to real-time updates for selected vehicles
    if (filters.vehicleIds.length > 0) {
      const subscriptionKey = realtimeReportsService.subscribeToVehicleUpdates(
        filters.vehicleIds,
        (data) => {
          console.log('Vehicle data updated in real-time:', data);
          // Optionally refresh report data
        }
      );

      return () => {
        realtimeReportsService.unsubscribe(subscriptionKey);
      };
    }
  }, [filters.vehicleIds]);

  const handleGenerateReport = () => {
    generateReport(vehicles);
  };

  const handleExportCSV = () => {
    exportReport('csv');
  };

  const getResultCount = () => {
    if (isLoading) return '...';
    return reportData.length.toString();
  };

  const tabConfig = [
    { id: 'trip', label: 'Trip Reports', icon: TrendingUp },
    { id: 'geofence', label: 'Geofence', icon: MapPin },
    { id: 'mileage', label: 'Mileage', icon: Gauge },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'activity', label: 'Activity', icon: BarChart3 },
  ];

  const renderMetricsCards = () => {
    if (isLoadingMetrics || Object.keys(reportMetrics).length === 0) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    const metricEntries = Object.entries(reportMetrics);
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {metricEntries.map(([key, value], index) => (
          <Card key={key} className="bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="text-lg font-semibold text-primary-dark mt-1">
                {value as string}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Card className="bg-white border border-gray-lighter shadow-sm">
      <CardHeader className="p-6 border-b border-gray-lighter">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-primary-dark">
            Advanced Reports Hub
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getResultCount()} results
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={reportData.length === 0}
              className="bg-white border-gray-lighter text-primary-dark hover:bg-gray-background"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveReportTab(value as any)}>
          <TabsList className="grid w-full grid-cols-6 mb-6">
            {tabConfig.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="text-sm flex items-center gap-2">
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden md:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Report Metrics */}
          {renderMetricsCards()}

          {/* Report Filters */}
          <AdvancedReportFilters
            vehicles={vehicles}
            filters={filters}
            onFiltersChange={updateFilters}
            onGenerate={handleGenerateReport}
            isLoading={isLoading}
          />

          {/* Report Content */}
          <TabsContent value="trip">
            <AdvancedReportTable
              data={reportData}
              isLoading={isLoading}
              type="trip"
            />
          </TabsContent>

          <TabsContent value="geofence">
            <AdvancedReportTable
              data={reportData}
              isLoading={isLoading}
              type="geofence"
            />
          </TabsContent>

          <TabsContent value="mileage">
            <AdvancedReportTable
              data={reportData}
              isLoading={isLoading}
              type="mileage"
            />
          </TabsContent>

          <TabsContent value="maintenance">
            <AdvancedReportTable
              data={reportData}
              isLoading={isLoading}
              type="maintenance"
            />
          </TabsContent>

          <TabsContent value="alerts">
            <AdvancedReportTable
              data={reportData}
              isLoading={isLoading}
              type="alerts"
            />
          </TabsContent>

          <TabsContent value="activity">
            <AdvancedReportTable
              data={reportData}
              isLoading={isLoading}
              type="activity"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdvancedReportsHub;
