
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Car, 
  Database,
  AlertTriangle,
  RefreshCw,
  Play,
  Eye
} from 'lucide-react';
import { useUnifiedImport } from '@/hooks/useUnifiedImport';
import type { GP51ImportOptions } from '@/types/system-import';

interface UnifiedImportPanelProps {
  onImportComplete?: () => void;
}

const UnifiedImportPanel: React.FC<UnifiedImportPanelProps> = ({ onImportComplete }) => {
  const {
    preview,
    isLoadingPreview,
    isImporting,
    importJob,
    currentJob,
    fetchPreview,
    startImport,
    validateConnection,
    clearPreview,
    clearJob
  } = useUnifiedImport();

  const handleStartImport = async () => {
    if (!preview?.success) return;

    const options: GP51ImportOptions = {
      importUsers: true,
      importVehicles: true,
      conflictResolution: 'skip',
      createBackup: true,
      validateData: true
    };

    try {
      const result = await startImport(options);
      if (result.status === 'completed' && onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const handleValidateConnection = async () => {
    try {
      await validateConnection();
    } catch (error) {
      console.error('Connection validation failed:', error);
    }
  };

  const getStatusIcon = (connected: boolean, error?: string) => {
    if (error) return <XCircle className="h-4 w-4 text-red-500" />;
    if (connected) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = (connected: boolean, error?: string) => {
    if (error) return 'Connection Error';
    if (connected) return 'Connected';
    return 'Not Connected';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Unified GP51 Import</h2>
          <p className="text-muted-foreground">
            Import users and vehicles from GP51 with enhanced conflict detection
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleValidateConnection}
            disabled={isLoadingPreview || isImporting}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Validate Connection
          </Button>
          <Button 
            onClick={fetchPreview}
            disabled={isLoadingPreview || isImporting}
          >
            <Eye className="h-4 w-4 mr-2" />
            {isLoadingPreview ? 'Loading...' : 'Fetch Available Data'}
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {preview?.connectionStatus ? 
              getStatusIcon(preview.connectionStatus.connected, preview.connectionStatus.error) :
              <Clock className="h-4 w-4 text-gray-400" />
            }
            GP51 Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {preview?.connectionStatus ? 
                  getStatusText(preview.connectionStatus.connected, preview.connectionStatus.error) :
                  'Unknown'
                }
              </p>
              {preview?.connectionStatus?.username && (
                <p className="text-sm text-muted-foreground">
                  Connected as: {preview.connectionStatus.username}
                </p>
              )}
              {preview?.connectionStatus?.error && (
                <Alert className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{preview.connectionStatus.error}</AlertDescription>
                </Alert>
              )}
            </div>
            <Badge variant={preview?.connectionStatus?.connected ? 'default' : 'destructive'}>
              {preview?.connectionStatus?.connected ? 'Ready' : 'Not Ready'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Preview Data */}
      {preview && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users Available</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{preview.data.summary.users}</div>
              <p className="text-xs text-muted-foreground">
                Ready for import
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vehicles Available</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{preview.data.summary.vehicles}</div>
              <p className="text-xs text-muted-foreground">
                Devices ready for import
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Conflicts</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{preview.data.conflicts.potentialDuplicates}</div>
              <p className="text-xs text-muted-foreground">
                Duplicates to resolve
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Warnings */}
      {preview?.data.warnings && preview.data.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Warnings detected:</p>
              <ul className="list-disc list-inside space-y-1">
                {preview.data.warnings.map((warning, index) => (
                  <li key={index} className="text-sm">{warning}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Import Controls */}
      {preview?.success && (
        <Card>
          <CardHeader>
            <CardTitle>Start Import Process</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Ready to import data</p>
                <p className="text-sm text-muted-foreground">
                  Estimated time: {preview.data.estimatedDuration}
                </p>
              </div>
              <Button 
                onClick={handleStartImport}
                disabled={isImporting || !preview.connectionStatus.connected}
                size="lg"
              >
                <Play className="h-4 w-4 mr-2" />
                {isImporting ? 'Importing...' : 'Start Import'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Progress */}
      {(importJob || currentJob) && (
        <Card>
          <CardHeader>
            <CardTitle>Import Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{(importJob || currentJob)?.progress || 0}%</span>
              </div>
              <Progress value={(importJob || currentJob)?.progress || 0} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Phase</p>
                <p className="text-sm text-muted-foreground">
                  {(importJob || currentJob)?.currentPhase || 'Initializing...'}
                </p>
              </div>
              <Badge variant={
                (importJob || currentJob)?.status === 'completed' ? 'default' :
                (importJob || currentJob)?.status === 'failed' ? 'destructive' :
                'secondary'
              }>
                {(importJob || currentJob)?.status || 'running'}
              </Badge>
            </div>

            {(importJob || currentJob)?.errors && (importJob || currentJob)!.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Import errors:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {(importJob || currentJob)!.errors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {(importJob || currentJob)?.results && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Import Statistics</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Users imported: {(importJob || currentJob)!.results!.statistics.usersImported}</p>
                    <p>Devices imported: {(importJob || currentJob)!.results!.statistics.devicesImported}</p>
                    <p>Errors encountered: {(importJob || currentJob)!.results!.statistics.errorsEncountered}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Conflict Resolution</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Duplicate users: {(importJob || currentJob)!.results!.conflicts.duplicateUsers}</p>
                    <p>Duplicate devices: {(importJob || currentJob)!.results!.conflicts.duplicateDevices}</p>
                    <p>Conflicts resolved: {(importJob || currentJob)!.results!.conflicts.resolvedConflicts}</p>
                  </div>
                </div>
              </div>
            )}

            {(importJob || currentJob)?.status === 'completed' && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={clearJob}
                >
                  Clear Results
                </Button>
                <Button 
                  variant="outline" 
                  onClick={clearPreview}
                >
                  Reset Preview
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UnifiedImportPanel;
