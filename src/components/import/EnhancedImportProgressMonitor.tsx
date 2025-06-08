
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
  X,
  Shield,
  Database,
  Users,
  Car
} from 'lucide-react';
import { SystemImportProgress } from '@/services/fullSystemImportService';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedImportProgressMonitorProps {
  importId: string;
  onComplete?: (result: any) => void;
  onCancel?: () => void;
}

interface PhaseStatus {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  details: string;
  startTime?: Date;
  endTime?: Date;
}

const EnhancedImportProgressMonitor: React.FC<EnhancedImportProgressMonitorProps> = ({
  importId,
  onComplete,
  onCancel
}) => {
  const [progress, setProgress] = useState<SystemImportProgress | null>(null);
  const [phases, setPhases] = useState<PhaseStatus[]>([]);
  const [importStatus, setImportStatus] = useState<string>('processing');
  const [error, setError] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [startTime] = useState(Date.now());
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState<string>('');
  const [stats, setStats] = useState({
    usersProcessed: 0,
    vehiclesProcessed: 0,
    integrityScore: 0
  });

  useEffect(() => {
    if (!importId || !isMonitoring) return;

    console.log('Setting up enhanced real-time monitoring for import:', importId);

    // Initialize phases
    initializePhases();

    // Set up real-time subscription for main import
    const importChannel = supabase
      .channel(`enhanced-import-${importId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'gp51_system_imports',
          filter: `id=eq.${importId}`
        },
        (payload) => {
          console.log('Enhanced real-time import update:', payload);
          handleImportUpdate(payload.new);
        }
      )
      .subscribe();

    // Set up real-time subscription for phases
    const phaseChannel = supabase
      .channel(`enhanced-phases-${importId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gp51_import_progress_phases',
          filter: `system_import_id=eq.${importId}`
        },
        (payload) => {
          console.log('Enhanced real-time phase update:', payload);
          handlePhaseUpdate(payload.new);
        }
      )
      .subscribe();

    // Initial fetch
    fetchImportStatus();

    // Polling fallback every 3 seconds
    const pollInterval = setInterval(fetchImportStatus, 3000);

    return () => {
      console.log('Cleaning up enhanced import monitoring');
      supabase.removeChannel(importChannel);
      supabase.removeChannel(phaseChannel);
      clearInterval(pollInterval);
    };
  }, [importId, isMonitoring]);

  const initializePhases = () => {
    const initialPhases: PhaseStatus[] = [
      { name: 'validation', status: 'pending', progress: 0, details: 'Validating GP51 configuration' },
      { name: 'backup', status: 'pending', progress: 0, details: 'Creating system backup' },
      { name: 'cleanup', status: 'pending', progress: 0, details: 'Cleaning existing data' },
      { name: 'user_import', status: 'pending', progress: 0, details: 'Importing users' },
      { name: 'vehicle_import', status: 'pending', progress: 0, details: 'Importing vehicles' },
      { name: 'verification', status: 'pending', progress: 0, details: 'Verifying data integrity' },
      { name: 'completion', status: 'pending', progress: 0, details: 'Finalizing import' }
    ];
    setPhases(initialPhases);
  };

  const fetchImportStatus = async () => {
    try {
      const { data: importJob, error } = await supabase
        .from('gp51_system_imports')
        .select('*')
        .eq('id', importId)
        .single();

      if (error) {
        console.error('Failed to fetch enhanced import status:', error);
        setError(`Failed to fetch import status: ${error.message}`);
        return;
      }

      if (importJob) {
        handleImportUpdate(importJob);
      }
    } catch (error) {
      console.error('Error fetching enhanced import status:', error);
      setError(`Error fetching import status: ${error.message}`);
    }
  };

  const handleImportUpdate = (importJob: any) => {
    setImportStatus(importJob.status);
    
    const progressData: SystemImportProgress = {
      phase: importJob.current_phase || 'Unknown',
      phaseProgress: 100,
      overallProgress: importJob.progress_percentage || 0,
      currentOperation: importJob.phase_details || 'Processing...'
    };
    
    setProgress(progressData);

    // Update stats
    setStats({
      usersProcessed: importJob.successful_users || 0,
      vehiclesProcessed: importJob.successful_devices || 0,
      integrityScore: Math.round(importJob.data_integrity_score || 0)
    });

    // Calculate estimated time remaining
    if (importJob.progress_percentage > 5 && importJob.status === 'processing') {
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
      
      let errorMessage = 'Import failed';
      if (importJob.error_log && typeof importJob.error_log === 'object' && 'error' in importJob.error_log) {
        errorMessage = (importJob.error_log as any).error || errorMessage;
      }
      
      setError(errorMessage);
    }
  };

  const handlePhaseUpdate = (phaseData: any) => {
    if (!phaseData.phase_name) return;

    setPhases(prevPhases => {
      return prevPhases.map(phase => {
        if (phase.name === phaseData.phase_name) {
          return {
            ...phase,
            status: phaseData.phase_status || phase.status,
            progress: phaseData.phase_progress || phase.progress,
            details: phaseData.phase_details?.details || phase.details,
            startTime: phaseData.started_at ? new Date(phaseData.started_at) : phase.startTime,
            endTime: phaseData.completed_at ? new Date(phaseData.completed_at) : phase.endTime
          };
        }
        return phase;
      });
    });
  };

  const handleCancel = async () => {
    try {
      console.log('Cancelling enhanced import:', importId);
      
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
      console.error('Failed to cancel enhanced import:', error);
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

  const getPhaseIcon = (phaseName: string) => {
    const icons = {
      validation: <Shield className="w-4 h-4" />,
      backup: <Database className="w-4 h-4" />,
      cleanup: <RefreshCw className="w-4 h-4" />,
      user_import: <Users className="w-4 h-4" />,
      vehicle_import: <Car className="w-4 h-4" />,
      verification: <CheckCircle className="w-4 h-4" />,
      completion: <CheckCircle className="w-4 h-4" />
    };
    return icons[phaseName] || <Clock className="w-4 h-4" />;
  };

  const getPhaseStatusColor = (status: string) => {
    const colors = {
      pending: 'text-gray-400',
      running: 'text-blue-600',
      completed: 'text-green-600',
      failed: 'text-red-600'
    };
    return colors[status] || 'text-gray-400';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Enhanced Import Progress Monitor
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
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {progress && importStatus === 'processing' && (
          <>
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Overall Progress</span>
                <span>{progress.overallProgress}%</span>
              </div>
              <Progress value={progress.overallProgress} className="w-full h-3" />
              {estimatedTimeLeft && (
                <p className="text-xs text-gray-500 text-center">{estimatedTimeLeft}</p>
              )}
            </div>

            {/* Current Operation */}
            <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
              <div className="text-sm font-medium text-blue-900">Current Phase: {progress.phase}</div>
              <div className="text-xs text-blue-700 mt-1">{progress.currentOperation}</div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.usersProcessed}</div>
                <div className="text-xs text-gray-600">Users Imported</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.vehiclesProcessed}</div>
                <div className="text-xs text-gray-600">Vehicles Imported</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.integrityScore}%</div>
                <div className="text-xs text-gray-600">Data Integrity</div>
              </div>
            </div>

            {/* Phase Details */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Import Phases</h4>
              <div className="space-y-1">
                {phases.map((phase) => (
                  <div key={phase.name} className={`flex items-center gap-3 p-2 rounded-lg ${
                    phase.status === 'running' ? 'bg-blue-50' : phase.status === 'completed' ? 'bg-green-50' : 'bg-gray-50'
                  }`}>
                    <div className={getPhaseStatusColor(phase.status)}>
                      {getPhaseIcon(phase.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium capitalize">
                        {phase.name.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-gray-600 truncate">{phase.details}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {phase.status === 'completed' ? '✓' : phase.status === 'running' ? '...' : '○'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {importStatus === 'completed' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Enhanced import completed successfully! Data integrity verified and all operations committed.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-500 pt-4 border-t">
          <span>Import ID: {importId}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard.writeText(importId)}
            className="h-6 px-2"
          >
            Copy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedImportProgressMonitor;
