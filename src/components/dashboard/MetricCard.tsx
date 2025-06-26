
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'green' | 'red' | 'blue' | 'orange' | 'gray';
  isLoading?: boolean;
  onClick?: () => void;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  isLoading = false,
  onClick,
  subtitle,
  trend,
  badge
}) => {
  const colorClasses = {
    green: 'border-green-200 bg-green-50 text-green-800',
    red: 'border-red-200 bg-red-50 text-red-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    orange: 'border-orange-200 bg-orange-50 text-orange-800',
    gray: 'border-gray-200 bg-gray-50 text-gray-800'
  };

  const iconColors = {
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    gray: 'text-gray-600'
  };

  const trendIcons = {
    up: '↗️',
    down: '↘️',
    stable: '→'
  };

  return (
    <Card 
      className={`${colorClasses[color]} border-2 hover:shadow-lg transition-all duration-200 cursor-pointer`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${iconColors[color]}`} />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold text-gray-900">
            {isLoading ? (
              <div className="animate-pulse bg-gray-300 h-8 w-16 rounded"></div>
            ) : (
              value.toLocaleString()
            )}
          </div>
          {badge && (
            <Badge variant={badge.variant}>{badge.text}</Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-600 mt-1">
            {subtitle}
            {trend && (
              <span className="ml-2">{trendIcons[trend]}</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
