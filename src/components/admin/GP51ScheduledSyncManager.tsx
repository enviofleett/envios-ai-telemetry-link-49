
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Play, RefreshCw, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncJob {
  id: string;
  job_name: string;
  status: string;
  started_at: string;
  completed_at?: string;
  total_items: number;
  successful_items: number;
  failed_items: number;
}

const GP51ScheduledSyncManager: React.FC = () => {
  const [isScheduleEnabled, setIsScheduleEnabled] = useState(false);
  const [syncFrequency, setSyncFrequency] = useState('daily');
  const [syncTime, setSyncTime] = useState('02:00');
  const [recentJobs, setRecentJobs] = useState<SyncJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentJobs();
  }, []);

  const fetchRecentJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('bulk_import_jobs')
        .select('*')
        .eq('import_type', 'scheduled_gp51_sync')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentJobs(data || []);
    } catch (error) {
      console.error('Failed to fetch recent jobs:', error);
    }
  };

  const triggerManualSync = async () => {
    setIsLoading(true);
    try {
      // First check if GP51 is authenticated
      const { data: authCheck } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      if (!authCheck?.success) {
        throw new Error('GP51 not authenticated. Please authenticate first.');
      }

      const { data, error } = await supabase.functions.invoke('gp51-scheduled-sync');
      
      if (error) throw error;

      if (data.success) {
        toast({
          title: "Manual Sync Started",
          description: data.skipped ? "Sync already in progress" : "GP51 data synchronization initiated"
        });
        fetchRecentJobs();
      } else {
        throw new Error(data.error || 'Manual sync failed');
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to start manual sync",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Synchronization
          </CardTitle>
          <CardDescription>
            Configure automated GP51 data synchronization with intelligent rate limiting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Enable Scheduled Sync</h4>
              <p className="text-sm text-muted-foreground">
                Automatically sync GP51 data at scheduled intervals
              </p>
            </div>
            <Switch
              checked={isScheduleEnabled}
              onCheckedChange={setIsScheduleEnabled}
            />
          </div>

          {isScheduleEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Frequency</label>
                <Select value={syncFrequency} onValueChange={setSyncFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Every Hour</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Time</label>
                <Select value={syncTime} onValueChange={setSyncTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="02:00">2:00 AM</SelectItem>
                    <SelectItem value="03:00">3:00 AM</SelectItem>
                    <SelectItem value="06:00">6:00 AM</SelectItem>
                    <SelectItem value="22:00">10:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="pt-4 border-t flex gap-2">
            <Button
              onClick={triggerManualSync}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Run Manual Sync
            </Button>
            
            <Button variant="outline" onClick={fetchRecentJobs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Jobs
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Jobs</CardTitle>
          <CardDescription>
            History of automated and manual GP51 synchronization jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No sync jobs found. Run a manual sync to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <p className="font-medium">{job.job_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Started: {new Date(job.started_at).toLocaleString()}
                        {job.completed_at && (
                          <span> • Completed: {new Date(job.completed_at).toLocaleString()}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                    {job.status === 'completed' && job.total_items > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {job.successful_items}/{job.total_items} items
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sync Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Rate Limiting:</strong> Automatically prevents IP blocking with intelligent delays</p>
            <p><strong>Error Recovery:</strong> Automatic retry with exponential backoff</p>
            <p><strong>Data Validation:</strong> Comprehensive validation before import</p>
            <p><strong>Conflict Resolution:</strong> Smart handling of duplicate data</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51ScheduledSyncManager;
