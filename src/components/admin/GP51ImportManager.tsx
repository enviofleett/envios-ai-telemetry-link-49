
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ImportPreviewPanel from './ImportPreviewPanel';
import { 
  RefreshCw, 
  Download, 
  Upload,
  Settings,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const GP51ImportManager: React.FC = () => {
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const { toast } = useToast();

  const fetchAvailableData = async () => {
    setIsLoading(true);
    setPreviewData(null);
    
    try {
      console.log('🔄 Fetching available GP51 data...');
      
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { action: 'fetch_available_data' }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('📊 Preview data received:', data);
      setPreviewData(data);
      
      if (data.success && data.summary.vehicles > 0) {
        toast({
          title: "Data Discovery Successful",
          description: `Found ${data.summary.vehicles} vehicles, ${data.summary.users} users, and ${data.summary.groups} groups ready for import.`,
        });
      } else if (data.success) {
        toast({
          title: "Connection Successful",
          description: "Connected to GP51 successfully, but no data found. Please check your GP51 account configuration.",
          variant: "default"
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.message || "Failed to connect to GP51 API",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch GP51 data:', error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to fetch GP51 data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startImport = async () => {
    if (!previewData?.success || !previewData?.summary?.vehicles) {
      toast({
        title: "Import Not Available",
        description: "Please test connection and ensure data is available before starting import.",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);
    
    try {
      console.log('🎯 Starting GP51 import...');
      
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
        throw new Error(error.message);
      }

      console.log('📊 Import result:', data);
      setImportResult(data);
      
      if (data.success) {
        toast({
          title: "Import Completed Successfully",
          description: `Imported ${data.statistics.devicesProcessed} vehicles and ${data.statistics.usersProcessed} users.`,
        });
      } else {
        toast({
          title: "Import Completed with Issues",
          description: `${data.message} Check the results below for details.`,
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Import process failed",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">GP51 Data Import</h1>
        <p className="text-gray-600 mt-2">
          Import users and vehicles from your GP51 platform using the standardized API
        </p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Import Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={fetchAvailableData}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Test Connection & Preview Data
            </Button>
            
            {previewData?.success && previewData?.summary?.vehicles > 0 && (
              <Button
                onClick={startImport}
                disabled={isImporting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isImporting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Start Import
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <ImportPreviewPanel 
        previewData={previewData} 
        isLoading={isLoading} 
      />

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 rounded-lg ${
              importResult.success ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <p className={`font-medium ${
                importResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {importResult.message}
              </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {importResult.statistics.usersProcessed}
                </div>
                <div className="text-sm text-blue-700">Users Processed</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.statistics.devicesProcessed}
                </div>
                <div className="text-sm text-green-700">Devices Processed</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {importResult.statistics.devicesCreated}
                </div>
                <div className="text-sm text-purple-700">Records Created</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.statistics.errors}
                </div>
                <div className="text-sm text-red-700">Errors</div>
              </div>
            </div>

            {/* Errors */}
            {importResult.errors && importResult.errors.length > 0 && (
              <div>
                <Separator />
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Import Errors:</h4>
                  <div className="space-y-2">
                    {importResult.errors.slice(0, 5).map((error: any, index: number) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">
                            {error.type}
                          </Badge>
                          <span className="text-sm text-red-800">{error.message}</span>
                        </div>
                      </div>
                    ))}
                    {importResult.errors.length > 5 && (
                      <div className="text-sm text-gray-600">
                        ... and {importResult.errors.length - 5} more errors
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GP51ImportManager;
