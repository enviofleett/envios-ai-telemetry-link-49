
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface DashboardMetricCardProps {
  title: string;
  value?: string | number;
  change?: string | number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  description?: string;
  isLoading?: boolean;
  
  // Add the metric property structure for ModernAnalyticsDashboard
  metric?: {
    current: number;
    previous: number;
    change: number;
    trend: "up" | "down" | "stable";
    growth: number;
  };
}

const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'text-gray-500',
  description,
  isLoading = false,
  metric
}) => {
  const getChangeColorClass = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  // Use metric data if provided, otherwise use legacy props
  const displayValue = metric ? metric.current : value;
  const displayChange = metric ? `${metric.growth > 0 ? '+' : ''}${metric.growth}%` : change;

  if (isLoading) {
    return (
      <Card className="metric-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
            </div>
            <div className={`flex-shrink-0 ${iconColor}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="metric-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="metric-value text-2xl font-bold text-gray-900">{displayValue}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
            {displayChange && (
              <p className={`metric-change text-sm mt-1 ${getChangeColorClass()}`}>
                {displayChange}
              </p>
            )}
          </div>
          <div className={`flex-shrink-0 ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardMetricCard;
