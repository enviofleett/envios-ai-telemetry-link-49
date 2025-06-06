
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Users,
  Car,
  Settings
} from 'lucide-react';
import { fullSystemImportService } from '@/services/fullSystemImportService';
import { SystemImportOptions } from '@/types/system-import';
import EnhancedImportProgressMonitor from '@/components/import/EnhancedImportProgressMonitor';
import { useToast } from '@/hooks/use-toast';

const SystemImportManager: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [currentImportId, setCurrentImportId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [importOptions, setImportOptions] = useState<SystemImportOptions>({
    importType: 'complete_system',
    performCleanup: false,
    preserveAdminEmail: 'chudesyl@gmail.com',
    batchSize: 10
  });

  const { toast } = useToast();

  const handleStartImport = async () => {
    if (!importOptions.importType) {
      toast({
        title: "Configuration Required",
        description: "Please select an import type before starting.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsImporting(true);
      
      console.log('Starting enhanced system import with options:', importOptions);
      
      const result = await fullSystemImportService.startFullSystemImport(
        importOptions,
        (progress) => {
          console.log('Import progress update:', progress);
          // Progress updates are handled by the enhanced monitor component
        }
      );

      // This will only execute if the import completes successfully
      console.log('Enhanced import completed:', result);
      
      toast({
        title: "Import Completed Successfully",
        description: `Imported ${result.successfulUsers} users and ${result.successfulVehicles} vehicles with enhanced reliability.`
      });

    } catch (error: any) {
      console.error('Enhanced import failed:', error);
      
      // Get detailed error information
      const errorSummary = fullSystemImportService.getErrorSummary();
      const hasCriticalErrors = fullSystemImportService.hasCriticalErrors();
      
      toast({
        title: hasCriticalErrors ? "Critical Import Failure" : "Import Failed",
        description: errorSummary || error.message,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      setCurrentImportId(null);
    }
  };

  const handleImportComplete = (result: any) => {
    console.log('Enhanced import monitoring completed:', result);
    setIsImporting(false);
    setCurrentImportId(null);
    
    toast({
      title: "Enhanced Import Completed",
      description: `Successfully imported data with ${result.data_integrity_score || 100}% integrity score.`
    });
  };

  const handleCancelImport = async () => {
    if (currentImportId) {
      try {
        await fullSystemImportService.cancelImport(currentImportId);
        toast({
          title: "Import Cancelled",
          description: "The import has been safely cancelled and rolled back."
        });
      } catch (error: any) {
        toast({
          title: "Cancellation Failed",
          description: error.message,
          variant: "destructive"
        });
      }
    }
    setIsImporting(false);
    setCurrentImportId(null);
  };

  const getImportTypeDescription = (type: string) => {
    const descriptions = {
      'complete_system': 'Import all users, vehicles, and associated data from GP51',
      'users_only': 'Import only GP51 users and authentication data',
      'vehicles_only': 'Import only GP51 vehicles and device data',
      'selective': 'Import only selected users and their associated data'
    };
    return descriptions[type] || 'Unknown import type';
  };

  const getImportTypeIcon = (type: string) => {
    const icons = {
      'complete_system': <Database className="w-5 h-5" />,
      'users_only': <Users className="w-5 h-5" />,
      'vehicles_only': <Car className="w-5 h-5" />,
      'selective': <Settings className="w-5 h-5" />
    };
    return icons[type] || <Database className="w-5 h-5" />;
  };

  if (isImporting && currentImportId) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Enhanced Import in Progress</h2>
          <p className="text-gray-600">Monitoring import with real-time progress tracking and error recovery</p>
        </div>
        
        <EnhancedImportProgressMonitor
          importId={currentImportId}
          onComplete={handleImportComplete}
          onCancel={handleCancelImport}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          Enhanced GP51 System Import
        </h2>
        <p className="text-gray-600">
          Comprehensive data import with transaction safety, real-time monitoring, and automatic error recovery
        </p>
      </div>

      {/* Enhanced Features */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Enhanced Reliability Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Transaction-safe operations with automatic rollback</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-green-600" />
                <span>Comprehensive system backup before import</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Real-time progress monitoring and phase tracking</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-green-600" />
                <span>Enhanced error handling with recovery suggestions</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-green-600" />
                <span>GP51 session management with auto-refresh</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                <span>Data integrity verification and scoring</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Import Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['complete_system', 'users_only', 'vehicles_only', 'selective'] as const).map((type) => (
              <div
                key={type}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  importOptions.importType === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setImportOptions(prev => ({ ...prev, importType: type }))}
              >
                <div className="flex items-center gap-3 mb-2">
                  {getImportTypeIcon(type)}
                  <span className="font-medium capitalize">
                    {type.replace('_', ' ')}
                  </span>
                  {importOptions.importType === type && (
                    <Badge variant="secondary">Selected</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {getImportTypeDescription(type)}
                </p>
              </div>
            ))}
          </div>

          {/* Advanced Options Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </Button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={importOptions.performCleanup}
                    onChange={(e) => setImportOptions(prev => ({ 
                      ...prev, 
                      performCleanup: e.target.checked 
                    }))}
                  />
                  <span className="text-sm font-medium">Perform data cleanup before import</span>
                </label>
                <p className="text-xs text-gray-600 ml-6">
                  Remove existing data before import (admin user will be preserved)
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Preserve Admin Email:</label>
                <input
                  type="email"
                  value={importOptions.preserveAdminEmail}
                  onChange={(e) => setImportOptions(prev => ({ 
                    ...prev, 
                    preserveAdminEmail: e.target.value 
                  }))}
                  className="w-full p-2 border rounded text-sm"
                  placeholder="admin@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Batch Size:</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={importOptions.batchSize}
                  onChange={(e) => setImportOptions(prev => ({ 
                    ...prev, 
                    batchSize: parseInt(e.target.value) || 10 
                  }))}
                  className="w-full p-2 border rounded text-sm"
                />
                <p className="text-xs text-gray-600">
                  Number of records to process in each batch (1-100)
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning for cleanup */}
      {importOptions.performCleanup && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> Data cleanup will remove existing users and vehicles from the system.
            Only the admin user ({importOptions.preserveAdminEmail}) will be preserved.
            A complete backup will be created before any operations.
          </AlertDescription>
        </Alert>
      )}

      {/* Start Import Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleStartImport}
          disabled={isImporting || !importOptions.importType}
          size="lg"
          className="px-8"
        >
          <Database className="w-5 h-5 mr-2" />
          Start Enhanced Import
        </Button>
      </div>
    </div>
  );
};

export default SystemImportManager;
