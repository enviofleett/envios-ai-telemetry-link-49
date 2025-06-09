import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GP51ErrorHandler } from '@/services/gp51ErrorHandler';
import { enhancedSessionValidator } from '@/services/enhancedSessionValidator';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Activity, Database, Radio, Users } from 'lucide-react';
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
      const [gp51Status, dbStatus, userStatus] = await Promise.allSettled([checkGP51Health(), checkDatabaseHealth(), checkUserSystemHealth()]);
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
      const {
        error
      } = await supabase.from('envio_users').select('count(*)', {
        count: 'exact',
        head: true
      });
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
      const {
        data: users,
        error
      } = await supabase.from('envio_users').select('id, name, email').limit(1);
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
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };
  const getStatusColor = (statusType: string) => {
    switch (statusType) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  return <Card className="w-full">
      
      
    </Card>;
};
export default SystemHealthIndicator;