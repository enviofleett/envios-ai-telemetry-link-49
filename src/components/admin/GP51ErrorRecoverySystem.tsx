
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import type { SyncStatus } from '../types/syncTypes';
import { Json } from '@/integrations/supabase/types';

// Type-safe helper for accessing error log properties
const getErrorLogProperty = (errorLog: Json, property: string): any => {
  if (Array.isArray(errorLog)) {
    return errorLog.find(item => 
      typeof item === 'object' && item !== null && property in (item as Record<string, any>)
    );
  }
  if (typeof errorLog === 'object' && errorLog !== null && !Array.isArray(errorLog)) {
    return (errorLog as Record<string, any>)[property];
  }
  return null;
};

const isValidErrorLog = (errorLog: Json): errorLog is Record<string, any>[] => {
  return Array.isArray(errorLog);
};

interface RecoveryAction {
  id: string;
  type: 'retry_sync' | 'refresh_token' | 'clear_cache' | 'reset_connection';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  automated: boolean;
}

const GP51ErrorRecoverySystem: React.FC = () => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: failedSyncs, isLoading } = useQuery({
    queryKey: ['gp51-failed-syncs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gp51_sync_status')
        .select('*')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as SyncStatus[];
    },
  });

  const { data: errorPatterns } = useQuery({
    queryKey: ['gp51-error-patterns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gp51_sync_status')
        .select('error_log, sync_details')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      // Analyze error patterns
      const patterns: Record<string, number> = {};
      data?.forEach(sync => {
        if (isValidErrorLog(sync.error_log)) {
          sync.error_log.forEach((error: any) => {
            if (typeof error === 'object' && error?.type) {
              patterns[error.type] = (patterns[error.type] || 0) + 1;
            }
          });
        }
      });
      
      return Object.entries(patterns)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);
    },
  });

  const { data: recoveryActions } = useQuery({
    queryKey: ['gp51-recovery-actions'],
    queryFn: async () => {
      // Mock recovery actions - in real implementation, this would be dynamic based on error analysis
      const actions: RecoveryAction[] = [
        {
          id: 'retry_failed',
          type: 'retry_sync',
          title: 'Retry Failed Syncs',
          description: 'Automatically retry all failed synchronization operations',
          severity: 'medium',
          automated: true
        },
        {
          id: 'refresh_token',
          type: 'refresh_token',
          title: 'Refresh GP51 Token',
          description: 'Refresh the GP51 authentication token to resolve auth issues',
          severity: 'high',
          automated: true
        },
        {
          id: 'clear_cache',
          type: 'clear_cache',
          title: 'Clear Data Cache',
          description: 'Clear cached data that might be causing sync conflicts',
          severity: 'low',
          automated: false
        },
        {
          id: 'reset_connection',
          type: 'reset_connection',
          title: 'Reset GP51 Connection',
          description: 'Completely reset the GP51 connection and re-establish session',
          severity: 'high',
          automated: false
        }
      ];
      
      return actions;
    },
  });

  const executeRecoveryMutation = useMutation({
    mutationFn: async (actionIds: string[]) => {
      // Mock implementation - would call actual recovery functions
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate recovery results
      return {
        success: true,
        recoveredSyncs: Math.floor(Math.random() * 5) + 1,
        message: 'Recovery actions completed successfully'
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gp51-failed-syncs'] });
      queryClient.invalidateQueries({ queryKey: ['gp51-error-patterns'] });
      setIsRecovering(false);
      setSelectedActions([]);
    },
  });

  const handleRecoveryAction = async (actionIds: string[]) => {
    setIsRecovering(true);
    executeRecoveryMutation.mutate(actionIds);
  };

  const toggleActionSelection = (actionId: string) => {
    setSelectedActions(prev => 
      prev.includes(actionId) 
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Recovery Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span>Error Recovery System</span>
              </CardTitle>
              <CardDescription>
                Intelligent error detection and automated recovery
              </CardDescription>
            </div>
            <Badge variant={failedSyncs && failedSyncs.length > 0 ? "destructive" : "default"}>
              {failedSyncs?.length || 0} Failed Syncs
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center p-4 bg-red-50 rounded-lg">
              <XCircle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <div className="font-semibold text-red-800">Failed Operations</div>
                <div className="text-sm text-red-600">{failedSyncs?.length || 0} requiring attention</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
              <Clock className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <div className="font-semibold text-yellow-800">Pending Recovery</div>
                <div className="text-sm text-yellow-600">{selectedActions.length} actions selected</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="font-semibold text-green-800">Auto Recovery</div>
                <div className="text-sm text-green-600">Enabled & monitoring</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recovery Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Available Recovery Actions</CardTitle>
          <CardDescription>Select and execute recovery actions to resolve sync issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recoveryActions?.map((action) => (
              <div key={action.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedActions.includes(action.id)}
                    onChange={() => toggleActionSelection(action.id)}
                    className="rounded"
                  />
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-medium">{action.title}</div>
                      <div className="text-sm text-gray-500">{action.description}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={
                    action.severity === 'high' ? 'destructive' : 
                    action.severity === 'medium' ? 'default' : 'secondary'
                  }>
                    {action.severity}
                  </Badge>
                  {action.automated && (
                    <Badge variant="outline">Auto</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {selectedActions.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedActions.length} action(s) selected
              </div>
              <Button 
                onClick={() => handleRecoveryAction(selectedActions)}
                disabled={isRecovering}
                className="flex items-center space-x-2"
              >
                {isRecovering ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>Execute Recovery</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Patterns Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Error Pattern Analysis</CardTitle>
          <CardDescription>Most common error types and their frequency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {errorPatterns?.map((pattern, index) => (
              <div key={pattern.type} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">{index + 1}</Badge>
                  <div>
                    <div className="font-medium">{pattern.type}</div>
                    <div className="text-sm text-gray-500">Error type</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="font-medium">{pattern.count}</div>
                    <div className="text-sm text-gray-500">occurrences</div>
                  </div>
                  <div className="w-32">
                    <Progress value={(pattern.count / (errorPatterns[0]?.count || 1)) * 100} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Failed Syncs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Failed Syncs</CardTitle>
          <CardDescription>Latest synchronization failures requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {failedSyncs?.map((sync) => (
              <div key={sync.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="font-medium">{sync.sync_type}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(sync.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    {sync.failed_syncs || 0} failed / {sync.total_devices || 0} total
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleRecoveryAction(['retry_failed'])}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isRecovering && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Executing recovery actions... This may take a few moments.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default GP51ErrorRecoverySystem;
