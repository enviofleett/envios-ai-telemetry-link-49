import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SystemImportJob } from '@/types/system-import';

interface SystemImportProgressMonitorProps {
  className?: string;
}

const SystemImportProgressMonitor: React.FC<SystemImportProgressMonitorProps> = ({ className }) => {
  const [imports, setImports] = useState<SystemImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadImports = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('gp51_system_imports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Map database fields to SystemImportJob interface
      const mappedImports = (data || []).map(item => ({
        id: item.id,
        status: item.status as 'pending' | 'running' | 'completed' | 'failed',
        progress: item.progress_percentage || 0,
        currentPhase: item.current_phase || 'Unknown',
        startedAt: item.created_at,
        completedAt: item.completed_at || undefined,
        errors: [],
        // Keep original database fields for display
        import_type: item.import_type,
        current_phase: item.current_phase,
        progress_percentage: item.progress_percentage,
        successful_users: item.successful_users,
        total_users: item.total_users,
        successful_devices: item.successful_devices,
        total_devices: item.total_devices,
        created_at: item.created_at
      })) as SystemImportJob[];
      
      setImports(mappedImports);
    } catch (error) {
      console.error('Failed to load system imports:', error);
      toast({
        title: "Error",
        description: "Failed to load system imports",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadImports();

    // Set up real-time subscription
    const channel = supabase
      .channel('system-imports-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gp51_system_imports'
        },
        () => {
          loadImports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>System Import Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading imports...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>System Import Progress</CardTitle>
        <Button variant="outline" size="sm" onClick={loadImports}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {imports.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No system imports found
          </div>
        ) : (
          <div className="space-y-4">
            {imports.map((importJob) => (
              <div key={importJob.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(importJob.status)}
                    <span className="font-medium">{importJob.import_type || 'System Import'}</span>
                  </div>
                  <Badge className={getStatusColor(importJob.status)}>
                    {importJob.status}
                  </Badge>
                </div>
                
                {importJob.current_phase && (
                  <div className="mb-2">
                    <span className="text-sm text-gray-600">Phase: </span>
                    <span className="text-sm font-medium">{importJob.current_phase}</span>
                  </div>
                )}
                
                <Progress 
                  value={importJob.progress_percentage || 0} 
                  className="mb-2" 
                />
                
                <div className="text-sm text-gray-600">
                  Progress: {importJob.progress_percentage || 0}%
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div>
                    <span className="text-gray-600">Users: </span>
                    <span>{importJob.successful_users || 0}/{importJob.total_users || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Devices: </span>
                    <span>{importJob.successful_devices || 0}/{importJob.total_devices || 0}</span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mt-2">
                  Started: {new Date(importJob.created_at || importJob.startedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemImportProgressMonitor;
