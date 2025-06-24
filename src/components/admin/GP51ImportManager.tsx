
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUnifiedImport } from '@/hooks/useUnifiedImport';
import { Download, Upload, Users, Car, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import type { GP51ImportOptions } from '@/types/system-import';

const GP51ImportManager: React.FC = () => {
  const [importOptions, setImportOptions] = useState<GP51ImportOptions>({
    importUsers: true,
    importDevices: true,
    conflictResolution: 'overwrite',
    batchSize: 50
  });
  
  const [usernames, setUsernames] = useState('');
  const { 
    preview, 
    isLoadingPreview, 
    isImporting, 
    importJob,
    fetchPreview, 
    startImport, 
    validateConnection 
  } = useUnifiedImport();

  const handleImportOptionsChange = (key: keyof GP51ImportOptions, value: any) => {
    setImportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleStartImport = async () => {
    const options: GP51ImportOptions = {
      ...importOptions,
      usernames: usernames ? usernames.split('\n').map(u => u.trim()).filter(Boolean) : undefined
    };
    
    await startImport(options);
  };

  const getConnectionStatusBadge = () => {
    if (!preview) return null;
    
    if (preview.connectionStatus.connected) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Disconnected
        </Badge>
      );
    }
  };

  const getImportStatusBadge = () => {
    if (!importJob) return null;
    
    switch (importJob.status) {
      case 'running':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Running
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            GP51 Data Import
            {getConnectionStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          {preview && !preview.success && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Connection Error:</strong> {preview.connectionStatus.error}
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={validateConnection}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Test Connection
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Import Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Import Options</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="importUsers"
                    checked={importOptions.importUsers}
                    onCheckedChange={(checked) => handleImportOptionsChange('importUsers', checked)}
                  />
                  <Label htmlFor="importUsers" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Import Users
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="importDevices"
                    checked={importOptions.importDevices}
                    onCheckedChange={(checked) => handleImportOptionsChange('importDevices', checked)}
                  />
                  <Label htmlFor="importDevices" className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Import Devices
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conflictResolution">Conflict Resolution</Label>
                <Select 
                  value={importOptions.conflictResolution} 
                  onValueChange={(value: 'skip' | 'overwrite' | 'merge') => 
                    handleImportOptionsChange('conflictResolution', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">Skip existing records</SelectItem>
                    <SelectItem value="overwrite">Overwrite existing records</SelectItem>
                    <SelectItem value="merge">Merge data where possible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batchSize">Batch Size</Label>
                <Input
                  id="batchSize"
                  type="number"
                  min="10"
                  max="100"
                  value={importOptions.batchSize || 50}
                  onChange={(e) => handleImportOptionsChange('batchSize', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Specific Users (Optional)</h3>
              <div className="space-y-2">
                <Label htmlFor="usernames">GP51 Usernames</Label>
                <textarea
                  id="usernames"
                  className="w-full min-h-[120px] p-3 border rounded-md"
                  placeholder="Enter usernames, one per line"
                  value={usernames}
                  onChange={(e) => setUsernames(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to import all users, or specify usernames to import only those users
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={fetchPreview}
              disabled={isLoadingPreview}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoadingPreview ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isLoadingPreview ? 'Loading Preview...' : 'Fetch Available Data'}
            </Button>
            
            <Button
              onClick={handleStartImport}
              disabled={isImporting || !preview?.success}
              className="flex items-center gap-2"
            >
              {isImporting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isImporting ? 'Importing...' : 'Start Import'}
            </Button>

            <Button
              onClick={validateConnection}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Test Connection
            </Button>
          </div>

          {/* Preview Data */}
          {preview && preview.success && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Import Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>Users: <strong>{preview.data.summary.users}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-green-600" />
                    <span>Vehicles: <strong>{preview.data.summary.vehicles}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span>Duration: <strong>{preview.data.estimatedDuration}</strong></span>
                  </div>
                </div>
                
                {preview.data.warnings.length > 0 && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warnings:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {preview.data.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Import Progress */}
          {importJob && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {getImportStatusBadge()}
                  Import Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Current Phase: {importJob.currentPhase}</span>
                    <span>{importJob.progress}%</span>
                  </div>
                  <Progress value={importJob.progress} className="h-2" />
                </div>

                {importJob.results && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Users Imported:</span>
                      <span className="ml-2 font-medium">
                        {importJob.results.statistics.usersImported}/{importJob.results.statistics.usersProcessed}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Devices Imported:</span>
                      <span className="ml-2 font-medium">
                        {importJob.results.statistics.devicesImported}/{importJob.results.statistics.devicesProcessed}
                      </span>
                    </div>
                  </div>
                )}

                {importJob.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Errors:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {importJob.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-xs text-gray-500">
                  Started: {new Date(importJob.startedAt).toLocaleString()}
                  {importJob.completedAt && (
                    <span className="ml-4">
                      Completed: {new Date(importJob.completedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51ImportManager;
