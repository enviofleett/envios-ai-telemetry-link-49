
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Download, Search, Filter, RefreshCw } from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import ReportFilters from './ReportFilters';
import ReportTable from './ReportTable';
import type { VehicleData } from '@/services/unifiedVehicleData';

interface EnhancedReportsHubProps {
  vehicles: VehicleData[];
}

const EnhancedReportsHub: React.FC<EnhancedReportsHubProps> = ({ vehicles }) => {
  const {
    reportData,
    isLoading,
    activeTab,
    filters,
    generateReport,
    exportReport,
    updateFilters,
    setActiveReportTab,
  } = useReports();

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

  return (
    <Card className="bg-white border border-gray-lighter shadow-sm">
      <CardHeader className="p-6 border-b border-gray-lighter">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-primary-dark">
            Reports Hub
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
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="trip" className="text-sm">
              Trip Reports
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-sm">
              Activity
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="text-sm">
              Maintenance
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-sm">
              Alerts
            </TabsTrigger>
          </TabsList>

          {/* Report Filters */}
          <ReportFilters
            vehicles={vehicles}
            filters={filters}
            onFiltersChange={updateFilters}
            onGenerate={handleGenerateReport}
            isLoading={isLoading}
          />

          {/* Report Content */}
          <TabsContent value="trip">
            <ReportTable
              data={reportData}
              isLoading={isLoading}
              type="trip"
            />
          </TabsContent>

          <TabsContent value="activity">
            <ReportTable
              data={reportData}
              isLoading={isLoading}
              type="activity"
            />
          </TabsContent>

          <TabsContent value="maintenance">
            <div className="text-center py-8 text-gray-mid">
              <Badge variant="outline" className="mb-2">Coming Soon</Badge>
              <p>Maintenance reports functionality will be available soon</p>
            </div>
          </TabsContent>

          <TabsContent value="alerts">
            <div className="text-center py-8 text-gray-mid">
              <Badge variant="outline" className="mb-2">Coming Soon</Badge>
              <p>Alert reports functionality will be available soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedReportsHub;
