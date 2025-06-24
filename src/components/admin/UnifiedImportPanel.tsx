
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Users, 
  Car, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Play,
  Eye
} from 'lucide-react';
import { useUnifiedImport } from '@/hooks/useUnifiedImport';

const UnifiedImportPanel: React.FC = () => {
  const {
    preview,
    currentJob,
    isLoadingPreview,
    isImporting,
    fetchPreview,
    startImport,
    validateConnection,
    clearPreview
  } = useUnifiedImport();

  const [selectedOptions, setSelectedOptions] = useState({
    importUsers: true,
    importDevices: true,
    conflictResolution: 'skip' as const,
    usernames: [] as string[],
    batchSize: 50
  });

  const handleStartImport = async () => {
    if (!preview?.success) {
      return;
    }

    await startImport(selectedOptions);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Unified GP51 Import System</h2>
          <p className="text-gray-600">Professional data import with comprehensive validation and monitoring</p>
        </div>
        
        {preview?.connectionStatus.connected && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            GP51 Connected
          </Badge>
        )}
      </div>

      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview Data
          </TabsTrigger>
          <TabsTrigger value="import" disabled={!preview?.success} className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Import Configuration
          </TabsTrigger>
          <TabsTrigger value="monitor" disabled={!currentJob} className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Monitor Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Preview & Validation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={fetchPreview}
                  disabled={isLoadingPreview}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingPreview ? 'animate-spin' : ''}`} />
                  {isLoadingPreview ? 'Generating Preview...' : 'Generate Preview'}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={validateConnection}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Test Connection
                </Button>

                {preview && (
                  <Button 
                    variant="outline"
                    onClick={clearPreview}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Clear Preview
                  </Button>
                )}
              </div>

              {preview && (
                <div className="space-y-4">
                  {!preview.success ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {preview.connectionStatus.error || 'Failed to generate preview'}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">Users Available</span>
                          </div>
                          <div className="text-2xl font-bold text-blue-900 mt-1">
                            {preview.data.summary.users}
                          </div>
                          <div className="text-xs text-gray-500">Ready for import</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">Vehicles Available</span>
                          </div>
                          <div className="text-2xl font-bold text-green-900 mt-1">
                            {preview.data.summary.vehicles}
                          </div>
                          <div className="text-xs text-gray-500">Ready for import</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium">Potential Conflicts</span>
                          </div>
                          <div className="text-2xl font-bold text-amber-900 mt-1">
                            {preview.data.conflicts.potentialDuplicates}
                          </div>
                          <div className="text-xs text-gray-500">Require review</div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {preview.data.warnings.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          {preview.data.warnings.map((warning, index) => (
                            <div key={index}>• {warning}</div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="text-sm text-gray-500">
                    Estimated Duration: {preview.data.estimatedDuration} | 
                    Preview Generated: {new Date(preview.timestamp).toLocaleString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedOptions.importUsers}
                    onChange={(e) => setSelectedOptions(prev => ({
                      ...prev,
                      importUsers: e.target.checked
                    }))}
                  />
                  <span>Import Users ({preview?.data.summary.users || 0})</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedOptions.importDevices}
                    onChange={(e) => setSelectedOptions(prev => ({
                      ...prev,
                      importDevices: e.target.checked
                    }))}
                  />
                  <span>Import Vehicles ({preview?.data.summary.vehicles || 0})</span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Conflict Resolution</label>
                <select
                  value={selectedOptions.conflictResolution}
                  onChange={(e) => setSelectedOptions(prev => ({
                    ...prev,
                    conflictResolution: e.target.value as 'skip' | 'overwrite' | 'merge'
                  }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="skip">Skip Conflicting Records</option>
                  <option value="overwrite">Overwrite Existing Records</option>
                  <option value="merge">Merge Where Possible</option>
                </select>
              </div>

              <Button 
                onClick={handleStartImport}
                disabled={isImporting || !preview?.success}
                className="w-full flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                {isImporting ? 'Starting Import...' : 'Start Import'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitor" className="space-y-4">
          {currentJob && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Import Progress
                  <Badge variant={
                    currentJob.status === 'completed' ? 'default' :
                    currentJob.status === 'failed' ? 'destructive' : 'secondary'
                  }>
                    {currentJob.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Phase: {currentJob.currentPhase}</span>
                    <span>{currentJob.progress}%</span>
                  </div>
                  <Progress value={currentJob.progress} />
                </div>

                {currentJob.results && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Users Imported</div>
                      <div className="text-2xl font-bold text-green-600">
                        {currentJob.results.statistics.usersImported}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Vehicles Imported</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {currentJob.results.statistics.devicesImported}
                      </div>
                    </div>
                  </div>
                )}

                {currentJob.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        {currentJob.errors.map((error, index) => (
                          <div key={index}>• {error}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-sm text-gray-500">
                  Started: {new Date(currentJob.startedAt).toLocaleString()}
                  {currentJob.completedAt && (
                    <> | Completed: {new Date(currentJob.completedAt).toLocaleString()}</>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedImportPanel;
