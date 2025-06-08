
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, DollarSign, Car } from 'lucide-react';
import { ServiceStats } from '@/utils/service-statistics';

interface ServiceStatsCardsProps {
  stats: ServiceStats;
  onCardClick: (view: 'services' | 'spending' | 'vehicles') => void;
}

const ServiceStatsCards: React.FC<ServiceStatsCardsProps> = ({ stats, onCardClick }) => {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onCardClick('services')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Services</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeCount}</div>
          <p className="text-xs text-muted-foreground">
            {stats.pausedCount} paused
          </p>
        </CardContent>
      </Card>
      <Card
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onCardClick('spending')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalMonthlySpend.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Per month</p>
        </CardContent>
      </Card>
      <Card
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onCardClick('spending')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          <DollarSign className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">All time</p>
        </CardContent>
      </Card>
      <Card
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onCardClick('vehicles')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vehicles Covered</CardTitle>
          <Car className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.allVehicles.length}</div>
          <p className="text-xs text-muted-foreground">Unique vehicles</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceStatsCards;
