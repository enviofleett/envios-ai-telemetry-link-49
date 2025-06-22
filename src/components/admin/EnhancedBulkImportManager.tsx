
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ImportPreviewPanel from './ImportPreviewPanel';
import { 
  Database, 
  PlayCircle, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Users,
  Car,
  FolderOpen
} from 'lucide-react';

interface ImportSummary {
  vehicles: number;
  users: number;
  groups: number;
}

interface ImportDetails {
  vehicles: any[];
  users: any[];
  groups: any[];
}

interface PreviewData {
  summary: ImportSummary;
  details: ImportDetails;
  message: string;
}

const EnhancedBulkImportManager: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAvailableData = async () => {
    setIsLoading(true);
    setError(null);
    setPreviewData(null);

    try {
      console.log('🔍 Fetching available GP51 data...');
      
      const { data, error: functionError } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { action: 'fetch_available_data' }
      });

      if (functionError) {
        console.error('❌ Function error:', functionError);
        throw new Error(`Function error: ${functionError.message}`);
      }

      console.log('📥 Function response:', data);

      // Handle the response structure safely
      if (!data) {
        throw new Error('No data received from GP51 service');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch data from GP51');
      }

      // Safely extract the preview data
      const summary: ImportSummary = {
        vehicles: data.summary?.vehicles || 0,
        users: data.summary?.users || 0,
        groups: data.summary?.groups || 0
      };

      const details: ImportDetails = {
        vehicles: data.details?.vehicles || [],
        users: data.details?.users || [],
        groups: data.details?.groups || []
      };

      const previewResult: PreviewData = {
        summary,
        details,
        message: data.message || `Data discovery completed`
      };

      setPreviewData(previewResult);

      console.log('✅ Preview data set:', previewResult);

      toast({
        title: "Data Preview Loaded",
        description: `Found ${summary.vehicles} vehicles, ${summary.users} users, and ${summary.groups} groups`,
      });

    } catch (err) {
      console.error('❌ Preview error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch GP51 data';
      setError(errorMessage);
      
      toast({
        title: "Preview Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startBulkImport = async () => {
    if (!previewData) {
      toast({
        title: "No Data to Import",
        description: "Please load preview data first",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { 
          action: 'start_import',
          previewData 
        }
      });

      if (functionError) {
        throw new Error(`Import error: ${functionError.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Import failed');
      }

      // Simulate progress for demo
      for (let i = 0; i <= 100; i += 10) {
        setImportProgress(i);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast({
        title: "Import Completed",
        description: "All data has been successfully imported from GP51",
      });

    } catch (err) {
      console.error('❌ Import error:', err);
      toast({
        title: "Import Failed",
        description: err instanceof Error ? err.message : 'Import process failed',
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  useEffect(() => {
    // Auto-load data on component mount
    fetchAvailableData();
  }, []);

  const hasData = previewData && (
    previewData.summary.vehicles > 0 || 
    previewData.summary.users > 0 || 
    previewData.summary.groups > 0
  );

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Car className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">{previewData?.summary.vehicles || 0}</p>
              <p className="text-sm text-muted-foreground">Vehicles Available</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">{previewData?.summary.users || 0}</p>
              <p className="text-sm text-muted-foreground">Users Available</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <FolderOpen className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">{previewData?.summary.groups || 0}</p>
              <p className="text-sm text-muted-foreground">Groups Available</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            GP51 Bulk Import Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {previewData?.message && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{previewData.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button
              onClick={fetchAvailableData}
              disabled={isLoading || isImporting}
              variant="outline"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading Preview...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data Preview
                </>
              )}
            </Button>

            <Button
              onClick={startBulkImport}
              disabled={!hasData || isLoading || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Bulk Import
                </>
              )}
            </Button>
          </div>

          {isImporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Import Progress</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Panel */}
      {previewData && (
        <ImportPreviewPanel 
          previewData={previewData}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default EnhancedBulkImportManager;
