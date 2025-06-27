
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface DashboardMetricCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  icon: LucideIcon;
  iconColor?: string;
  description?: string;
}

const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-gray-500',
  description
}) => {
  return (
    <Card className="metric-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
            {change && (
              <p className="text-sm text-gray-500 mt-1">
                {change}
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
