
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';
import type { ReportData } from '@/hooks/useAdvancedReports';

interface ReportChartContainerProps {
  data: ReportData[];
  reportType: string;
  isLoading: boolean;
  title: string;
  children?: React.ReactNode;
}

const ReportChartContainer: React.FC<ReportChartContainerProps> = ({
  data,
  reportType,
  isLoading,
  title,
  children
}) => {
  const getChartIcon = () => {
    switch (reportType) {
      case 'trip':
      case 'activity':
        return <TrendingUp className="w-4 h-4" />;
      case 'geofence':
        return <PieChart className="w-4 h-4" />;
      case 'maintenance':
      case 'alerts':
        return <BarChart3 className="w-4 h-4" />;
      case 'mileage':
        return <Activity className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white border border-gray-lighter">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium text-primary-dark flex items-center gap-2">
            {getChartIcon()}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="bg-white border border-gray-lighter">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium text-primary-dark flex items-center gap-2">
            {getChartIcon()}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-mid">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No data available for visualization</p>
              <p className="text-sm mt-1">Adjust your filters to see charts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-lighter">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-medium text-primary-dark flex items-center gap-2">
          {getChartIcon()}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

export default ReportChartContainer;
