
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Database, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  TrendingUp,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImportJob {
  id: string;
  job_name: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'completed_with_errors' | 'failed';
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  current_chunk: number;
  total_chunks: number;
  chunk_size: number;
  error_log: any[];
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  import_data?: any;
}

const EnhancedBulkImportManager: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);
  const [recentJobs, setRecentJobs] = useState<ImportJob[]>([]);
  const [importStats, setImportStats] = useState({
    totalVehiclesInSystem: 0,
    lastImportCount: 0,
    successRate: 0
  });
  const { toast } = useToast();

  const loadRecentJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('bulk_import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentJobs(data || []);

      // Calculate stats
      const totalVehicles = await supabase
        .from('vehicles')
        .select('id', { count: 'exact' });
      
      if (data && data.length > 0) {
        const lastJob = data[0];
        const successRate = lastJob.total_items > 0 
          ? (lastJob.successful_items / lastJob.total_items) * 100 
          : 0;
        
        setImportStats({
          totalVehiclesInSystem: totalVehicles.count || 0,
          lastImportCount: lastJob.successful_items || 0,
          successRate: Math.round(successRate)
        });
      }
    } catch (error) {
      console.error('Failed to load recent jobs:', error);
    }
  };

  const startBulkImport = async () => {
    try {
      setIsImporting(true);
      
      toast({
        title: "Starting Enhanced Bulk Import",
        description: "Initiating secure import of all GP51 vehicles..."
      });

      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { 
          action: 'start',
          chunkSize: 50 // Process 50 vehicles at a time
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Import Started Successfully",
          description: `Processing ${data.totalDevices} vehicles in ${data.totalChunks} chunks`
        });
        
        // Start monitoring the job
        monitorJob(data.jobId);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to start import",
        variant: "destructive"
      });
      setIsImporting(false);
    }
  };

  const monitorJob = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
          body: { action: 'status', jobId }
        });

        if (error) throw error;

        if (data.success) {
          setCurrentJob(data.job);
          
          if (data.job.status === 'completed' || data.job.status === 'completed_with_errors' || data.job.status === 'failed') {
            clearInterval(pollInterval);
            setIsImporting(false);
            loadRecentJobs();
            
            toast({
              title: data.job.status === 'completed' ? "Import Completed" : "Import Finished with Issues",
              description: `Processed ${data.job.successful_items} vehicles successfully`,
              variant: data.job.status === 'completed' ? "default" : "destructive"
            });
          }
        }
      } catch (error) {
        console.error('Failed to monitor job:', error);
        clearInterval(pollInterval);
        setIsImporting(false);
      }
    }, 2000); // Poll every 2 seconds
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'completed_with_errors': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      case 'completed_with_errors': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    loadRecentJobs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enhanced Bulk Import</h2>
          <p className="text-gray-600">Secure, chunked import of all GP51 vehicles</p>
        </div>
        <Button
          onClick={startBulkImport}
          disabled={isImporting}
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Total Vehicles</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {importStats.totalVehiclesInSystem.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">In system</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Last Import</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {importStats.lastImportCount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Vehicles added</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">Success Rate</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {importStats.successRate}%
            </div>
            <div className="text-xs text-gray-500">Last import</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Job Progress */}
      {currentJob && isImporting && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Import in Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{currentJob.processed_items} / {currentJob.total_items}</span>
              </div>
              <Progress 
                value={(currentJob.processed_items / currentJob.total_items) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Chunk Progress</span>
                <span>{currentJob.current_chunk} / {currentJob.total_chunks}</span>
              </div>
              <Progress 
                value={(currentJob.current_chunk / currentJob.total_chunks) * 100} 
                className="h-2"
              />
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">
                  {currentJob.successful_items}
                </div>
                <div className="text-xs text-gray-500">Successful</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">
                  {currentJob.failed_items}
                </div>
                <div className="text-xs text-gray-500">Failed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {currentJob.chunk_size}
                </div>
                <div className="text-xs text-gray-500">Chunk Size</div>
              </div>
            </div>

            {currentJob.error_log && currentJob.error_log.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {currentJob.error_log.length} error(s) encountered during import. 
                  Check the job details after completion.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Import Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentJobs.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No import jobs found. Start your first bulk import above.
              </div>
            ) : (
              recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <div className="font-medium">{job.job_name}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(job.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <div>{job.successful_items} / {job.total_items} successful</div>
                      <div className="text-gray-500">
                        {job.total_chunks} chunks processed
                      </div>
                    </div>
                    
                    <Badge className={getStatusColor(job.status)}>
                      {job.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedBulkImportManager;
