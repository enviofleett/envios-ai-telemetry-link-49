
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Users, 
  Car, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Settings,
  Activity
} from 'lucide-react';
import { useUnifiedImport } from '@/hooks/useUnifiedImport';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const UnifiedImportPanel: React.FC = () => {
  const {
    preview,
    currentJob,
    isLoadingPreview,
    isImporting,
    fetchPreview,
    startImport,
    validateConnection,
    clearPreview,
    clearJob
  } = useUnifiedImport();

  const [importOptions, setImportOptions] = useState<{
    importUsers: boolean;
    importDevices: boolean;
    conflictResolution: 'skip' | 'overwrite' | 'merge';
    usernames: string[];
    batchSize: number;
  }>({
    importUsers: true,
    importDevices: true,
    conflictResolution: 'skip',
    usernames: [],
    batchSize: 50
  });

  const [activeTab, setActiveTab] = useState('preview');

  useEffect(() => {
    // Auto-fetch preview on component mount
    fetchPreview();
  }, [fetchPreview]);

  const handleStartImport = async () => {
    try {
      await startImport(importOptions);
      setActiveTab('monitoring');
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const getStatusColor = (connected: boolean) => {
    return connected ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (connected: boolean) => {
    return connected ? CheckCircle : AlertTriangle;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GP51 Data Import System</h1>
          <p className="text-muted-foreground">Professional bulk import and synchronization</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={validateConnection}>
            <Activity className="w-4 h-4 mr-2" />
            Test Connection
          </Button>
          <Button variant="outline" onClick={clearPreview}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      {preview && (
        <Alert className={preview.connectionStatus.connected ? 'border-green-200' : 'border-red-200'}>
          <div className="flex items-center gap-2">
            {React.createElement(getStatusIcon(preview.connectionStatus.connected), { 
              className: `w-4 h-4 ${getStatusColor(preview.connectionStatus.connected)}` 
            })}
            <span className="font-medium">
              GP51 Connection: {preview.connectionStatus.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {preview.connectionStatus.username && (
            <p className="text-sm mt-1">Authenticated as: {preview.connectionStatus.username}</p>
          )}
          {preview.connectionStatus.error && (
            <AlertDescription className="mt-2">
              {preview.connectionStatus.error}
            </AlertDescription>
          )}
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview">Data Preview</TabsTrigger>
          <TabsTrigger value="configuration">Import Configuration</TabsTrigger>
          <TabsTrigger value="monitoring">Import Monitoring</TabsTrigger>
        </TabsList>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                GP51 Data Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPreview ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading GP51 data preview...</span>
                </div>
              ) : preview?.success ? (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Users Available</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mt-1">
                          {preview.data.summary.users.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">Vehicles Available</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mt-1">
                          {preview.data.summary.vehicles.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium">Potential Conflicts</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mt-1">
                          {preview.data.conflicts.potentialDuplicates}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Estimated Duration */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Import Estimation</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Estimated import time: {preview.data.estimatedDuration}
                    </p>
                  </div>

                  {/* Warnings */}
                  {preview.data.warnings.length > 0 && (
                    <Alert>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>
                        <div className="font-medium mb-2">Please review these warnings:</div>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {preview.data.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={() => setActiveTab('configuration')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Configure Import
                    </Button>
                    <Button variant="outline" onClick={fetchPreview}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Preview
                    </Button>
                  </div>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Failed to load GP51 data preview. Please check your connection settings.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Import Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="import-users"
                    checked={importOptions.importUsers}
                    onCheckedChange={(checked) =>
                      setImportOptions(prev => ({ ...prev, importUsers: checked }))
                    }
                  />
                  <Label htmlFor="import-users">Import Users</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="import-devices"
                    checked={importOptions.importDevices}
                    onCheckedChange={(checked) =>
                      setImportOptions(prev => ({ ...prev, importDevices: checked }))
                    }
                  />
                  <Label htmlFor="import-devices">Import Vehicles/Devices</Label>
                </div>
              </div>

              {/* Conflict Resolution */}
              <div className="space-y-2">
                <Label htmlFor="conflict-resolution">Conflict Resolution Strategy</Label>
                <Select
                  value={importOptions.conflictResolution}
                  onValueChange={(value: 'skip' | 'overwrite' | 'merge') =>
                    setImportOptions(prev => ({ ...prev, conflictResolution: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select conflict resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">Skip - Leave existing data unchanged</SelectItem>
                    <SelectItem value="overwrite">Overwrite - Replace existing data</SelectItem>
                    <SelectItem value="merge">Merge - Combine data intelligently</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Batch Size */}
              <div className="space-y-2">
                <Label htmlFor="batch-size">Batch Size (records per batch)</Label>
                <Select
                  value={importOptions.batchSize.toString()}
                  onValueChange={(value) =>
                    setImportOptions(prev => ({ ...prev, batchSize: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 records</SelectItem>
                    <SelectItem value="50">50 records</SelectItem>
                    <SelectItem value="100">100 records</SelectItem>
                    <SelectItem value="200">200 records</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleStartImport}
                  disabled={isImporting || !preview?.success}
                >
                  <Database className="w-4 h-4 mr-2" />
                  {isImporting ? 'Starting Import...' : 'Start Import'}
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('preview')}>
                  Back to Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              {currentJob ? (
                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={
                      currentJob.status === 'completed' ? 'default' :
                      currentJob.status === 'failed' ? 'destructive' :
                      'secondary'
                    }>
                      {currentJob.status.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{currentJob.progress}%</span>
                    </div>
                    <Progress value={currentJob.progress} />
                  </div>

                  {/* Current Phase */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="font-medium text-blue-800">Current Phase</div>
                    <div className="text-sm text-blue-700">{currentJob.currentPhase}</div>
                  </div>

                  {/* Results */}
                  {currentJob.results && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {currentJob.results.statistics.usersImported}
                        </div>
                        <div className="text-sm text-muted-foreground">Users Imported</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {currentJob.results.statistics.devicesImported}
                        </div>
                        <div className="text-sm text-muted-foreground">Devices Imported</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {currentJob.results.statistics.conflicts}
                        </div>
                        <div className="text-sm text-muted-foreground">Conflicts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.round(currentJob.results.duration / 1000)}s
                        </div>
                        <div className="text-sm text-muted-foreground">Duration</div>
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {currentJob.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>
                        <div className="font-medium mb-2">Import Errors:</div>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {currentJob.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={clearJob}>
                      Clear Job
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('configuration')}>
                      Start New Import
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active import job</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab('configuration')}
                  >
                    Start New Import
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedImportPanel;
