
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { parseErrorLog } from '@/utils/bulk-import-utils';
import type { BulkImportJob } from '@/types/bulk-import';
import { 
  Database, 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Shield,
  Wifi,
  WifiOff
} from 'lucide-react';

// Type guard to ensure status is valid
const validateStatus = (status: string): BulkImportJob['status'] => {
  const validStatuses: BulkImportJob['status'][] = [
    'pending', 'running', 'paused', 'completed', 'completed_with_errors', 'failed'
  ];
  return validStatuses.includes(status as BulkImportJob['status']) 
    ? status as BulkImportJob['status'] 
    : 'pending';
};

// Safe data mapper to handle database inconsistencies
const mapDatabaseToBulkImportJob = (dbData: any): BulkImportJob => {
  return {
    id: dbData.id || '',
    job_name: dbData.job_name || 'Unknown Job',
    status: validateStatus(dbData.status || 'pending'),
    total_items: Number(dbData.total_items) || 0,
    processed_items: Number(dbData.processed_items) || 0,
    successful_items: Number(dbData.successful_items) || 0,
    failed_items: Number(dbData.failed_items) || 0,
    current_chunk: Number(dbData.current_chunk) || 0,
    total_chunks: Number(dbData.total_chunks) || 0,
    chunk_size: Number(dbData.chunk_size) || 50,
    error_log: parseErrorLog(dbData.error_log),
    started_at: dbData.started_at || undefined,
    completed_at: dbData.completed_at || undefined,
    created_at: dbData.created_at || new Date().toISOString(),
    updated_at: dbData.updated_at || new Date().toISOString(),
    import_type: dbData.import_type || 'gp51_vehicles',
    import_data: dbData.import_data || {}
  };
};

interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
}

const EnhancedBulkImportManager: React.FC = () => {
  const [jobs, setJobs] = useState<BulkImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionTestResult | null>(null);
  const [activeJob, setActiveJob] = useState<BulkImportJob | null>(null);
  const { toast } = useToast();

  // Load existing jobs
  useEffect(() => {
    loadJobs();
    // Set up real-time subscription for job updates
    const subscription = supabase
      .channel('bulk_import_jobs')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bulk_import_jobs' },
        () => loadJobs()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('bulk_import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Safely map database data to expected types
      const mappedJobs = (data || []).map(mapDatabaseToBulkImportJob);
      setJobs(mappedJobs);

      // Update active job if it exists
      const runningJob = mappedJobs.find(job => job.status === 'running');
      setActiveJob(runningJob || null);

    } catch (error) {
      console.error('Error loading jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load import jobs",
        variant: "destructive"
      });
    }
  };

  const testGP51Connection = async () => {
    setIsConnecting(true);
    setConnectionStatus(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('🔗 Testing GP51 connection...');
      
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { 
          action: 'test_connection',
          user_id: user.id
        }
      });

      if (error) {
        console.error('❌ Connection test failed:', error);
        setConnectionStatus({
          success: false,
          message: `Connection test failed: ${error.message}`,
          details: error
        });
        return;
      }

      console.log('✅ Connection test result:', data);
      
      if (data?.success) {
        setConnectionStatus({
          success: true,
          message: `Connected successfully! Found ${data.device_count || 0} devices`,
          details: data
        });
        toast({
          title: "Connection Successful",
          description: `GP51 connection verified. ${data.device_count || 0} devices available for import.`
        });
      } else {
        setConnectionStatus({
          success: false,
          message: data?.error || 'Connection test failed',
          details: data
        });
      }

    } catch (error) {
      console.error('❌ Connection test error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setConnectionStatus({
        success: false,
        message: `Connection failed: ${errorMessage}`,
        details: error
      });
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const startBulkImport = async () => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('🚀 Starting bulk import...');
      
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { 
          action: 'start',
          job_name: `GP51 Bulk Import - ${new Date().toISOString()}`,
          user_id: user.id
        }
      });

      if (error) {
        console.error('❌ Import start failed:', error);
        throw error;
      }

      console.log('✅ Import started:', data);

      if (data?.success) {
        toast({
          title: "Import Started",
          description: `Bulk import initiated. Job ID: ${data.job_id || 'Unknown'}`
        });
        loadJobs(); // Refresh the jobs list
      } else {
        throw new Error(data?.error || 'Failed to start import');
      }

    } catch (error) {
      console.error('❌ Start import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: BulkImportJob['status']) => {
    const statusConfig = {
      pending: { color: 'bg-gray-500', icon: Clock, label: 'Pending' },
      running: { color: 'bg-blue-500', icon: RefreshCw, label: 'Running' },
      paused: { color: 'bg-yellow-500', icon: Pause, label: 'Paused' },
      completed: { color: 'bg-green-500', icon: CheckCircle, label: 'Completed' },
      completed_with_errors: { color: 'bg-orange-500', icon: AlertTriangle, label: 'Completed with Errors' },
      failed: { color: 'bg-red-500', icon: AlertTriangle, label: 'Failed' }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const calculateProgress = (job: BulkImportJob) => {
    if (job.total_items === 0) return 0;
    return Math.round((job.processed_items / job.total_items) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Connection Test Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            GP51 Connection Status
          </CardTitle>
          <CardDescription>
            Test your GP51 platform connection before starting bulk import
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={testGP51Connection}
              disabled={isConnecting}
              variant="outline"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 mr-2" />
                  Test GP51 Connection
                </>
              )}
            </Button>
          </div>

          {connectionStatus && (
            <Alert className={connectionStatus.success ? 'border-green-500' : 'border-red-500'}>
              {connectionStatus.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                {connectionStatus.message}
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
            Import all 3,822 vehicles from GP51 platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={startBulkImport}
              disabled={isLoading || !!activeJob}
              size="lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Starting Import...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Bulk Import
                </>
              )}
            </Button>

            <Button 
              onClick={loadJobs}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {activeJob && (
            <Alert>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Import job "{activeJob.job_name}" is currently running. 
                Progress: {calculateProgress(activeJob)}%
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Import Jobs</CardTitle>
          <CardDescription>
            Monitor the status and progress of your bulk import operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No import jobs found. Start a new bulk import to see progress here.
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{job.job_name}</h3>
                    {getStatusBadge(job.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Items:</span>
                      <div className="font-medium">{job.total_items}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Processed:</span>
                      <div className="font-medium">{job.processed_items}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Successful:</span>
                      <div className="font-medium text-green-600">{job.successful_items}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Failed:</span>
                      <div className="font-medium text-red-600">{job.failed_items}</div>
                    </div>
                  </div>

                  {job.status === 'running' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{calculateProgress(job)}%</span>
                      </div>
                      <Progress value={calculateProgress(job)} className="h-2" />
                      <div className="text-xs text-gray-600">
                        Chunk {job.current_chunk} of {job.total_chunks}
                      </div>
                    </div>
                  )}

                  {job.error_log && job.error_log.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {job.error_log.length} error(s) occurred during import.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="text-xs text-gray-500">
                    Created: {new Date(job.created_at).toLocaleString()}
                    {job.completed_at && (
                      <> • Completed: {new Date(job.completed_at).toLocaleString()}</>
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
