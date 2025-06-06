
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Car, Activity, AlertTriangle, Users } from 'lucide-react';

interface SummaryCardsProps {
  metrics: {
    total: number;
    online: number;
    offline: number;
    alerts: number;
  };
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ metrics }) => {
  const cards = [
    {
      title: "Total Vehicles",
      value: metrics.total.toLocaleString(),
      trend: "+12.5% from last month",
      trendType: "positive",
      icon: Car,
      iconColor: "#64748b"
    },
    {
      title: "Online Vehicles",
      value: metrics.online.toLocaleString(),
      trend: `${metrics.total > 0 ? ((metrics.online / metrics.total) * 100).toFixed(1) : 0}% connectivity rate`,
      trendType: "neutral",
      icon: Activity,
      iconColor: "#64748b"
    },
    {
      title: "Offline Vehicles",
      value: metrics.offline.toLocaleString(),
      trend: "Last active: 2h ago",
      trendType: "neutral",
      icon: AlertTriangle,
      iconColor: "#64748b"
    },
    {
      title: "Active Users",
      value: "867",
      trend: "70% with assigned vehicles",
      trendType: "neutral",
      icon: Users,
      iconColor: "#64748b"
    }
  ];

  const getTrendColor = (type: string) => {
    switch (type) {
      case 'positive':
        return '#16a34a';
      case 'negative':
        return '#dc2626';
      default:
        return '#64748b';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <Card key={index} className="h-[120px] bg-white border border-gray-lighter shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-mid">{card.title}</span>
                <IconComponent className="w-4 h-4" style={{ color: card.iconColor }} />
              </div>
              <div className="text-2xl font-bold text-primary-dark mb-1">
                {card.value}
              </div>
              <div 
                className="text-xs"
                style={{ color: getTrendColor(card.trendType) }}
              >
                {card.trend}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SummaryCards;
