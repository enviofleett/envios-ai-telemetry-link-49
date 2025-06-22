
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, Play, Eye, AlertCircle, CheckCircle, Info, Database, Users, Car } from 'lucide-react';
import GP51DiagnosticsPanel from './GP51DiagnosticsPanel';
import ImportPreviewPanel from './ImportPreviewPanel';

interface ImportProgress {
  phase: string;
  percentage: number;
  message: string;
  overallProgress?: number;
  phaseProgress?: number;
  currentOperation?: string;
  details?: string;
}

interface ImportPreviewData {
  vehicles: {
    total: number;
    sample: any[];
    activeCount: number;
    inactiveCount: number;
  };
  users: {
    total: number;
    sample: any[];
    activeCount: number;
  };
  groups: {
    total: number;
    sample: any[];
  };
  summary: {
    totalDevices: number;
    totalUsers: number;
    totalGroups: number;
    lastUpdate: string;
    estimatedImportTime: string;
  };
}

const EnhancedBulkImportManager: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const fetchDataPreview = async () => {
    try {
      setIsLoadingPreview(true);
      
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { action: 'fetch_available_data' }
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch preview data');
      }

      // Fix: Handle the correct response structure
      if (!data || !data.success) {
        throw new Error(data?.error || 'Preview fetch failed');
      }

      // Fix: Access the data property correctly
      const previewData = data.data;
      
      // Fix: Validate that we have the expected structure
      if (!previewData || !previewData.summary) {
        throw new Error('Invalid preview data structure received');
      }

      setPreviewData(previewData);
      setShowPreview(true);

      toast({
        title: "Data Preview Ready",
        description: `Found ${previewData.summary.totalDevices} vehicles and ${previewData.summary.totalUsers} users`
      });

    } catch (error) {
      console.error('Preview fetch error:', error);
      
      // Fix: Provide more specific error handling
      let errorMessage = 'Failed to fetch preview data';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Preview Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Fix: Reset state on error
      setPreviewData(null);
      setShowPreview(false);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const startImport = async () => {
    try {
      setIsImporting(true);
      setProgress({
        phase: 'initializing',
        percentage: 0,
        message: 'Starting enhanced bulk import...'
      });

      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { action: 'start_import', previewData }
      });

      if (error) {
        throw new Error(error.message || 'Import failed');
      }

      // Fix: Handle response structure correctly
      if (!data || !data.success) {
        throw new Error(data?.error || 'Import failed');
      }

      setProgress({
        phase: 'completed',
        percentage: 100,
        message: data.message || 'Import completed successfully'
      });

      toast({
        title: "Import Completed",
        description: data.message || "Bulk import completed successfully"
      });

    } catch (error) {
      console.error('Import error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      
      setProgress({
        phase: 'error',
        percentage: 0,
        message: errorMessage
      });

      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Diagnostics Panel */}
      <GP51DiagnosticsPanel />

      {/* Import Manager */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Enhanced Bulk Import Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showPreview ? (
            <>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Ready to import GP51 data! Start by previewing what data is available for import.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button 
                  onClick={fetchDataPreview}
                  disabled={isLoadingPreview}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {isLoadingPreview ? 'Loading Preview...' : 'Preview Available Data'}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Data Preview */}
              {previewData && <ImportPreviewPanel data={previewData} />}

              {/* Import Controls */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Import Controls</h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setShowPreview(false);
                        setPreviewData(null);
                      }}
                      disabled={isImporting}
                    >
                      Refresh Preview
                    </Button>
                    <Button 
                      onClick={startImport}
                      disabled={isImporting || !previewData}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      {isImporting ? 'Importing...' : 'Start Import'}
                    </Button>
                  </div>
                </div>

                {progress && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {progress.phase.charAt(0).toUpperCase() + progress.phase.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {Math.round(progress.percentage)}%
                      </span>
                    </div>
                    
                    <Progress value={progress.percentage} className="w-full" />
                    
                    <p className="text-sm text-gray-600">{progress.message}</p>
                    
                    {progress.details && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{progress.details}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Enhanced multi-strategy authentication with GP51</p>
            <p>• Real-time data preview and import monitoring</p>
            <p>• Comprehensive error handling and recovery</p>
            <p>• Safe batch processing with progress tracking</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedBulkImportManager;
