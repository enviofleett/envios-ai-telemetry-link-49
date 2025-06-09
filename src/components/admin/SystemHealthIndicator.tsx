
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GP51ErrorHandler } from '@/services/gp51ErrorHandler';
import { enhancedSessionValidator } from '@/services/enhancedSessionValidator';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Activity,
  Database,
  Radio,
  Users
} from 'lucide-react';

interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  gp51: 'healthy' | 'degraded' | 'critical';
  database: 'healthy' | 'degraded' | 'critical';
  users: 'healthy' | 'degraded' | 'critical';
  lastChecked: Date;
}

const SystemHealthIndicator: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus>({
    overall: 'degraded',
    gp51: 'degraded',
    database: 'degraded',
    users: 'degraded',
    lastChecked: new Date()
  });
  const [isChecking, setIsChecking] = useState(false);
  const [criticalErrors, setCriticalErrors] = useState<any[]>([]);

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const checkSystemHealth = async () => {
    setIsChecking(true);
    try {
      console.log('🔍 Checking system health...');

      const [gp51Status, dbStatus, userStatus] = await Promise.allSettled([
        checkGP51Health(),
        checkDatabaseHealth(),
        checkUserSystemHealth()
      ]);

      const newStatus: SystemStatus = {
        gp51: gp51Status.status === 'fulfilled' ? gp51Status.value : 'critical',
        database: dbStatus.status === 'fulfilled' ? dbStatus.value : 'critical',
        users: userStatus.status === 'fulfilled' ? userStatus.value : 'critical',
        overall: 'healthy',
        lastChecked: new Date()
      };

      // Calculate overall status
      const statuses = [newStatus.gp51, newStatus.database, newStatus.users];
      if (statuses.includes('critical')) {
        newStatus.overall = 'critical';
      } else if (statuses.includes('degraded')) {
        newStatus.overall = 'degraded';
      }

      setStatus(newStatus);
      setCriticalErrors(GP51ErrorHandler.getCriticalErrors());

    } catch (error) {
      console.error('System health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const checkGP51Health = async (): Promise<'healthy' | 'degraded' | 'critical'> => {
    try {
      const sessionResult = await enhancedSessionValidator.validateGP51Session();
      
      if (!sessionResult.valid) {
        return 'critical';
      }

      // Check if session expires soon
      if (sessionResult.expiresAt) {
        const expiresAt = new Date(sessionResult.expiresAt);
        const hoursUntilExpiry = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
        
        if (hoursUntilExpiry < 1) {
          return 'critical';
        } else if (hoursUntilExpiry < 6) {
          return 'degraded';
        }
      }

      return 'healthy';
    } catch (error) {
      console.error('GP51 health check failed:', error);
      return 'critical';
    }
  };

  const checkDatabaseHealth = async (): Promise<'healthy' | 'degraded' | 'critical'> => {
    try {
      const start = Date.now();
      const { error } = await supabase
        .from('envio_users')
        .select('count(*)', { count: 'exact', head: true });
      
      const responseTime = Date.now() - start;
      
      if (error) {
        return 'critical';
      }

      if (responseTime > 2000) {
        return 'degraded';
      }

      return 'healthy';
    } catch (error) {
      return 'critical';
    }
  };

  const checkUserSystemHealth = async (): Promise<'healthy' | 'degraded' | 'critical'> => {
    try {
      const { data: users, error } = await supabase
        .from('envio_users')
        .select('id, name, email')
        .limit(1);

      if (error) {
        return 'critical';
      }

      // Check if we can see users (indicates proper data access)
      return users && users.length >= 0 ? 'healthy' : 'degraded';
    } catch (error) {
      return 'critical';
    }
  };

  const getStatusIcon = (statusType: string) => {
    switch (statusType) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (statusType: string) => {
    switch (statusType) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health Monitor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(status.overall)}>
              {getStatusIcon(status.overall)}
              {status.overall.toUpperCase()}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={checkSystemHealth}
              disabled={isChecking}
            >
              {isChecking ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-blue-600" />
              <span className="font-medium">GP51 Service</span>
            </div>
            <Badge className={getStatusColor(status.gp51)} variant="outline">
              {getStatusIcon(status.gp51)}
              {status.gp51}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Database</span>
            </div>
            <Badge className={getStatusColor(status.database)} variant="outline">
              {getStatusIcon(status.database)}
              {status.database}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <span className="font-medium">User System</span>
            </div>
            <Badge className={getStatusColor(status.users)} variant="outline">
              {getStatusIcon(status.users)}
              {status.users}
            </Badge>
          </div>
        </div>

        {criticalErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Critical Issues Detected:</div>
                {criticalErrors.slice(0, 3).map((error, index) => (
                  <div key={index} className="text-sm">
                    • {error.message}
                  </div>
                ))}
                {criticalErrors.length > 3 && (
                  <div className="text-sm">
                    ... and {criticalErrors.length - 3} more issues
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-gray-500 text-center">
          Last checked: {status.lastChecked.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthIndicator;
