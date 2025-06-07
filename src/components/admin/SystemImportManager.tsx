
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
  Settings,
  RefreshCw
} from 'lucide-react';
import { fullSystemImportService } from '@/services/fullSystemImportService';
import { SystemImportOptions } from '@/types/system-import';
import EnhancedImportProgressMonitor from '@/components/import/EnhancedImportProgressMonitor';
import { useToast } from '@/hooks/use-toast';

const SystemImportManager: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [currentImportId, setCurrentImportId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<{
    phase: string;
    percentage: number;
    message: string;
  } | null>(null);
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
      setLastError(null);
      setImportProgress(null);
      
      console.log('🚀 Starting enhanced system import with improved session management');
      
      const result = await fullSystemImportService.startFullSystemImport(
        importOptions,
        (progress) => {
          console.log('📈 Import progress update:', progress);
          setImportProgress(progress);
          setCurrentImportId(fullSystemImportService.getCurrentImportId());
        }
      );

      console.log('✅ Enhanced import completed successfully:', result);
      
      toast({
        title: "Enhanced Import Completed Successfully! 🎉",
        description: `Imported ${result.successfulUsers} users and ${result.successfulVehicles} vehicles with enhanced reliability and session management.`
      });

      // Reset state after successful completion
      setCurrentImportId(null);
      setImportProgress(null);

    } catch (error: any) {
      console.error('❌ Enhanced import failed:', error);
      
      // Set detailed error information
      setLastError(error.message || 'An unexpected error occurred during import');
      
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
    }
  };

  const handleImportComplete = (result: any) => {
    console.log('✅ Enhanced import monitoring completed:', result);
    setIsImporting(false);
    setCurrentImportId(null);
    setImportProgress(null);
    setLastError(null);
    
    toast({
      title: "Enhanced Import Completed! 🚀",
      description: `Successfully imported data with enhanced reliability and session management features.`
    });
  };

  const handleCancelImport = async () => {
    if (currentImportId) {
      try {
        await fullSystemImportService.cancelImport(currentImportId);
        toast({
          title: "Import Cancelled",
          description: "The import has been safely cancelled and cleaned up."
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
    setImportProgress(null);
    setLastError(null);
  };

  const clearError = () => {
    setLastError(null);
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

  // Show progress monitor if importing
  if (isImporting) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Enhanced Import in Progress
          </h2>
          <p className="text-gray-600">Monitoring import with enhanced session management and error recovery</p>
        </div>
        
        {/* Progress Display */}
        {importProgress && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="font-semibold text-blue-800">
                      {importProgress.phase.charAt(0).toUpperCase() + importProgress.phase.slice(1)}
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {importProgress.percentage >= 0 ? `${importProgress.percentage}%` : 'Processing...'}
                  </Badge>
                </div>
                <p className="text-blue-700">{importProgress.message}</p>
                {importProgress.percentage >= 0 && (
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress.percentage}%` }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Cancel Button */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={handleCancelImport}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Cancel Import
          </Button>
        </div>
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
          Comprehensive data import with enhanced session management, transaction safety, and automatic error recovery
        </p>
      </div>

      {/* Error Display */}
      {lastError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex justify-between items-center">
            <span>{lastError}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              Clear
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
                <span>Enhanced GP51 session management with auto-refresh</span>
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
                <span>Advanced error handling with recovery suggestions</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-green-600" />
                <span>Session validation and automatic token refresh</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                <span>Uses existing valid sessions (like your Octopus session)</span>
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
                    onChange={(e) => setImportOptions(prev => ({ ...prev, performCleanup: e.target.checked }))}
                  />
                  <span className="text-sm">Perform data cleanup before import</span>
                </label>
                <p className="text-xs text-gray-600 ml-6">
                  This will safely remove existing data while preserving the admin account
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Preserve Admin Email:</label>
                <input
                  type="email"
                  value={importOptions.preserveAdminEmail}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, preserveAdminEmail: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="admin@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Batch Size:</label>
                <select
                  value={importOptions.batchSize}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value={5}>5 (Safer, Slower)</option>
                  <option value={10}>10 (Recommended)</option>
                  <option value={20}>20 (Faster, Higher Risk)</option>
                </select>
              </div>
            </div>
          )}

          {/* Start Import Button */}
          <Button
            onClick={handleStartImport}
            disabled={isImporting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            size="lg"
          >
            {isImporting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Starting Enhanced Import...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Start Enhanced Import
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Ready for Enhanced Import</p>
              <p>
                This enhanced version uses your existing valid GP51 session (Octopus, expires June 8) 
                and includes advanced session management to prevent authentication failures.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemImportManager;
