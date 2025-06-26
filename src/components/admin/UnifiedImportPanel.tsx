
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUnifiedImport } from '@/hooks/useUnifiedImport';
import GP51ProgressIndicator from './GP51ProgressIndicator';
import EnhancedBulkImportManager from './EnhancedBulkImportManager';
import { Download, AlertTriangle, CheckCircle, Clock, Database, Upload } from 'lucide-react';

const UnifiedImportPanel: React.FC = () => {
  const { 
    preview, 
    isLoadingPreview, 
    operationProgress,
    fetchPreview 
  } = useUnifiedImport();

  const handleGeneratePreview = () => {
    fetchPreview();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="bulk-import" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bulk-import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Bulk Import (Recommended)
          </TabsTrigger>
          <TabsTrigger value="preview-import" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            GP51 Preview Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bulk-import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Enhanced GP51 Bulk Import
              </CardTitle>
              <CardDescription>
                Import users and vehicles from CSV files with full GP51 API integration and Supabase synchronization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recommended Method:</strong> This import method provides full control over the import process, 
                  including CSV parsing, duplicate detection, error handling, and automatic Supabase synchronization.
                </AlertDescription>
              </Alert>
              
              <EnhancedBulkImportManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview-import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                GP51 Preview Import (Legacy)
              </CardTitle>
              <CardDescription>
                Import vehicles directly from GP51 with improved reliability for large datasets (3000+ vehicles)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Indicator */}
              <GP51ProgressIndicator
                isActive={operationProgress.isActive}
                currentOperation={operationProgress.currentOperation}
                progress={operationProgress.progress}
                estimatedTime={operationProgress.estimatedTime}
                dataSize={preview?.success ? {
                  vehicles: preview.data.summary.vehicles,
                  users: preview.data.summary.users
                } : undefined}
              />

              {/* Large Dataset Warning */}
              {!preview && !isLoadingPreview && (
                <Alert className="border-amber-200 bg-amber-50">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>Large Dataset Notice:</strong> GP51 contains 3000+ vehicles. 
                    Initial data preview may take 2-5 minutes to complete. This is normal for large datasets.
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Button */}
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleGeneratePreview}
                  disabled={isLoadingPreview || operationProgress.isActive}
                  size="lg"
                >
                  {isLoadingPreview || operationProgress.isActive ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {operationProgress.currentOperation || 'Generating Preview...'}
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Generate GP51 Preview
                    </>
                  )}
                </Button>
                
                {preview?.success && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {preview.data.summary.vehicles} vehicles, {preview.data.summary.users} users ready
                  </Badge>
                )}
              </div>

              {/* Results Display */}
              {preview && !isLoadingPreview && !operationProgress.isActive && (
                <div className="mt-6">
                  {preview.success ? (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>Preview Generated Successfully!</strong>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Vehicles:</span> {preview.data.summary.vehicles}
                          </div>
                          <div>
                            <span className="font-medium">Users:</span> {preview.data.summary.users}
                          </div>
                          <div>
                            <span className="font-medium">Groups:</span> {preview.data.summary.groups}
                          </div>
                          <div>
                            <span className="font-medium">Est. Duration:</span> {preview.data.estimatedDuration}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Preview Failed:</strong> {preview.connectionStatus.error}
                        {preview.connectionStatus.error?.includes('timeout') && (
                          <div className="mt-2 text-sm">
                            This is common with large datasets. Please wait a few minutes and try again.
                          </div>
                        )}
                        <div className="mt-2 text-sm">
                          <strong>Alternative:</strong> Use the Bulk Import tab above for more reliable importing with CSV files.
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedImportPanel;
