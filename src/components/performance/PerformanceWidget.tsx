
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useClientPerformanceMonitor } from '@/hooks/useClientPerformanceMonitor';
import { Activity, Zap, AlertTriangle } from 'lucide-react';

export const PerformanceWidget: React.FC = () => {
  const { summary, metrics } = useClientPerformanceMonitor();

  if (!summary && !metrics) {
    return null;
  }

  const getPerformanceStatus = (loadTime: number) => {
    if (loadTime < 2000) return { status: 'good', color: 'bg-green-100 text-green-800' };
    if (loadTime < 4000) return { status: 'fair', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'poor', color: 'bg-red-100 text-red-800' };
  };

  const pagePerf = summary?.pagePerformance || {};
  const compPerf = summary?.componentPerformance || {};
  const loadTimeStatus = getPerformanceStatus(pagePerf.loadTime || 0);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Page Load</span>
              <Badge className={loadTimeStatus.color}>
                {loadTimeStatus.status}
              </Badge>
            </div>
            <div className="text-2xl font-bold">
              {((pagePerf.loadTime || 0) / 1000).toFixed(2)}s
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Memory</span>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {(pagePerf.memoryUsage || 0).toFixed(1)}MB
            </div>
          </div>
        </div>

        {compPerf.slowComponents > 0 && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-md">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              {compPerf.slowComponents} slow components detected
            </span>
          </div>
        )}

        {summary?.recommendations && summary.recommendations.length > 0 && (
          <div className="space-y-1">
            <span className="text-sm font-medium">Recommendations:</span>
            {summary.recommendations.slice(0, 2).map((rec: string, index: number) => (
              <div key={index} className="text-xs text-muted-foreground">
                • {rec}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
