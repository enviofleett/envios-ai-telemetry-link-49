
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, WifiOff, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PollingConfig {
  id: string;
  polling_interval_seconds: number;
  last_poll_time: string | null;
  last_successful_poll: string | null;
  is_enabled: boolean;
  error_count: number;
  last_error: string | null;
}

const RealTimeStatus: React.FC = () => {
  const { data: pollingStatus, isLoading } = useQuery({
    queryKey: ['polling-status'],
    queryFn: async (): Promise<PollingConfig | null> => {
      const { data, error } = await supabase
        .from('gp51_polling_config')
        .select('*')
        .single();

      if (error) {
        console.error('Failed to fetch polling status:', error);
        return null;
      }

      return data;
    },
    refetchInterval: 10000, // Check status every 10 seconds
  });

  if (isLoading || !pollingStatus) {
    return null;
  }

  const getStatusInfo = () => {
    if (!pollingStatus.is_enabled) {
      return {
        status: 'Disabled',
        color: 'bg-gray-100 text-gray-800',
        icon: WifiOff
      };
    }

    if (pollingStatus.error_count > 0) {
      return {
        status: 'Error',
        color: 'bg-red-100 text-red-800',
        icon: AlertTriangle
      };
    }

    const lastPoll = pollingStatus.last_successful_poll 
      ? new Date(pollingStatus.last_successful_poll)
      : null;
    
    const timeSinceLastPoll = lastPoll 
      ? (Date.now() - lastPoll.getTime()) / 1000
      : Infinity;

    // If last poll was more than 2 intervals ago, consider it stale
    const maxAge = pollingStatus.polling_interval_seconds * 2;
    
    if (timeSinceLastPoll > maxAge) {
      return {
        status: 'Stale',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock
      };
    }

    return {
      status: 'Active',
      color: 'bg-green-100 text-green-800',
      icon: Wifi
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const formatLastUpdate = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)}m ago`;
    } else {
      return date.toLocaleTimeString();
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <StatusIcon className="h-4 w-4" />
          Real-time Data Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Polling Status:</span>
          <Badge className={statusInfo.color}>
            {statusInfo.status}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Interval:</span>
          <span className="text-sm font-medium">
            {pollingStatus.polling_interval_seconds}s
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Last Update:</span>
          <span className="text-sm font-medium">
            {formatLastUpdate(pollingStatus.last_successful_poll)}
          </span>
        </div>

        {pollingStatus.error_count > 0 && pollingStatus.last_error && (
          <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
            <span className="font-medium">Last Error:</span> {pollingStatus.last_error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeStatus;
