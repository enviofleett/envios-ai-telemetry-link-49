
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, Database, Wifi, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const SystemHealth: React.FC = () => {
  // Check GP51 session status
  const { data: gp51Status } = useQuery({
    queryKey: ['gp51-health'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gp51_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return { connected: false, error: error.message };
      }

      const isExpired = data.token_expires_at 
        ? new Date(data.token_expires_at) < new Date()
        : true;

      return {
        connected: !isExpired && !!data.gp51_token,
        username: data.username,
        expiresAt: data.token_expires_at
      };
    },
    refetchInterval: 30000,
  });

  // Check database health
  const { data: dbHealth } = useQuery({
    queryKey: ['db-health'],
    queryFn: async () => {
      try {
        const { count: vehicleCount, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*', { count: 'exact', head: true });

        const { count: userCount, error: userError } = await supabase
          .from('envio_users')
          .select('*', { count: 'exact', head: true });

        if (vehicleError || userError) {
          throw new Error(vehicleError?.message || userError?.message);
        }

        return {
          healthy: true,
          vehicleCount: vehicleCount || 0,
          userCount: userCount || 0
        };
      } catch (error) {
        return {
          healthy: false,
          error: error.message
        };
      }
    },
    refetchInterval: 60000,
  });

  // Check vehicles with recent position data
  const { data: dataFreshness } = useQuery({
    queryKey: ['data-freshness'],
    queryFn: async () => {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('last_position')
        .not('last_position', 'is', null);

      if (error) {
        return { fresh: 0, stale: 0, total: 0 };
      }

      const now = new Date();
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

      let fresh = 0;
      let stale = 0;

      vehicles.forEach(vehicle => {
        const position = vehicle.last_position as any;
        if (position?.updatetime) {
          const updateTime = new Date(position.updatetime);
          if (updateTime > thirtyMinutesAgo) {
            fresh++;
          } else {
            stale++;
          }
        } else {
          stale++;
        }
      });

      return {
        fresh,
        stale,
        total: fresh + stale
      };
    },
    refetchInterval: 30000,
  });

  const getHealthStatus = () => {
    const gp51Ok = gp51Status?.connected;
    const dbOk = dbHealth?.healthy;
    const dataOk = dataFreshness ? dataFreshness.fresh > 0 : false;

    if (gp51Ok && dbOk && dataOk) {
      return { status: 'Healthy', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    } else if (gp51Ok && dbOk) {
      return { status: 'Warning', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle };
    } else {
      return { status: 'Critical', color: 'bg-red-100 text-red-800', icon: AlertCircle };
    }
  };

  const healthStatus = getHealthStatus();
  const HealthIcon = healthStatus.icon;

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Overall Status:</span>
          <Badge className={healthStatus.color}>
            <HealthIcon className="h-3 w-3 mr-1" />
            {healthStatus.status}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              GP51 Connection:
            </span>
            <Badge variant={gp51Status?.connected ? "default" : "destructive"} className="text-xs">
              {gp51Status?.connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              Database:
            </span>
            <Badge variant={dbHealth?.healthy ? "default" : "destructive"} className="text-xs">
              {dbHealth?.healthy ? "Healthy" : "Error"}
            </Badge>
          </div>

          {dataFreshness && (
            <div className="text-xs text-gray-600">
              Fresh Data: {dataFreshness.fresh}/{dataFreshness.total} vehicles
            </div>
          )}
        </div>

        {(!gp51Status?.connected || !dbHealth?.healthy) && (
          <Alert className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {!gp51Status?.connected && "GP51 connection lost. "}
              {!dbHealth?.healthy && "Database connectivity issues. "}
              Real-time updates may be affected.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemHealth;
