
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, TrendingUp, MapPin, Wrench, AlertTriangle, Gauge } from 'lucide-react';
import { useAdvancedReports } from '@/hooks/useAdvancedReports';
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
    { id: 'activity', label: 'Activity', icon: TrendingUp },
  ];

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
