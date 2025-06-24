
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Database
} from 'lucide-react';
import { gp51DataService } from '@/services/gp51/GP51DataService';
import type { GP51DeviceData, GP51ProcessResult } from '@/types/gp51';

interface GP51ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GP51ImportModal: React.FC<GP51ImportModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'preview' | 'importing' | 'complete'>('preview');
  const [previewData, setPreviewData] = useState<GP51DeviceData[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<GP51ProcessResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreviewData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching GP51 live vehicles data...');
      const response = await gp51DataService.getLiveVehicles();
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch live vehicles data');
      }

      // Extract devices array from the response data
      const devices = response.data.devices || [];
      console.log(`✅ Successfully fetched ${devices.length} devices`);
      setPreviewData(devices);
      
    } catch (error) {
      console.error('❌ Error fetching preview data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const startImport = async () => {
    if (!previewData || previewData.length === 0) {
      setError('No data available for import');
      return;
    }

    setStep('importing');
    setImportProgress(0);
    
    try {
      console.log(`🚀 Starting import of ${previewData.length} devices...`);
      
      // Process the preview data with import options
      const results = await gp51DataService.processVehicleData(previewData, {
        importMode: 'full',
        validateData: true
      });
      
      setImportProgress(100);
      setImportResults(results);
      setStep('complete');
      
      console.log(`✅ Import completed: ${results.created} created, ${results.errors} errors`);
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      setError(error instanceof Error ? error.message : 'Import failed');
      setStep('preview');
    }
  };

  const resetModal = () => {
    setStep('preview');
    setPreviewData([]);
    setImportProgress(0);
    setImportResults(null);
    setError(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  React.useEffect(() => {
    if (isOpen && step === 'preview' && previewData.length === 0) {
      fetchPreviewData();
    }
  }, [isOpen, step]);

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Database className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Import Preview</h3>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span>Loading preview data...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{previewData.length}</div>
                <div className="text-sm text-gray-600">Total Devices</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {previewData.slice(0, 10).length}
                </div>
                <div className="text-sm text-gray-600">Preview Items</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">{previewData.length}</div>
                <div className="text-sm text-gray-600">Ready to Import</div>
              </CardContent>
            </Card>
          </div>

          {previewData.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Sample Data ({previewData.some(device => device.deviceName) ? 'Valid' : 'Needs Review'})</h4>
              <div className="max-h-60 overflow-y-auto border rounded-md">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Device ID</th>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Type</th>
                      <th className="p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((device, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2 font-mono text-xs">{device.deviceId}</td>
                        <td className="p-2">{device.deviceName || 'N/A'}</td>
                        <td className="p-2">{device.deviceType || 'Unknown'}</td>
                        <td className="p-2">
                          <Badge variant={device.isActive ? 'default' : 'secondary'}>
                            {device.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={startImport} 
              disabled={previewData.length === 0 || isLoading}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Start Import ({previewData.length} items)
            </Button>
            <Button variant="outline" onClick={fetchPreviewData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </>
      )}
    </div>
  );

  const renderImportingStep = () => (
    <div className="space-y-6 text-center">
      <div className="flex items-center gap-2 justify-center mb-4">
        <Upload className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Importing Data</h3>
      </div>
      
      <div className="space-y-2">
        <Progress value={importProgress} className="w-full" />
        <p className="text-sm text-gray-600">Processing {previewData.length} devices...</p>
      </div>
      
      <div className="flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
        <span>Import in progress...</span>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="flex items-center gap-2 justify-center mb-4">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold">Import Complete</h3>
      </div>

      {importResults && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{importResults.created}</div>
              <div className="text-sm text-gray-600">Successfully Imported</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{importResults.errors}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button onClick={handleClose} className="flex-1">
          <CheckCircle className="h-4 w-4 mr-2" />
          Close
        </Button>
        <Button variant="outline" onClick={resetModal}>
          Import More
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            GP51 Data Import
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6">
          {step === 'preview' && renderPreviewStep()}
          {step === 'importing' && renderImportingStep()}
          {step === 'complete' && renderCompleteStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GP51ImportModal;
