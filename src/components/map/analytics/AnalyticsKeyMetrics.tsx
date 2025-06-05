
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, MapPin, Clock, TrendingUp } from 'lucide-react';
import type { AnalyticsData } from './types';

interface AnalyticsKeyMetricsProps {
  data: AnalyticsData;
}

const AnalyticsKeyMetrics: React.FC<AnalyticsKeyMetricsProps> = ({ data }) => {
  const eventsPerSession = data.uniqueSessions > 0 
    ? Math.round(data.totalEvents / data.uniqueSessions) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-2xl font-bold">{data.totalEvents.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Sessions</p>
              <p className="text-2xl font-bold">{data.uniqueSessions}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Load Time</p>
              <p className="text-2xl font-bold">{data.avgLoadTime}ms</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-gray-600">Events/Session</p>
              <p className="text-2xl font-bold">{eventsPerSession}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsKeyMetrics;
