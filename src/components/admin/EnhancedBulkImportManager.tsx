
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Database,
  Zap,
  Shield,
  Clock,
  Users,
  Activity
} from 'lucide-react';
import { BulkImportJob } from '@/types/bulk-import';
import { normalizeBulkImportStatus, parseErrorLog } from '@/utils/bulk-import-utils';

const EnhancedBulkImportManager: React.FC = () => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [importJobs, setImportJobs] = useState<BulkImportJob[]>([]);
  const [currentJob, setCurrentJob] = useState<BulkImportJob | null>(null);
  const [lastTestResult, setLastTestResult] = useState<{ deviceCount?: number; timestamp?: Date } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadImportJobs();
    const interval = setInterval(loadImportJobs, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadImportJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('bulk_import_jobs')
        .select('*')
        .eq('import_type', 'gp51_vehicles')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Failed to load import jobs:', error);
        return;
      }

      if (data) {
        const normalizedJobs: BulkImportJob[] = data.map(job => ({
          ...job,
          status: normalizeBulkImportStatus(job.status),
          error_log: parseErrorLog(job.error_log)
        }));
        
        setImportJobs(normalizedJobs);
        
        // Update current job if it exists
        if (currentJob) {
          const updatedCurrentJob = normalizedJobs.find(job => job.id === currentJob.id);
          if (updatedCurrentJob) {
            setCurrentJob(updatedCurrentJob);
            
            // Stop monitoring if job is complete
            if (['completed', 'completed_with_errors', 'failed'].includes(updatedCurrentJob.status)) {
              setIsImporting(false);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading import jobs:', error);
    }
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionError(null);
    
    try {
      console.log('🔧 Testing GP51 connection...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { 
          action: 'test_connection',
          userId: user.id
        }
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw new Error(`Connection test failed: ${error.message}`);
      }

      if (data?.success) {
        setConnectionStatus('connected');
        setLastTestResult({
          deviceCount: data.deviceCount || 0,
          timestamp: new Date()
        });
        
        toast({
          title: "Connection Test Successful",
          description: `GP51 API is responding correctly. Found ${data.deviceCount || 0} devices.`
        });
      } else {
        setConnectionStatus('failed');
        setConnectionError(data?.error || 'Unknown connection error');
        
        toast({
          title: "Connection Test Failed",
          description: data?.error || 'Unknown connection error',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionStatus('failed');
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      setConnectionError(errorMessage);
      
      toast({
        title: "Connection Test Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const startImport = async () => {
    if (connectionStatus !== 'connected') {
      toast({
        title: "Connection Required",
        description: "Please test connection first before starting import",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('🚀 Starting bulk import...');

      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { 
          action: 'start',
          userId: user.id
        }
      });

      if (error) {
        console.error('Import start error:', error);
        throw new Error(`Failed to start import: ${error.message}`);
      }

      if (data?.success) {
        toast({
          title: "Import Started",
          description: `Bulk import initiated for ${data.totalDevices || 0} devices. Job ID: ${data.jobId}`
        });
        
        // Load the created job
        await loadImportJobs();
        
        // Set current job for monitoring
        const newJob = importJobs.find(job => job.id === data.jobId);
        if (newJob) {
          setCurrentJob(newJob);
        }
      } else {
        throw new Error(data?.error || 'Failed to start import');
      }
    } catch (error) {
      console.error('Import start error:', error);
      setIsImporting(false);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to start import';
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'completed_with_errors':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = {
      'completed': 'default' as const,
      'completed_with_errors': 'secondary' as const,
      'failed': 'destructive' as const,
      'running': 'default' as const,
      'paused': 'secondary' as const,
      'pending': 'secondary' as const
    }[status] || 'secondary' as const;

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const calculateProgress = (job: BulkImportJob): number => {
    if (job.total_items === 0) return 0;
    return Math.round((job.processed_items / job.total_items) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            GP51 Connection Status
          </CardTitle>
          <CardDescription>
            Test connectivity to GP51 API before starting bulk import operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'failed' ? 'bg-red-500' : 'bg-gray-400'
              }`} />
              <span className="font-medium">
                {connectionStatus === 'connected' ? 'Connected' : 
                 connectionStatus === 'failed' ? 'Failed' : 'Unknown'}
              </span>
              {lastTestResult && (
                <span className="text-sm text-gray-500">
                  ({lastTestResult.deviceCount} devices found)
                </span>
              )}
            </div>
            <Button 
              onClick={testConnection}
              disabled={isTestingConnection}
              variant="outline"
              size="sm"
            >
              {isTestingConnection ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
          </div>
          
          {connectionError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{connectionError}</AlertDescription>
            </Alert>
          )}
          
          {lastTestResult && connectionStatus === 'connected' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Connection successful! Found {lastTestResult.deviceCount} devices available for import.
                Last tested: {lastTestResult.timestamp.toLocaleTimeString()}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Import Control Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Bulk Import Control
          </CardTitle>
          <CardDescription>
            Import all GP51 vehicles into the system with progress tracking and error handling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-medium">Enhanced Bulk Import</div>
                <div className="text-sm text-gray-500">
                  Chunked processing with automatic backup and error recovery
                </div>
              </div>
            </div>
            <Button 
              onClick={startImport}
              disabled={isImporting || connectionStatus !== 'connected'}
              className="flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Import
                </>
              )}
            </Button>
          </div>
          
          {connectionStatus !== 'connected' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connection test required before starting import operations.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Current Job Progress */}
      {currentJob && ['running', 'pending'].includes(currentJob.status) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Current Import Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{currentJob.job_name}</span>
              {getStatusBadge(currentJob.status)}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{currentJob.processed_items}/{currentJob.total_items} items</span>
              </div>
              <Progress value={calculateProgress(currentJob)} className="h-2" />
            </div>
            
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-green-600">{currentJob.successful_items}</div>
                <div className="text-gray-500">Successful</div>
              </div>
              <div>
                <div className="font-medium text-red-600">{currentJob.failed_items}</div>
                <div className="text-gray-500">Failed</div>
              </div>
              <div>
                <div className="font-medium text-blue-600">{currentJob.current_chunk}/{currentJob.total_chunks}</div>
                <div className="text-gray-500">Chunks</div>
              </div>
              <div>
                <div className="font-medium">{calculateProgress(currentJob)}%</div>
                <div className="text-gray-500">Complete</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Import Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Import Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {importJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No import jobs found. Start your first import above.
            </div>
          ) : (
            <div className="space-y-3">
              {importJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{job.job_name}</span>
                      {getStatusBadge(job.status)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {job.successful_items} successful, {job.failed_items} failed of {job.total_items} total
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(job.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{calculateProgress(job)}%</div>
                    {job.error_log && job.error_log.length > 0 && (
                      <div className="text-xs text-red-500">
                        {job.error_log.length} errors
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedBulkImportManager;
