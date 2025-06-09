import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Pause,
  X,
  RotateCcw
} from 'lucide-react';
import { ImportProgress } from '@/types/system-import';
import { supabase } from '@/integrations/supabase/client';

interface ImportProgressMonitorProps {
  importId: string;
  onComplete?: (result: any) => void;
  onCancel?: () => void;
}

const ImportProgressMonitor: React.FC<ImportProgressMonitorProps> = ({
  importId,
  onComplete,
  onCancel
}) => {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [importStatus, setImportStatus] = useState<string>('processing');
  const [error, setError] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [startTime] = useState(Date.now());
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!importId || !isMonitoring) return;

    console.log('Setting up real-time monitoring for import:', importId);

    // Set up real-time subscription
    const channel = supabase
      .channel(`import-monitor-${importId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'gp51_system_imports',
          filter: `id=eq.${importId}`
        },
        (payload) => {
          console.log('Real-time import update:', payload);
          handleImportUpdate(payload.new);
        }
      )
      .subscribe();

    // Initial fetch
    fetchImportStatus();

    // Polling fallback
    const pollInterval = setInterval(fetchImportStatus, 5000);

    return () => {
      console.log('Cleaning up import monitoring');
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [importId, isMonitoring]);

  const fetchImportStatus = async () => {
    try {
      const { data: importJob, error } = await supabase
        .from('gp51_system_imports')
        .select('*')
        .eq('id', importId)
        .single();

      if (error) {
        console.error('Failed to fetch import status:', error);
        setError(`Failed to fetch import status: ${error.message}`);
        return;
      }

      if (importJob) {
        handleImportUpdate(importJob);
      }
    } catch (error) {
      console.error('Error fetching import status:', error);
      setError(`Error fetching import status: ${error.message}`);
    }
  };

  const handleImportUpdate = (importJob: any) => {
    setImportStatus(importJob.status);
    
    const progressData: ImportProgress = {
      phase: importJob.current_phase || 'Unknown',
      percentage: importJob.progress_percentage || 0,
      message: importJob.phase_details || 'Processing...',
      overallProgress: importJob.progress_percentage || 0,
      phaseProgress: 100,
      currentOperation: importJob.phase_details || 'Processing...'
    };
    
    setProgress(progressData);

    // Calculate estimated time remaining
    if (importJob.progress_percentage > 0 && importJob.status === 'processing') {
      const elapsed = Date.now() - startTime;
      const totalEstimated = (elapsed / importJob.progress_percentage) * 100;
      const remaining = totalEstimated - elapsed;
      
      if (remaining > 0) {
        const minutes = Math.ceil(remaining / (1000 * 60));
        setEstimatedTimeLeft(`~${minutes} minutes remaining`);
      }
    }

    // Handle completion
    if (importJob.status === 'completed') {
      setIsMonitoring(false);
      onComplete?.(importJob);
    } else if (importJob.status === 'failed') {
      setIsMonitoring(false);
      
      // Extract error message
      let errorMessage = 'Import failed';
      if (importJob.error_log && typeof importJob.error_log === 'object' && 'error' in importJob.error_log) {
        errorMessage = (importJob.error_log as any).error || errorMessage;
      }
      
      setError(errorMessage);
    }
  };

  const handleCancel = async () => {
    try {
      console.log('Cancelling import:', importId);
      
      await supabase
        .from('gp51_system_imports')
        .update({
          status: 'cancelled',
          current_phase: 'cancelled',
          phase_details: 'Import cancelled by user'
        })
        .eq('id', importId);
        
      setIsMonitoring(false);
      onCancel?.();
    } catch (error) {
      console.error('Failed to cancel import:', error);
      setError(`Failed to cancel import: ${error.message}`);
    }
  };

  const getStatusIcon = () => {
    switch (importStatus) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = () => {
    const variants = {
      completed: 'default',
      failed: 'destructive',
      cancelled: 'destructive',
      processing: 'secondary'
    };
    
    return (
      <Badge variant={variants[importStatus] || 'outline'}>
        {importStatus.charAt(0).toUpperCase() + importStatus.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Import Progress Monitor
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {importStatus === 'processing' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {progress && importStatus === 'processing' && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{progress.overallProgress}%</span>
              </div>
              <Progress value={progress.overallProgress} className="w-full h-3" />
              {estimatedTimeLeft && (
                <p className="text-xs text-gray-500 text-center">{estimatedTimeLeft}</p>
              )}
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-medium mb-1">Current Phase: {progress.phase}</div>
              <div className="text-xs text-gray-600">{progress.currentOperation}</div>
            </div>
          </>
        )}

        {importStatus === 'completed' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Import completed successfully! Check the results below.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Import ID: {importId}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard.writeText(importId)}
          >
            Copy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportProgressMonitor;
