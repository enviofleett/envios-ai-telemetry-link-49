
import React from 'react';
import { BarChart3 } from 'lucide-react';
import FleetAnalyticsDashboard from '@/components/analytics/FleetAnalyticsDashboard';

const FleetAnalytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Fleet Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive fleet performance metrics and insights
          </p>
        </div>
      </div>
      
      <FleetAnalyticsDashboard />
    </div>
  );
};

export default FleetAnalytics;
