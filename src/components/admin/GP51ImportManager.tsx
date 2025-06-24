
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useUnifiedImport } from '@/hooks/useUnifiedImport';
import { CheckCircle, XCircle, AlertTriangle, Loader2, Database, Users, Car, Clock } from 'lucide-react';
import type { GP51ImportOptions } from '@/types/system-import';

const GP51ImportManager: React.FC = () => {
  const {
    preview,
    isLoadingPreview,
    isImporting,
    importJob,
    fetchPreview,
    startImport,
    validateConnection,
    clearPreview,
    clearJob
  } = useUnifiedImport();

  const handleStartImport = async () => {
    if (!preview?.success) {
      return;
    }

    const importOptions: GP51ImportOptions = {
      importUsers: true,
      importDevices: true,
      conflictResolution: 'skip',
      batchSize: 50
    };

    await startImport(importOptions);
  };

  const handleValidateConnection = async () => {
    await validateConnection();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'running':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">GP51 Import Manager</h2>
          <p className="text-gray-600">Import and synchronize data from GP51 platform</p>
        </div>
        <Button onClick={handleValidateConnection} variant="outline">
          <Database className="h-4 w-4 mr-2" />
          Test Connection
        </Button>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {preview && preview.success ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-800">Connected</h4>
                <p className="text-sm text-green-700">
                  GP51 connection is healthy and ready for import
                </p>
              </div>
            </div>
          ) : preview && !preview.success ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <h4 className="font-medium text-red-800">Connection Failed</h4>
                <p className="text-sm text-red-700">
                  {preview.connectionStatus.error || 'Unable to connect to GP51'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <Database className="h-5 w-5 text-gray-600" />
              <div>
                <h4 className="font-medium text-gray-800">Not Connected</h4>
                <p className="text-sm text-gray-700">
                  Click "Generate Preview" to test the connection
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Import Preview
          </CardTitle>
          <CardDescription>
            Preview the data that will be imported from GP51
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {preview && preview.success && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{preview.data.summary.users}</div>
                <div className="text-sm text-gray-600">Users</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{preview.data.summary.vehicles}</div>
                <div className="text-sm text-gray-600">Vehicles</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{preview.data.summary.groups}</div>
                <div className="text-sm text-gray-600">Groups</div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={fetchPreview} 
              disabled={isLoadingPreview}
              variant="outline"
            >
              {isLoadingPreview ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Preview...
                </>
              ) : (
                'Generate Preview'
              )}
            </Button>
            
            {preview && (
              <Button 
                onClick={clearPreview}
                variant="ghost"
                size="sm"
              >
                Clear Preview
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Import Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Import Control
          </CardTitle>
          <CardDescription>
            Start the import process to synchronize GP51 data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={handleStartImport} 
              disabled={isImporting || !preview?.success}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                'Start Import'
              )}
            </Button>
            
            {importJob && (
              <Button 
                onClick={clearJob}
                variant="ghost"
                size="sm"
              >
                Clear Job
              </Button>
            )}
          </div>

          {!preview?.success && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please generate a successful preview before starting the import process.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Import Progress */}
      {importJob && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(importJob.status)}
              Import Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <Badge className={getStatusColor(importJob.status)}>
                {importJob.status}
              </Badge>
            </div>
            
            <Progress value={importJob.progress} className="w-full" />
            
            <div className="text-sm text-gray-600">
              <p>Current Phase: {importJob.currentPhase}</p>
              <p>Started: {new Date(importJob.startedAt).toLocaleString()}</p>
              {importJob.completedAt && (
                <p>Completed: {new Date(importJob.completedAt).toLocaleString()}</p>
              )}
            </div>

            {/* Results Summary */}
            {importJob.results && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-semibold text-blue-600">
                    {importJob.results.statistics.usersImported} / {importJob.results.statistics.usersImported}
                  </div>
                  <div className="text-sm text-gray-600">Users Imported</div>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-semibold text-green-600">
                    {importJob.results.statistics.devicesImported} / {importJob.results.statistics.devicesImported}
                  </div>
                  <div className="text-sm text-gray-600">Devices Imported</div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {importJob.errors && importJob.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-red-600 mb-2">Errors Encountered:</h4>
                <div className="space-y-1">
                  {importJob.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Import Jobs</CardTitle>
          <CardDescription>
            View the status and results of recent import operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {importJob ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(importJob.status)}
                  <div>
                    <div className="font-medium">Import Job {importJob.id.slice(0, 8)}</div>
                    <div className="text-sm text-gray-600">{importJob.currentPhase}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{importJob.progress}%</div>
                  <div className="text-xs text-gray-500">
                    {importJob.completedAt ? 'Completed' : 'In Progress'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No import jobs found. Start an import to see the history.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51ImportManager;
