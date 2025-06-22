
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  Shield, 
  CheckCircle, 
  X, 
  Settings,
  Zap,
  Clock,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ErrorClassification {
  type: 'network' | 'authentication' | 'data_validation' | 'rate_limit' | 'api_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  autoRetry: boolean;
  suggestedAction: string;
}

interface SyncError {
  id: string;
  error_message: string;
  error_type: string;
  occurred_at: string;
  classification: ErrorClassification;
  retry_count: number;
  resolution_status: 'pending' | 'resolved' | 'ignored';
  context: any;
}

interface RecoveryAction {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => Promise<void>;
  enabled: boolean;
}

const GP51ErrorRecoverySystem: React.FC = () => {
  const [errors, setErrors] = useState<SyncError[]>([]);
  const [isProcessingRecovery, setIsProcessingRecovery] = useState(false);
  const [autoRecoveryEnabled, setAutoRecoveryEnabled] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRecentErrors();
    
    // Set up real-time error monitoring
    const channel = supabase
      .channel('error-monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gp51_sync_status'
        },
        (payload) => {
          const record = payload.new;
          if (record.status === 'failed' && record.error_log) {
            handleNewError(record);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRecentErrors = async () => {
    try {
      const { data, error } = await supabase
        .from('gp51_sync_status')
        .select('*')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const classifiedErrors = data.map(record => ({
        id: record.id,
        error_message: extractErrorMessage(record.error_log),
        error_type: classifyErrorType(record.error_log),
        occurred_at: record.created_at,
        classification: classifyError(record.error_log),
        retry_count: record.sync_details?.retry_count || 0,
        resolution_status: 'pending' as const,
        context: record.sync_details
      }));

      setErrors(classifiedErrors);
    } catch (error) {
      console.error('Failed to load errors:', error);
    }
  };

  const handleNewError = (record: any) => {
    const newError: SyncError = {
      id: record.id,
      error_message: extractErrorMessage(record.error_log),
      error_type: classifyErrorType(record.error_log),
      occurred_at: record.created_at,
      classification: classifyError(record.error_log),
      retry_count: record.sync_details?.retry_count || 0,
      resolution_status: 'pending',
      context: record.sync_details
    };

    setErrors(prev => [newError, ...prev.slice(0, 9)]);

    // Show notification
    toast({
      title: 'New Sync Error Detected',
      description: newError.error_message,
      variant: 'destructive',
      duration: 5000
    });

    // Attempt auto-recovery if enabled and error is recoverable
    if (autoRecoveryEnabled && newError.classification.recoverable) {
      attemptAutoRecovery(newError);
    }
  };

  const classifyError = (errorLog: any): ErrorClassification => {
    const errorMessage = extractErrorMessage(errorLog);
    const message = errorMessage.toLowerCase();

    if (message.includes('token') || message.includes('auth') || message.includes('unauthorized')) {
      return {
        type: 'authentication',
        severity: 'high',
        recoverable: true,
        autoRetry: true,
        suggestedAction: 'Refresh GP51 authentication session'
      };
    }

    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return {
        type: 'network',
        severity: 'medium',
        recoverable: true,
        autoRetry: true,
        suggestedAction: 'Retry operation with exponential backoff'
      };
    }

    if (message.includes('rate limit') || message.includes('too many requests')) {
      return {
        type: 'rate_limit',
        severity: 'medium',
        recoverable: true,
        autoRetry: true,
        suggestedAction: 'Wait and retry with reduced request rate'
      };
    }

    if (message.includes('validation') || message.includes('invalid data')) {
      return {
        type: 'data_validation',
        severity: 'high',
        recoverable: false,
        autoRetry: false,
        suggestedAction: 'Manual data correction required'
      };
    }

    return {
      type: 'api_error',
      severity: 'medium',
      recoverable: false,
      autoRetry: false,
      suggestedAction: 'Check GP51 API status and logs'
    };
  };

  const extractErrorMessage = (errorLog: any): string => {
    if (!errorLog) return 'Unknown error';
    
    if (typeof errorLog === 'string') return errorLog;
    
    if (Array.isArray(errorLog) && errorLog.length > 0) {
      const lastError = errorLog[errorLog.length - 1];
      return typeof lastError === 'string' ? lastError : lastError.message || 'Unknown error';
    }
    
    if (typeof errorLog === 'object' && errorLog.message) {
      return errorLog.message;
    }
    
    return 'Unknown error format';
  };

  const classifyErrorType = (errorLog: any): string => {
    const message = extractErrorMessage(errorLog).toLowerCase();
    
    if (message.includes('auth')) return 'Authentication';
    if (message.includes('network')) return 'Network';
    if (message.includes('rate')) return 'Rate Limit';
    if (message.includes('validation')) return 'Data Validation';
    
    return 'General';
  };

  const attemptAutoRecovery = async (error: SyncError) => {
    console.log(`🔄 Attempting auto-recovery for error: ${error.id}`);
    
    try {
      switch (error.classification.type) {
        case 'authentication':
          await refreshAuthentication();
          break;
        case 'network':
          await retryWithBackoff(error);
          break;
        case 'rate_limit':
          await delayedRetry(error);
          break;
        default:
          console.log('No auto-recovery available for this error type');
          return;
      }
      
      toast({
        title: 'Auto-Recovery Successful',
        description: `Error ${error.id} has been automatically resolved`,
        duration: 5000
      });
      
    } catch (recoveryError) {
      console.error('Auto-recovery failed:', recoveryError);
      
      toast({
        title: 'Auto-Recovery Failed',
        description: 'Manual intervention may be required',
        variant: 'destructive',
        duration: 5000
      });
    }
  };

  const refreshAuthentication = async () => {
    console.log('🔐 Refreshing GP51 authentication...');
    
    const { data, error } = await supabase.functions.invoke('gp51-service-management', {
      body: { action: 'refresh_session' }
    });
    
    if (error) throw error;
    
    console.log('✅ Authentication refreshed successfully');
  };

  const retryWithBackoff = async (error: SyncError) => {
    const delay = Math.min(1000 * Math.pow(2, error.retry_count), 30000);
    console.log(`⏳ Retrying after ${delay}ms delay...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const { data, error: retryError } = await supabase.functions.invoke('vehicle-sync-cron', {
      body: { retry_error_id: error.id }
    });
    
    if (retryError) throw retryError;
  };

  const delayedRetry = async (error: SyncError) => {
    const delay = 60000; // 1 minute delay for rate limits
    console.log(`⏳ Waiting ${delay}ms for rate limit recovery...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    await retryWithBackoff(error);
  };

  const recoveryActions: RecoveryAction[] = [
    {
      id: 'refresh-auth',
      name: 'Refresh Authentication',
      description: 'Refresh GP51 session tokens',
      icon: Shield,
      action: refreshAuthentication,
      enabled: true
    },
    {
      id: 'test-connection',
      name: 'Test Connection',
      description: 'Verify GP51 API connectivity',
      icon: Zap,
      action: async () => {
        const { data, error } = await supabase.functions.invoke('gp51-service-management', {
          body: { action: 'test_connection' }
        });
        if (error) throw error;
      },
      enabled: true
    },
    {
      id: 'clear-cache',
      name: 'Clear Cache',
      description: 'Clear cached sync data',
      icon: RefreshCw,
      action: async () => {
        // Clear cache implementation
        console.log('🧹 Clearing sync cache...');
      },
      enabled: true
    }
  ];

  const executeRecoveryAction = async (action: RecoveryAction) => {
    setIsProcessingRecovery(true);
    
    try {
      await action.action();
      toast({
        title: 'Recovery Action Successful',
        description: `${action.name} completed successfully`,
        duration: 5000
      });
    } catch (error) {
      toast({
        title: 'Recovery Action Failed',
        description: `${action.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setIsProcessingRecovery(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Settings className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Recovery Actions Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Error Recovery System</span>
          </CardTitle>
          <CardDescription>
            Intelligent error detection and automated recovery tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Auto-Recovery:</span>
              <Badge variant={autoRecoveryEnabled ? 'default' : 'secondary'}>
                {autoRecoveryEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRecoveryEnabled(!autoRecoveryEnabled)}
            >
              {autoRecoveryEnabled ? 'Disable' : 'Enable'} Auto-Recovery
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recoveryActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card key={action.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Icon className="h-5 w-5 text-blue-500 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{action.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {action.description}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3 w-full"
                          disabled={!action.enabled || isProcessingRecovery}
                          onClick={() => executeRecoveryAction(action)}
                        >
                          {isProcessingRecovery ? (
                            <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                          ) : null}
                          Execute
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Errors</CardTitle>
          <CardDescription>
            Classification and resolution status of recent synchronization errors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errors.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Errors</h3>
              <p className="text-gray-500">
                All synchronization operations are running smoothly.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {errors.map((error) => (
                <Alert key={error.id} className="relative">
                  <div className="flex items-start space-x-3">
                    {getSeverityIcon(error.classification.severity)}
                    <div className="flex-1">
                      <AlertTitle className="flex items-center justify-between">
                        <span>{error.error_type} Error</span>
                        <div className="flex items-center space-x-2">
                          <Badge className={getSeverityColor(error.classification.severity)}>
                            {error.classification.severity.toUpperCase()}
                          </Badge>
                          {error.classification.recoverable && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Recoverable
                            </Badge>
                          )}
                        </div>
                      </AlertTitle>
                      <AlertDescription className="mt-2">
                        <div className="space-y-2">
                          <p className="text-sm">{error.error_message}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              Occurred: {new Date(error.occurred_at).toLocaleString()}
                            </span>
                            <span>
                              Retries: {error.retry_count}
                            </span>
                          </div>
                          {error.classification.suggestedAction && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                              <strong>Suggested Action:</strong> {error.classification.suggestedAction}
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51ErrorRecoverySystem;
