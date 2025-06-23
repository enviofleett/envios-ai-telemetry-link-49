
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  Database,
  Users,
  Car,
  Clock
} from 'lucide-react';

interface ApiPreviewData {
  success: boolean;
  summary: {
    vehicles: number;
    users: number;
    groups: number;
  };
  details: {
    vehicles: any[];
    users: any[];
    groups: any[];
  };
  message: string;
}

interface ImportStatistics {
  users: {
    created: number;
    updated: number;
    failed: number;
  };
  devices: {
    created: number;
    updated: number;
    failed: number;
  };
  totalProcessed: number;
  errors: string[];
}

const EnhancedBulkImportManager: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<ApiPreviewData | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportStatistics | null>(null);
  const { toast } = useToast();

  const fetchPreviewData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Fetching GP51 preview data...');
      
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { 
          action: 'fetch_available_data'
        }
      });

      if (error) {
        console.error('❌ Preview fetch error:', error);
        throw new Error(`API Error: ${error.message}`);
      }

      console.log('📊 Preview data received:', data);
      
      if (!data) {
        throw new Error('No data received from API');
      }

      setPreviewData(data as ApiPreviewData);
      
      if (data.success) {
        toast({
          title: "Data Preview Loaded",
          description: `Found ${data.summary.vehicles} vehicles, ${data.summary.users} users, and ${data.summary.groups} groups`,
        });
      } else {
        toast({
          title: "Preview Warning",
          description: data.message || "Unable to fetch all data",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('❌ Failed to fetch preview:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Preview Failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Set empty preview data to show the error state
      setPreviewData({
        success: false,
        summary: { vehicles: 0, users: 0, groups: 0 },
        details: { vehicles: [], users: [], groups: [] },
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startImport = async () => {
    if (!previewData || !previewData.success) {
      toast({
        title: "Cannot Start Import",
        description: "Please fetch and verify preview data first",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportResults(null);

    try {
      console.log('🚀 Starting GP51 import process...');
      
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { 
          action: 'start_import',
          options: {
            importUsers: true,
            importDevices: true,
            conflictResolution: 'update'
          }
        }
      });

      if (error) {
        console.error('❌ Import error:', error);
        throw new Error(`Import failed: ${error.message}`);
      }

      console.log('✅ Import completed:', data);

      if (data.success) {
        setImportResults(data.statistics);
        setImportProgress(100);
        
        toast({
          title: "Import Completed",
          description: `Successfully imported ${data.statistics.totalProcessed} records`,
        });
      } else {
        throw new Error(data.message || 'Import failed');
      }

    } catch (error) {
      console.error('❌ Import process failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setPreviewData(null);
    setImportProgress(0);
    setImportResults(null);
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            GP51 Data Import Manager
          </CardTitle>
          <CardDescription>
            Import users and vehicles from GP51 platform with preview and validation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={fetchPreviewData}
              disabled={isLoading || isImporting}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isLoading ? 'Loading Preview...' : 'Fetch Preview Data'}
            </Button>
            
            <Button
              onClick={startImport}
              disabled={!previewData?.success || isImporting || isLoading}
              variant="default"
              className="flex items-center gap-2"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isImporting ? 'Importing...' : 'Start Import'}
            </Button>

            <Button
              onClick={resetImport}
              variant="outline"
              disabled={isLoading || isImporting}
            >
              Reset
            </Button>
          </div>

          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Import Progress</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Data Display */}
      {previewData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {previewData.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              Data Preview
            </CardTitle>
            <CardDescription>
              {previewData.message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Car className="h-6 w-6 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-900">{previewData.summary.vehicles}</div>
                  <div className="text-sm text-blue-700">Vehicles</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-900">{previewData.summary.users}</div>
                  <div className="text-sm text-green-700">Users</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                <Database className="h-6 w-6 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-900">{previewData.summary.groups}</div>
                  <div className="text-sm text-purple-700">Groups</div>
                </div>
              </div>
            </div>

            {!previewData.success && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {previewData.message}
                </AlertDescription>
              </Alert>
            )}

            {previewData.success && previewData.details.vehicles.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Sample Vehicles (First 5)</h4>
                <div className="grid gap-2">
                  {previewData.details.vehicles.slice(0, 5).map((vehicle: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{vehicle.devicename || 'Unnamed Device'}</div>
                        <div className="text-sm text-gray-600">ID: {vehicle.deviceid}</div>
                      </div>
                      <Badge variant="outline">{vehicle.devicetype || 'Unknown Type'}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Users</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <Badge variant="default">{importResults.users.created}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated:</span>
                    <Badge variant="secondary">{importResults.users.updated}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed:</span>
                    <Badge variant="destructive">{importResults.users.failed}</Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Devices</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <Badge variant="default">{importResults.devices.created}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated:</span>
                    <Badge variant="secondary">{importResults.devices.updated}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed:</span>
                    <Badge variant="destructive">{importResults.devices.failed}</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">
                  Total Records Processed: {importResults.totalProcessed}
                </span>
              </div>
            </div>

            {importResults.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Errors</h4>
                <div className="space-y-1">
                  {importResults.errors.slice(0, 5).map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                  ))}
                  {importResults.errors.length > 5 && (
                    <p className="text-sm text-gray-600">
                      ... and {importResults.errors.length - 5} more errors
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedBulkImportManager;
