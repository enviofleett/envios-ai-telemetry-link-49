
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BulkImportJob } from '@/types/bulk-import';
import { parseErrorLog, parseImportData } from '@/utils/bulk-import-utils';
import { 
  Database, 
  Play, 
  Pause, 
  Square, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Shield,
  Zap
} from 'lucide-react';

const EnhancedBulkImportManager: React.FC = () => {
  const [jobs, setJobs] = useState<BulkImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [jobName, setJobName] = useState('');
  const [chunkSize, setChunkSize] = useState(50);
  const [isStarting, setIsStarting] = useState(false);
  const [connectionTest, setConnectionTest] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });
  const { toast } = useToast();

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('bulk_import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const mappedJobs: BulkImportJob[] = (data || []).map(job => ({
        ...job,
        error_log: parseErrorLog(job.error_log),
        import_data: parseImportData(job.import_data)
      }));

      setJobs(mappedJobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load import jobs",
        variant: "destructive"
      });
    }
  };

  const testConnection = async () => {
    setConnectionTest({ status: 'testing', message: 'Testing GP51 connectivity...' });
    
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: {
          action: 'test_connection'
        }
      });

      if (error) throw error;

      if (data.success) {
        setConnectionTest({ 
          status: 'success', 
          message: 'GP51 connection successful' 
        });
        toast({
          title: "Connection Test",
          description: "GP51 connectivity verified successfully",
        });
      } else {
        throw new Error(data.error || 'Connection test failed');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionTest({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Connection test failed' 
      });
      toast({
        title: "Connection Test Failed",
        description: error instanceof Error ? error.message : 'Failed to test GP51 connection',
        variant: "destructive"
      });
    }
  };

  const startBulkImport = async () => {
    if (!jobName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a job name",
        variant: "destructive"
      });
      return;
    }

    setIsStarting(true);
    try {
      console.log('🚀 Starting bulk import with params:', { 
        action: 'start', 
        jobName: jobName.trim(), 
        chunkSize 
      });

      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: {
          action: 'start', // Fixed: changed from 'start_import' to 'start'
          jobName: jobName.trim(),
          chunkSize,
          importType: 'gp51_vehicles'
        }
      });

      console.log('📋 Import response:', { data, error });

      if (error) {
        console.error('❌ Import invocation error:', error);
        throw error;
      }

      if (!data?.success) {
        console.error('❌ Import failed:', data);
        throw new Error(data?.error || 'Import failed with unknown error');
      }

      toast({
        title: "Import Started",
        description: `Bulk import job "${jobName}" has been started successfully`,
      });

      // Clear form and reload jobs
      setJobName('');
      setChunkSize(50);
      await loadJobs();

    } catch (error) {
      console.error('❌ Failed to start bulk import:', error);
      
      // More specific error handling
      let errorMessage = 'Failed to start bulk import';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }

      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsStarting(false);
    }
  };

  const cancelJob = async (jobId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: {
          action: 'cancel',
          jobId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Job Cancelled",
          description: "Import job has been cancelled successfully",
        });
        await loadJobs();
      } else {
        throw new Error(data.error || 'Failed to cancel job');
      }
    } catch (error) {
      console.error('Failed to cancel job:', error);
      toast({
        title: "Cancel Failed",
        description: error instanceof Error ? error.message : 'Failed to cancel job',
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'paused':
        return <Pause className="h-5 w-5 text-orange-600" />;
      default:
        return <Database className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'running':
        return 'text-blue-600 bg-blue-50';
      case 'paused':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const calculateProgress = (job: BulkImportJob) => {
    if (job.total_items === 0) return 0;
    return Math.round((job.processed_items / job.total_items) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            GP51 Connection Test
          </CardTitle>
          <CardDescription>
            Verify GP51 platform connectivity before starting import operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={testConnection} 
              disabled={connectionTest.status === 'testing'}
              variant="outline"
            >
              {connectionTest.status === 'testing' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {connectionTest.status === 'testing' ? 'Testing...' : 'Test Connection'}
            </Button>
            
            {connectionTest.message && (
              <Alert className={`flex-1 ${
                connectionTest.status === 'success' ? 'border-green-200 bg-green-50' :
                connectionTest.status === 'error' ? 'border-red-200 bg-red-50' :
                'border-blue-200 bg-blue-50'
              }`}>
                <AlertDescription className={
                  connectionTest.status === 'success' ? 'text-green-700' :
                  connectionTest.status === 'error' ? 'text-red-700' :
                  'text-blue-700'
                }>
                  {connectionTest.message}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Start New Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-green-600" />
            Start Bulk Import
          </CardTitle>
          <CardDescription>
            Import all vehicles from GP51 platform with automatic backup and progress tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="jobName">Job Name</Label>
              <Input
                id="jobName"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="e.g., Production Import December 2024"
                disabled={isStarting}
              />
            </div>
            <div>
              <Label htmlFor="chunkSize">Chunk Size</Label>
              <Input
                id="chunkSize"
                type="number"
                value={chunkSize}
                onChange={(e) => setChunkSize(parseInt(e.target.value) || 50)}
                min={10}
                max={200}
                disabled={isStarting}
              />
              <p className="text-sm text-gray-500 mt-1">
                Number of vehicles to process per chunk (10-200)
              </p>
            </div>
          </div>
          
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              This will create an automatic backup before starting the import process. 
              All 3,822 vehicles will be imported in chunks to ensure system stability.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={startBulkImport} 
            disabled={isStarting || !jobName.trim()}
            className="w-full"
          >
            {isStarting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {isStarting ? 'Starting Import...' : 'Start Bulk Import'}
          </Button>
        </CardContent>
      </Card>

      {/* Active Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Import Jobs
          </CardTitle>
          <CardDescription>
            Monitor active and completed import operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No import jobs found. Start your first import above.
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <span className="font-medium">{job.job_name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status.toUpperCase()}
                      </span>
                    </div>
                    
                    {job.status === 'running' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelJob(job.id)}
                      >
                        <Square className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>

                  {job.total_items > 0 && (
                    <div className="mb-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress: {job.processed_items}/{job.total_items} items</span>
                        <span>{calculateProgress(job)}%</span>
                      </div>
                      <Progress value={calculateProgress(job)} className="h-2" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Successful:</span>
                      <span className="ml-1 font-medium text-green-600">{job.successful_items}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Failed:</span>
                      <span className="ml-1 font-medium text-red-600">{job.failed_items}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Chunk:</span>
                      <span className="ml-1 font-medium">{job.current_chunk}/{job.total_chunks}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Started:</span>
                      <span className="ml-1 font-medium">
                        {job.started_at ? new Date(job.started_at).toLocaleString() : 'Not started'}
                      </span>
                    </div>
                  </div>

                  {job.error_log.length > 0 && (
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <details>
                          <summary className="cursor-pointer font-medium">
                            {job.error_log.length} error(s) occurred
                          </summary>
                          <div className="mt-2 space-y-1">
                            {job.error_log.slice(0, 3).map((error, index) => (
                              <div key={index} className="text-sm bg-red-50 p-2 rounded">
                                {typeof error === 'string' ? error : JSON.stringify(error)}
                              </div>
                            ))}
                            {job.error_log.length > 3 && (
                              <div className="text-sm text-gray-500">
                                ... and {job.error_log.length - 3} more errors
                              </div>
                            )}
                          </div>
                        </details>
                      </AlertDescription>
                    </Alert>
                  )}
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
