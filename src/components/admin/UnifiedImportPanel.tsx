import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedImport } from '@/hooks/useUnifiedImport';
import { CheckCircle, XCircle, Database, Loader2, AlertTriangle } from 'lucide-react';
import type { GP51ImportOptions } from '@/types/system-import';

const UnifiedImportPanel: React.FC = () => {
  const [conflictResolution, setConflictResolution] = useState<string>('skip');
  const { toast } = useToast();
  const { preview, isLoadingPreview, fetchPreview, startImport, isImporting } = useUnifiedImport();

  const handleStartImport = async () => {
    if (!preview?.success) {
      toast({
        title: "Import Error",
        description: "Please generate a successful preview before starting import",
        variant: "destructive"
      });
      return;
    }

    const importOptions: GP51ImportOptions = {
      importUsers: true,
      importDevices: true,  // Fixed: was importVehicles
      conflictResolution: conflictResolution as 'skip' | 'overwrite' | 'merge',
      batchSize: 50
    };

    console.log('🚀 Starting import with options:', importOptions);
    await startImport(importOptions);
  };

  const handleFetchPreview = useCallback(async () => {
    await fetchPreview();
  }, [fetchPreview]);

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-600" />
            <CardTitle>Unified Import System</CardTitle>
          </div>
          <CardDescription>
            Import users and vehicles from GP51 with conflict resolution and preview capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preview Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Preview</h3>
              {preview && preview.success ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-green-800">Preview Ready</h4>
                      <p className="text-sm text-green-700 mt-1">
                        {preview.data.summary.users} users and {preview.data.summary.vehicles} vehicles found.
                      </p>
                    </div>
                  </div>
                </div>
              ) : preview && !preview.success ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800">Preview Failed</h4>
                      <p className="text-sm text-red-700 mt-1">
                        {preview.connectionStatus.error || "Unable to fetch preview data from GP51"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-gray-600" />
                    <div>
                      <h4 className="font-medium text-gray-800">Preview</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Click the button below to generate a preview of the data to be imported.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={handleFetchPreview} disabled={isLoadingPreview} className="w-full">
                {isLoadingPreview ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Preview...
                  </>
                ) : (
                  'Generate Preview'
                )}
              </Button>
            </div>

            {/* Import Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Import</h3>
              <Card className="bg-gray-50 border border-gray-200">
                <CardHeader>
                  <CardTitle>Import Options</CardTitle>
                  <CardDescription>Configure import settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="conflict">Conflict Resolution</Label>
                    <Select onValueChange={setConflictResolution}>
                      <SelectTrigger id="conflict">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="skip">Skip</SelectItem>
                        <SelectItem value="overwrite">Overwrite</SelectItem>
                        <SelectItem value="merge">Merge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleStartImport} disabled={isImporting || !preview?.success} className="w-full">
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Start Import'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Section */}
      {preview?.success && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-600" />
              Import Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{preview.data.summary.users}</div>
                <div className="text-sm text-gray-600">Users</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{preview.data.summary.vehicles}</div>
                <div className="text-sm text-gray-600">Vehicles</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UnifiedImportPanel;
