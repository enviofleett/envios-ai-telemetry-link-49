
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SystemHealthMonitor, SystemHealthStatus } from '@/services/systemHealthMonitor';
import { Loader2, RefreshCw, Database, Radio, Shield, CheckCircle } from 'lucide-react';

const SystemHealthDashboard: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<SystemHealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    checkSystemHealth();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(checkSystemHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkSystemHealth = async () => {
    setIsLoading(true);
    try {
      const health = await SystemHealthMonitor.checkSystemHealth();
      setHealthStatus(health);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to check system health:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500 text-white';
      case 'degraded': return 'bg-yellow-500 text-white';
      case 'down': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <RefreshCw className="h-4 w-4" />;
      case 'down': return <RefreshCw className="h-4 w-4" />;
      default: return <RefreshCw className="h-4 w-4" />;
    }
  };

  const healthChecks = [
    { key: 'database', label: 'Database', icon: Database },
    { key: 'gp51', label: 'GP51 API', icon: Radio },
    { key: 'auth', label: 'Authentication', icon: Shield },
  ];

  if (isLoading && !healthStatus) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Checking system health...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            System Health Monitor
            {healthStatus && (
              <Badge className={getStatusColor(healthStatus.overall)}>
                {getStatusIcon(healthStatus.overall)}
                {healthStatus.overall.toUpperCase()}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={checkSystemHealth}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {healthStatus && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {healthChecks.map(({ key, label, icon: Icon }) => {
                let status = 'unknown';
                if (key === 'database') status = healthStatus.database;
                if (key === 'gp51') status = healthStatus.gp51Connection ? 'healthy' : 'down';
                if (key === 'auth') status = healthStatus.databaseConnection ? 'healthy' : 'down';
                
                return (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{label}</span>
                    </div>
                    <Badge className={getStatusColor(status)}>
                      {status.toUpperCase()}
                    </Badge>
                  </div>
                );
              })}
            </div>

            <div className="text-sm text-gray-500 text-center pt-4 border-t">
              Last checked: {new Date(healthStatus.lastChecked).toLocaleString()}
              <br />
              Auto-refresh: {lastRefresh.toLocaleTimeString()}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemHealthDashboard;
