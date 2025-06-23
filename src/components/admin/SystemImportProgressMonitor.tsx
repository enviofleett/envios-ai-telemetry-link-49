
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Database,
  Users,
  Car,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { fullSystemImportService } from '@/services/fullSystemImportService';
import { useToast } from '@/hooks/use-toast';

interface SystemImportJob {
  id: string;
  job_name: string;
  status: string;
  import_type: string;
  import_scope: string;
  progress_percentage: number;
  created_at: string;
  completed_at?: string;
  current_phase: string;
  phase_details?: string;
  successful_users: number;
  successful_devices: number;
  failed_users: number;
  failed_devices: number;
  can_rollback: boolean;
}

interface SystemImportProgressMonitorProps {
  refreshTrigger?: number;
}

const SystemImportProgressMonitor: React.FC<SystemImportProgressMonitorProps> = ({ refreshTrigger }) => {
  const [importJobs, setImportJobs] = useState<SystemImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadImportJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('gp51_system_imports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setImportJobs(data || []);
    } catch (error) {
      console.error('Failed to load import jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load import jobs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollback = async (jobId: string) => {
    try {
      await fullSystemImportService.rollbackImport(jobId);
      toast({
        title: "Rollback Initiated",
        description: "System rollback has been started",
      });
      loadImportJobs();
    } catch (error) {
      console.error('Rollback failed:', error);
      toast({
        title: "Rollback Failed",
        description: error.message || "Failed to rollback import",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadImportJobs();

    // Set up real-time subscription
    const channel = supabase
      .channel('system-import-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gp51_system_imports'
        },
        () => {
          loadImportJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshTrigger]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      failed: 'destructive',
      processing: 'secondary',
      pending: 'outline'
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getImportTypeIcon = (scope: string) => {
    switch (scope) {
      case 'complete_system':
        return <Database className="w-4 h-4" />;
      case 'users_only':
        return <Users className="w-4 h-4" />;
      case 'vehicles_only':
        return <Car className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading import jobs...
        </CardContent>
      </Card>
    );
  }

  if (importJobs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No system import jobs found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">System Import Jobs</h3>
        <Button variant="outline" size="sm" onClick={loadImportJobs}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {importJobs.map((job) => (
        <Card key={job.id} className="transition-all duration-200 hover:shadow-md">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getImportTypeIcon(job.import_scope)}
                <div>
                  <CardTitle className="text-base">{job.job_name}</CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(job.status)}
                    {getStatusBadge(job.status)}
                    <span className="text-sm text-gray-500">
                      {new Date(job.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{job.progress_percentage}%</div>
                {job.status === 'processing' && (
                  <div className="text-xs text-gray-500">{job.current_phase}</div>
                )}
              </div>
            </div>
            
            {job.status === 'processing' && (
              <Progress value={job.progress_percentage} className="w-full mt-3" />
            )}
          </CardHeader>

          {expandedJobId === job.id && (
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-lg font-bold text-blue-600">{job.successful_users}</div>
                    <div className="text-xs text-blue-700">Users Imported</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-600">{job.successful_devices}</div>
                    <div className="text-xs text-green-700">Vehicles Imported</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded">
                    <div className="text-lg font-bold text-red-600">{job.failed_users + job.failed_devices}</div>
                    <div className="text-xs text-red-700">Failed Imports</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-bold text-gray-600">
                      {job.completed_at ? 'Completed' : 'Running'}
                    </div>
                    <div className="text-xs text-gray-700">Status</div>
                  </div>
                </div>

                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Import Type:</span>
                    <Badge variant="outline">{job.import_scope.replace('_', ' ').toUpperCase()}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Phase:</span>
                    <span className="font-medium">{job.current_phase || 'N/A'}</span>
                  </div>
                  {job.phase_details && (
                    <div className="flex justify-between">
                      <span>Phase Details:</span>
                      <span className="font-medium">{job.phase_details}</span>
                    </div>
                  )}
                  {job.completed_at && (
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span>{new Date(job.completed_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {job.can_rollback && job.status === 'completed' && (
                  <div className="flex justify-end pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRollback(job.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Rollback Import
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default SystemImportProgressMonitor;
