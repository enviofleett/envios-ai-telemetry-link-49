
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, Play, Pause, AlertCircle, CheckCircle, Info } from 'lucide-react';
import GP51DiagnosticsPanel from './GP51DiagnosticsPanel';
import { enhancedImportErrorHandler } from '@/utils/enhanced-import-error-handler';

interface ImportProgress {
  phase: string;
  percentage: number;
  message: string;
  overallProgress?: number;
  phaseProgress?: number;
  currentOperation?: string;
  details?: string;
}

const EnhancedBulkImportManager: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [lastImportResult, setLastImportResult] = useState<any>(null);
  const { toast } = useToast();

  const startImport = async () => {
    try {
      enhancedImportErrorHandler.clear();
      setIsImporting(true);
      setProgress({
        phase: 'initializing',
        percentage: 0,
        message: 'Starting enhanced bulk import...'
      });

      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { action: 'start_import' }
      });

      if (error) {
        const importError = enhancedImportErrorHandler.parseApiError(error);
        enhancedImportErrorHandler.addError(importError);
        
        throw new Error(error.message || 'Import failed');
      }

      if (!data.success) {
        const importError = enhancedImportErrorHandler.parseApiError({ message: data.error });
        enhancedImportErrorHandler.addError(importError);
        
        throw new Error(data.error || 'Import failed');
      }

      setLastImportResult(data);
      setProgress({
        phase: 'completed',
        percentage: 100,
        message: 'Import completed successfully'
      });

      toast({
        title: "Import Completed",
        description: "Bulk import completed successfully"
      });

    } catch (error) {
      console.error('Import error:', error);
      
      setProgress({
        phase: 'error',
        percentage: 0,
        message: enhancedImportErrorHandler.formatErrorsForUser()
      });

      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : 'Import failed',
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
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              The bulk import functionality is currently being rebuilt with enhanced error handling and multiple authentication strategies. 
              Please use the diagnostics panel above to test your GP51 connection first.
            </AlertDescription>
          </Alert>

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

          {enhancedImportErrorHandler.getErrors().length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium text-red-800">Import Errors:</div>
                  {enhancedImportErrorHandler.getErrors().map((error, index) => (
                    <div key={index} className="text-sm text-red-700">
                      • {error.message}
                      {error.details && (
                        <div className="ml-4 text-xs text-red-600">
                          {enhancedImportErrorHandler.getRecoveryRecommendation(error)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={startImport} 
              disabled={isImporting}
              variant="outline"
              className="opacity-50 cursor-not-allowed"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Import (Coming Soon)
            </Button>
          </div>

          {lastImportResult && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="text-green-800">
                  Last import completed successfully with enhanced error handling.
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Enhanced multi-strategy authentication with GP51</p>
            <p>• Comprehensive error handling and recovery</p>
            <p>• Real-time progress monitoring</p>
            <p>• Detailed diagnostics and troubleshooting</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedBulkImportManager;
