
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface GP51Status {
  connected: boolean;
  username?: string;
  expiresAt?: string;
}

interface GP51ConnectionInfoProps {
  gp51Status?: GP51Status;
  statusLoading: boolean;
}

const GP51ConnectionInfo: React.FC<GP51ConnectionInfoProps> = ({ 
  gp51Status, 
  statusLoading 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const refreshConnectionMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gp51-status'] });
      toast({ 
        title: 'Connection Refreshed',
        description: 'GP51 connection status updated successfully'
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Refresh Failed', 
        description: error.message || 'Failed to refresh GP51 connection status',
        variant: 'destructive' 
      });
    },
  });

  const getConnectionStatus = () => {
    if (statusLoading) return { icon: null, text: 'Checking...', variant: 'secondary' as const };
    if (gp51Status?.connected) {
      return { 
        icon: <CheckCircle className="h-4 w-4" />, 
        text: 'Connected', 
        variant: 'default' as const 
      };
    }
    return { 
      icon: <XCircle className="h-4 w-4" />, 
      text: 'Disconnected', 
      variant: 'destructive' as const 
    };
  };

  const status = getConnectionStatus();

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={status.variant} className="flex items-center gap-1">
            {status.icon}
            {status.text}
          </Badge>
          {gp51Status?.connected && (
            <span className="text-xs text-gray-500">
              as {gp51Status.username}
            </span>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => refreshConnectionMutation.mutate()}
          disabled={refreshConnectionMutation.isPending}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {gp51Status?.connected && gp51Status?.expiresAt && (
        <Alert>
          <AlertDescription>
            Token expires: {new Date(gp51Status.expiresAt).toLocaleString()}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default GP51ConnectionInfo;
