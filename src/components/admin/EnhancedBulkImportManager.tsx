
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database, Download, Upload, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface ImportJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  totalRecords: number;
  processedRecords: number;
  errors: string[];
  startedAt: string;
  completedAt?: string;
}

interface PreviewData {
  totalUsers: number;
  totalVehicles: number;
  sampleRecords: any[];
  conflicts: any[];
  estimatedDuration: string;
}

const EnhancedBulkImportManager: React.FC = () => {
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);
  const { toast } = useToast();

  const fetchPreviewData = async () => {
    setIsLoadingPreview(true);
    try {
      console.log('🔍 Fetching enhanced bulk import preview...');
      
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { action: 'get_import_preview' }
      });

      if (error) {
        console.error('❌ Preview fetch error:', error);
        throw new Error(`Preview failed: ${error.message}`);
      }

      if (data?.success) {
        const summary = data.data?.summary || {};
        setPreviewData({
          totalUsers: summary.users || 0,
          totalVehicles: summary.vehicles || 0,
          sampleRecords: data.data?.sampleData?.vehicles || [],
          conflicts: data.data?.conflicts || [],
          estimatedDuration: data.data?.estimatedDuration || '0 minutes'
        });

        toast({
          title: "Preview Generated",
          description: `Found ${summary.users || 0} users and ${summary.vehicles || 0} vehicles available for import.`
        });
      } else {
        throw new Error(data?.error || 'Failed to generate preview');
      }
    } catch (error) {
      console.error('❌ Preview generation failed:', error);
      toast({
        title: "Preview Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const startBulkImport = async () => {
    if (!previewData) {
      toast({
        title: "No Preview Data",
        description: "Please generate a preview before starting the import",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    try {
      console.log('🚀 Starting enhanced bulk import...');
      
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { 
          action: 'start_import',
          options: {
            importUsers: true,
            importDevices: true,
            conflictResolution: 'skip',
            batchSize: 50
          }
        }
      });

      if (error) {
        throw new Error(`Import failed: ${error.message}`);
      }

      if (data?.success) {
        const jobData: ImportJob = {
          id: `import_${Date.now()}`,
          status: 'completed',
          progress: 100,
          totalRecords: previewData.totalUsers + previewData.totalVehicles,
          processedRecords: previewData.totalUsers + previewData.totalVehicles,
          errors: data.errors || [],
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        };

        setCurrentJob(jobData);

        toast({
          title: "Import Completed",
          description: `Successfully imported ${data.statistics?.usersImported || 0} users and ${data.statistics?.devicesImported || 0} devices.`
        });
      } else {
        throw new Error(data?.message || 'Import failed');
      }
    } catch (error) {
      console.error('❌ Bulk import failed:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });

      const failedJob: ImportJob = {
        id: `failed_${Date.now()}`,
        status: 'failed',
        progress: 0,
        totalRecords: 0,
        processedRecords: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        startedAt: new Date().toISOString()
      };

      setCurrentJob(failedJob);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-600" />
            <CardTitle>Enhanced Bulk Import Manager</CardTitle>
          </div>
          <CardDescription>
            Import all users and vehicles from GP51 with advanced conflict resolution and progress monitoring.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!previewData ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">No preview data available</div>
              <Button onClick={fetchPreviewData} disabled={isLoadingPreview}>
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
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{previewData.totalUsers}</div>
                  <div className="text-sm text-gray-600">Users</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{previewData.totalVehicles}</div>
                  <div className="text-sm text-gray-600">Vehicles</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{previewData.estimatedDuration}</div>
                  <div className="text-sm text-gray-600">Est. Duration</div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={fetchPreviewData} disabled={isLoadingPreview}>
                  Refresh Preview
                </Button>
                <Button onClick={startBulkImport} disabled={isImporting}>
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Start Import
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Status */}
      {currentJob && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentJob.status === 'completed' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : currentJob.status === 'failed' ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
              Import Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{currentJob.processedRecords} / {currentJob.totalRecords}</span>
              </div>
              <Progress value={currentJob.progress} className="w-full" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Status:</span>
                <span className={`ml-2 capitalize ${
                  currentJob.status === 'completed' ? 'text-green-600' :
                  currentJob.status === 'failed' ? 'text-red-600' :
                  'text-blue-600'
                }`}>
                  {currentJob.status}
                </span>
              </div>
              <div>
                <span className="font-medium">Started:</span>
                <span className="ml-2">{new Date(currentJob.startedAt).toLocaleString()}</span>
              </div>
            </div>

            {currentJob.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">Errors encountered:</div>
                  <ul className="mt-1 list-disc list-inside">
                    {currentJob.errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedBulkImportManager;
