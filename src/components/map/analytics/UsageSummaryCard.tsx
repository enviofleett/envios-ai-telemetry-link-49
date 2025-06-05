
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AnalyticsData } from './types';

interface UsageSummaryCardProps {
  popularActions: AnalyticsData['popularActions'];
  totalEvents: number;
}

const UsageSummaryCard: React.FC<UsageSummaryCardProps> = ({ popularActions, totalEvents }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {popularActions.map((action) => (
            <div key={action.action} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{action.action}</Badge>
                <span className="text-sm text-gray-600">
                  {((action.count / totalEvents) * 100).toFixed(1)}%
                </span>
              </div>
              <span className="font-medium">{action.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UsageSummaryCard;
