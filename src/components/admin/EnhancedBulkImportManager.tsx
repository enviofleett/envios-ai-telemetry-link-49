
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  Car,
  TrendingUp
} from 'lucide-react';

interface ImportStatistics {
  usersProcessed: number;
  usersImported: number;
  devicesProcessed: number;
  devicesImported: number;
  conflicts: number;
}

interface ImportResult {
  success: boolean;
  message: string;
  statistics: ImportStatistics;
  errors: string[];
  authenticationStatus?: {
    connected: boolean;
    username?: string;
    authenticatedAt?: string;
    error?: string;
  };
}

interface ImportJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  statistics: ImportStatistics;
  errors: string[];
  startedAt?: string;
  completedAt?: string;
}

const EnhancedBulkImportManager: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [importJob, setImportJob] = useState<ImportJob | null>(null);
  const [availableData, setAvailableData] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<any>(null);

  // Safely access nested properties with fallbacks
  const getStatsSafely = (stats: ImportStatistics | undefined) => ({
    usersProcessed: stats?.usersProcessed ?? 0,
    usersImported: stats?.usersImported ?? 0,
    devicesProcessed: stats?.devicesProcessed ?? 0,
    devicesImported: stats?.devicesImported ?? 0,
    conflicts: stats?.conflicts ?? 0
  });

  const fetchAvailableData = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 [EnhancedBulkImport] Fetching available GP51 data...');
      
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: {
          action: 'fetch_available_data'
        }
      });

      if (error) {
        console.error('❌ [EnhancedBulkImport] Edge function error:', error);
        throw new Error(`Failed to fetch data: ${error.message}`);
      }

      console.log('📊 [EnhancedBulkImport] Response received:', data);
      
      setAvailableData(data);
      setAuthStatus(data?.authenticationStatus || { connected: false });

      if (data?.success) {
        toast({
          title: "Data Preview Loaded",
          description: data.message || "Successfully fetched available GP51 data",
        });
      } else {
        toast({
          title: "Connection Issue",
          description: data?.message || "Could not connect to GP51 service",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ [EnhancedBulkImport] Failed to fetch available data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setAuthStatus({ connected: false, error: errorMessage });
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startImport = async () => {
    if (!availableData?.success) {
      toast({
        title: "No Data Available",
        description: "Please fetch available data first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('🚀 [EnhancedBulkImport] Starting import process...');

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
        console.error('❌ [EnhancedBulkImport] Import failed:', error);
        throw new Error(`Import failed: ${error.message}`);
      }

      console.log('📊 [EnhancedBulkImport] Import result:', data);

      const safeStats = getStatsSafely(data?.statistics);
      
      const newJob: ImportJob = {
        id: `import-${Date.now()}`,
        status: data?.success ? 'completed' : 'failed',
        progress: 100,
        statistics: safeStats,
        errors: data?.errors || [],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };

      setImportJob(newJob);

      if (data?.success) {
        toast({
          title: "Import Completed",
          description: data.message || `Successfully imported ${safeStats.usersImported} users and ${safeStats.devicesImported} devices`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: data?.message || "Import process encountered errors",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ [EnhancedBulkImport] Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      const failedJob: ImportJob = {
        id: `import-${Date.now()}`,
        status: 'failed',
        progress: 0,
        statistics: getStatsSafely(undefined),
        errors: [errorMessage],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };

      setImportJob(failedJob);
      
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetImport = () => {
    setImportJob(null);
    setAvailableData(null);
    setAuthStatus(null);
    toast({
      title: "Import Reset",
      description: "Cleared all import data and status"
    });
  };

  useEffect(() => {
    // Auto-fetch available data on component mount
    fetchAvailableData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Bulk Import</h2>
          <p className="text-muted-foreground">
            Import users and devices from GP51 with advanced error handling and progress tracking
          </p>
        </div>
      </div>

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            GP51 Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {authStatus?.connected ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <XCircle className="h-3 w-3 mr-1" />
                Disconnected
              </Badge>
            )}
            
            {authStatus?.username && (
              <span className="text-sm text-muted-foreground">
                Authenticated as: {authStatus.username}
              </span>
            )}
            
            {authStatus?.error && (
              <span className="text-sm text-red-600">
                Error: {authStatus.error}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Data Preview */}
      {availableData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Available Data Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{availableData?.summary?.users ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Users Available</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <Car className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{availableData?.summary?.vehicles ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Vehicles Available</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                <Database className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{availableData?.summary?.groups ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Groups Available</div>
                </div>
              </div>
            </div>
            
            {availableData?.message && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {availableData.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Import Actions</CardTitle>
          <CardDescription>
            Manage your GP51 data import process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={fetchAvailableData}
              disabled={isLoading}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            
            <Button
              onClick={startImport}
              disabled={isLoading || !availableData?.success}
            >
              <Upload className="h-4 w-4 mr-2" />
              Start Import
            </Button>
            
            {importJob && (
              <Button
                onClick={resetImport}
                variant="outline"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Import Job Status */}
      {importJob && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Import Job Status
              <Badge variant={importJob.status === 'completed' ? 'default' : importJob.status === 'failed' ? 'destructive' : 'secondary'}>
                {importJob.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={importJob.progress} className="w-full" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {getStatsSafely(importJob.statistics).usersImported}
                </div>
                <div className="text-sm text-muted-foreground">Users Imported</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {getStatsSafely(importJob.statistics).devicesImported}
                </div>
                <div className="text-sm text-muted-foreground">Devices Imported</div>
              </div>
              
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {getStatsSafely(importJob.statistics).conflicts}
                </div>
                <div className="text-sm text-muted-foreground">Conflicts</div>
              </div>
              
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {importJob.errors?.length ?? 0}
                </div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            </div>

            {importJob.errors && importJob.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Import Errors:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {importJob.errors.slice(0, 5).map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                    {importJob.errors.length > 5 && (
                      <li className="text-sm">... and {importJob.errors.length - 5} more errors</li>
                    )}
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
