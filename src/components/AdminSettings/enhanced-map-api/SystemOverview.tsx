
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import type { SystemOverviewData } from './types';

interface SystemOverviewProps {
  data: SystemOverviewData;
  autoRefresh: boolean;
  onAutoRefreshChange: (enabled: boolean) => void;
  onRefresh: () => void;
  hasHighUsageAlerts: boolean;
}

const SystemOverview: React.FC<SystemOverviewProps> = ({
  data,
  autoRefresh,
  onAutoRefreshChange,
  onRefresh,
  hasHighUsageAlerts
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Enhanced Map API Management
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={onAutoRefreshChange}
              />
              <Label htmlFor="auto-refresh" className="text-sm">Auto-refresh</Label>
            </div>
            <Button onClick={onRefresh} variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{data.activeConfigs}</div>
            <div className="text-sm text-gray-600">Active Configs</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">{data.totalDailyUsage.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Today's Requests</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{data.avgUsagePercentage.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Avg Usage</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{data.autoFallbackEnabled}</div>
            <div className="text-sm text-gray-600">Auto-fallback Enabled</div>
          </div>
        </div>

        {hasHighUsageAlerts && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>High Usage Alert:</strong> One or more API configurations are approaching their daily limits.
              Consider enabling auto-fallback or increasing thresholds.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemOverview;
