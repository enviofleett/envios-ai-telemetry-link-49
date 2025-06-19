
import React from 'react';
import { TrendingUp } from 'lucide-react';
import UserAnalyticsDashboard from '@/components/analytics/UserAnalyticsDashboard';

const UserAnalytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">My Vehicle Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track your vehicle usage, performance metrics, and driving insights
          </p>
        </div>
      </div>
      
      <UserAnalyticsDashboard />
    </div>
  );
};

export default UserAnalytics;
