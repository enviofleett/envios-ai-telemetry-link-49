
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Square, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PollingStatus {
  isRunning: boolean;
  lastPollTime: string | null;
  errorCount: number;
  lastError: string | null;
}

const PollingControls: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [intervalId, setIntervalId] = useState<number | null>(null);

  // Check current polling status
  const { data: pollingStatus, isLoading } = useQuery({
    queryKey: ['polling-status'],
    queryFn: async (): Promise<PollingStatus> => {
      const { data, error } = await supabase
        .from('gp51_polling_config')
        .select('*')
        .single();

      if (error) {
        console.error('Failed to fetch polling status:', error);
        return { isRunning: false, lastPollTime: null, errorCount: 0, lastError: null };
      }

      return {
        isRunning: !!intervalId,
        lastPollTime: data.last_successful_poll,
        errorCount: data.error_count || 0,
        lastError: data.last_error
      };
    },
    refetchInterval: 5000,
  });

  // Manual polling trigger
  const triggerPollingMutation = useMutation({
    mutationFn: async () => {
      console.log('Manually triggering GP51 polling...');
      
      const { data, error } = await supabase.functions.invoke('gp51-realtime-polling', {
        body: { trigger: 'manual' }
      });

      if (error) {
        console.error('Polling function error:', error);
        throw new Error(error.message || 'Failed to trigger polling');
      }

      if (data.error) {
        console.error('Polling data error:', data.error);
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Polling successful:', data);
      toast({
        title: 'Polling Successful',
        description: `Updated ${data.vehiclesUpdated || 0} vehicles`,
      });
      queryClient.invalidateQueries({ queryKey: ['polling-status'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-vehicles'] });
    },
    onError: (error: any) => {
      console.error('Polling failed:', error);
      toast({
        title: 'Polling Failed',
        description: error.message || 'Failed to update vehicle data',
        variant: 'destructive',
      });
    },
  });

  // Start continuous polling
  const startPolling = () => {
    if (intervalId) return;

    console.log('Starting continuous polling every 30 seconds...');
    
    // Trigger immediately
    triggerPollingMutation.mutate();
    
    // Set up interval
    const id = window.setInterval(() => {
      triggerPollingMutation.mutate();
    }, 30000);

    setIntervalId(id);
    
    toast({
      title: 'Polling Started',
      description: 'Vehicle data will update every 30 seconds',
    });
  };

  // Stop continuous polling
  const stopPolling = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
      console.log('Stopped continuous polling');
      
      toast({
        title: 'Polling Stopped',
        description: 'Automatic vehicle data updates have been stopped',
      });
    }
  };

  const getStatusInfo = () => {
    if (intervalId) {
      return {
        status: 'Running',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle
      };
    }

    if (pollingStatus?.errorCount && pollingStatus.errorCount > 0) {
      return {
        status: 'Error',
        color: 'bg-red-100 text-red-800',
        icon: AlertTriangle
      };
    }

    return {
      status: 'Stopped',
      color: 'bg-gray-100 text-gray-800',
      icon: Square
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <StatusIcon className="h-4 w-4" />
          Real-time Polling Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          <Badge className={statusInfo.color}>
            {statusInfo.status}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={startPolling}
            disabled={!!intervalId || triggerPollingMutation.isPending}
            size="sm"
            className="flex items-center gap-1"
          >
            <Play className="h-3 w-3" />
            Start Auto-Polling
          </Button>
          
          <Button
            onClick={stopPolling}
            disabled={!intervalId}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Square className="h-3 w-3" />
            Stop
          </Button>
          
          <Button
            onClick={() => triggerPollingMutation.mutate()}
            disabled={triggerPollingMutation.isPending}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${triggerPollingMutation.isPending ? 'animate-spin' : ''}`} />
            Manual Update
          </Button>
        </div>

        {pollingStatus?.lastPollTime && (
          <div className="text-xs text-gray-500">
            Last update: {new Date(pollingStatus.lastPollTime).toLocaleString()}
          </div>
        )}

        {pollingStatus?.lastError && (
          <Alert className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Last Error:</strong> {pollingStatus.lastError}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default PollingControls;
