
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Activity, 
  WifiOff, 
  Users,
  TrendingUp,
  TrendingDown,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardData } from '@/hooks/useDashboardData';

const KPICardsSection: React.FC = () => {
  const { metrics, isLoading } = useDashboardData();

  const kpiCards = [
    {
      title: 'Total Vehicles',
      value: metrics?.totalVehicles || 1240,
      trend: '+12.5%',
      trendDirection: 'up' as const,
      subtitle: 'from last month',
      icon: Car,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      progressValue: 85
    },
    {
      title: 'Online Vehicles',
      value: metrics?.onlineVehicles || 1087,
      trend: '87.7%',
      trendDirection: 'up' as const,
      subtitle: 'rate',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      progressValue: 87.7
    },
    {
      title: 'Offline Vehicles',
      value: metrics?.totalVehicles ? metrics.totalVehicles - metrics.onlineVehicles : 153,
      trend: 'Last: 2h ago',
      trendDirection: 'neutral' as const,
      subtitle: '12.3% offline',
      icon: WifiOff,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      progressValue: 12.3
    },
    {
      title: 'Active Users',
      value: 867,
      trend: '70%',
      trendDirection: 'up' as const,
      subtitle: 'w/ vehicles',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      progressValue: 70
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse h-[140px]">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-8 bg-gray-200 rounded mb-3"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {kpiCards.map((card) => {
        const IconComponent = card.icon;
        const TrendIcon = card.trendDirection === 'up' ? TrendingUp : 
                         card.trendDirection === 'down' ? TrendingDown : null;
        
        return (
          <Card 
            key={card.title} 
            className="h-[140px] hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group cursor-pointer"
          >
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">{card.title}</span>
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <IconComponent className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Value */}
              <div className="mb-3">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {card.value.toLocaleString()}
                </div>
              </div>

              {/* Trend and Progress */}
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-xs">
                  {TrendIcon && (
                    <TrendIcon className={`h-3 w-3 ${
                      card.trendDirection === 'up' ? 'text-green-600' : 'text-red-600'
                    }`} />
                  )}
                  <span className={`font-medium ${
                    card.trendDirection === 'up' ? 'text-green-600' : 
                    card.trendDirection === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {card.trend}
                  </span>
                  <span className="text-gray-500">{card.subtitle}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full ${card.color.replace('text-', 'bg-')}`}
                    style={{ width: `${Math.min(card.progressValue, 100)}%` }}
                  />
                </div>
              </div>

              {/* Hidden Actions for Hover */}
              <div className="absolute bottom-2 left-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs flex-1">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs flex-1">
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default KPICardsSection;
