
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Download, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Users,
  Car
} from 'lucide-react';
import { gp51ImportService } from '@/services/gp51/gp51ImportService';
import type { GP51ImportPreview, GP51ImportOptions, GP51ImportResult } from '@/types/system-import';

const GP51ImportManager: React.FC = () => {
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<GP51ImportPreview | null>(null);
  const [importResult, setImportResult] = useState<GP51ImportResult | null>(null);
  const [importOptions, setImportOptions] = useState<GP51ImportOptions>({
    importUsers: true,
    importDevices: true,
    conflictResolution: 'update'
  });
  const { toast } = useToast();

  const handleGetPreview = async () => {
    setIsLoadingPreview(true);
    setPreview(null);
    setImportResult(null);

    try {
      const previewData = await gp51ImportService.getImportPreview();
      setPreview(previewData);
      
      if (previewData.authentication.connected) {
        toast({
          title: "Preview Generated",
          description: `Found ${previewData.summary.vehicles} vehicles and ${previewData.summary.users} users`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: previewData.authentication.error || "Failed to connect to GP51",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Preview Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleStartImport = async () => {
    if (!preview?.authentication.connected) {
      toast({
        title: "Cannot Import",
        description: "Please generate a successful preview first",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await gp51ImportService.startImport(importOptions);
      setImportResult(result);
      
      if (result.success) {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${result.statistics.usersImported} users and ${result.statistics.devicesImported} devices`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const canStartImport = preview?.authentication.connected && 
    (preview.summary.vehicles > 0 || preview.summary.users > 0) &&
    !isImporting;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">GP51 Data Import</h1>
        <p className="text-gray-600">Import users and vehicles from your GP51 account</p>
      </div>

      {/* Step 1: Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Step 1: Preview Available Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Generate a lightweight preview to see what data is available for import.
          </p>
          
          <Button 
            onClick={handleGetPreview} 
            disabled={isLoadingPreview}
            className="w-full sm:w-auto"
          >
            {isLoadingPreview ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Loading Preview...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Get Import Preview
              </>
            )}
          </Button>

          {/* Preview Results */}
          {preview && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                {preview.authentication.connected ? (
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Disconnected
                  </Badge>
                )}
                {preview.authentication.username && (
                  <span className="text-sm text-gray-600">
                    as {preview.authentication.username}
                  </span>
                )}
              </div>

              {preview.authentication.connected && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Car className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-900">{preview.summary.vehicles}</div>
                    <div className="text-sm text-blue-700">Vehicles</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-900">{preview.summary.users}</div>
                    <div className="text-sm text-green-700">Users</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-lg font-bold text-purple-900">{preview.estimatedDuration}</div>
                    <div className="text-sm text-purple-700">Est. Duration</div>
                  </div>
                </div>
              )}

              {preview.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {preview.warnings.map((warning, index) => (
                        <div key={index}>{warning}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {!preview.authentication.connected && preview.authentication.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{preview.authentication.error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Configure Import */}
      {preview?.authentication.connected && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Configure Import Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={importOptions.importUsers}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, importUsers: e.target.checked }))}
                  className="rounded"
                />
                <span>Import Users</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={importOptions.importDevices}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, importDevices: e.target.checked }))}
                  className="rounded"
                />
                <span>Import Vehicles/Devices</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Conflict Resolution</label>
              <select
                value={importOptions.conflictResolution}
                onChange={(e) => setImportOptions(prev => ({ 
                  ...prev, 
                  conflictResolution: e.target.value as 'skip' | 'update' | 'replace' 
                }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="skip">Skip existing records</option>
                <option value="update">Update existing records</option>
                <option value="replace">Replace existing records</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Start Import */}
      {preview?.authentication.connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Step 3: Start Import
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Begin the actual import process. This will import data into your database.
            </p>
            
            <Button 
              onClick={handleStartImport} 
              disabled={!canStartImport}
              className="w-full sm:w-auto"
              variant={canStartImport ? "default" : "secondary"}
            >
              {isImporting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Start Import
                </>
              )}
            </Button>

            {isImporting && (
              <div className="space-y-2">
                <Progress value={50} className="w-full" />
                <p className="text-sm text-gray-600">Import in progress...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold">{importResult.statistics.usersImported}</div>
                <div className="text-sm text-gray-600">Users Imported</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{importResult.statistics.devicesImported}</div>
                <div className="text-sm text-gray-600">Devices Imported</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{importResult.statistics.conflicts}</div>
                <div className="text-sm text-gray-600">Conflicts</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{Math.round(importResult.duration / 1000)}s</div>
                <div className="text-sm text-gray-600">Duration</div>
              </div>
            </div>

            <Alert variant={importResult.success ? "default" : "destructive"}>
              <AlertDescription>{importResult.message}</AlertDescription>
            </Alert>

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-900">Errors:</h4>
                <ul className="text-sm text-red-800 space-y-1">
                  {importResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GP51ImportManager;
