
import React from 'react';
import { Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGP51Health } from '@/hooks/useGP51Health';

const GP51HealthIndicator: React.FC = () => {
  const { health } = useGP51Health();

  const getStatusIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (health.status) {
      case 'healthy':
        return 'default';
      case 'degraded':
        return 'secondary';
      case 'unhealthy':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {getStatusIcon()}
          GP51 Service Health
          <Badge variant={getStatusColor() as any} className="ml-auto">
            {health.status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Success Rate</div>
            <div className="font-medium">{health.successRate}%</div>
          </div>
          <div>
            <div className="text-muted-foreground">Avg Response</div>
            <div className="font-medium">{health.responseTime}ms</div>
          </div>
          <div>
            <div className="text-muted-foreground">Total Requests</div>
            <div className="font-medium">{health.totalRequests}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Recent Errors</div>
            <div className="font-medium">{health.errorCount}</div>
          </div>
        </div>

        {health.issues.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Issues:</div>
            {health.issues.map((issue, index) => (
              <div key={index} className="text-xs text-orange-600 dark:text-orange-400">
                • {issue}
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Last Check: {health.lastCheck.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51HealthIndicator;
