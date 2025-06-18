import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Car,
  Users
} from 'lucide-react';
import { vehicleImportService } from '@/services/gp51/vehicleImportService';
import { useToast } from '@/hooks/use-toast';

interface GP51VehicleImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

const GP51VehicleImportModal: React.FC<GP51VehicleImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<any>(null);
  const { toast } = useToast();

  const handleImport = async () => {
    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await vehicleImportService.importVehiclesFromGP51();
      
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult(result);

      if (result.success) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${result.imported} vehicles from GP51`,
        });
        
        // Delay before calling onImportComplete to show results
        setTimeout(() => {
          onImportComplete();
        }, 2000);
      } else {
        toast({
          title: "Import Failed",
          description: `Import failed with ${result.errors.length} errors`,
          variant: "destructive"
        });
      }
    } catch (error) {
      setImportProgress(100);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setImportResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: [errorMessage],
        vehicles: []
      });
      
      toast({
        title: "Import Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setImportResult(null);
      setImportProgress(0);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import Vehicles from GP51
          </DialogTitle>
          <DialogDescription>
            Import all available vehicles from your GP51 account into the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Import Process */}
          {!importResult && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">What will be imported:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• All vehicles from your GP51 account</li>
                  <li>• Device assignments to users</li>
                  <li>• Vehicle metadata and configuration</li>
                  <li>• User accounts for GP51 usernames (if needed)</li>
                </ul>
              </div>

              {isImporting && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 animate-bounce" />
                    <span className="text-sm font-medium">Importing vehicles...</span>
                  </div>
                  <Progress value={importProgress} className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    {importProgress < 30 ? 'Fetching data from GP51...' :
                     importProgress < 70 ? 'Processing vehicle data...' :
                     importProgress < 90 ? 'Saving to database...' : 'Finalizing import...'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="space-y-4">
              {importResult.success ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Import completed successfully!
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    Import completed with errors. Please review the details below.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Car className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Imported</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                </div>
                
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Skipped</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">{importResult.skipped}</div>
                </div>
                
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Errors</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">{importResult.errors.length}</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-800">Errors:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResult.errors.map((error: string, index: number) => (
                      <div key={index} className="text-xs text-red-700 bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose} disabled={isImporting}>
              {importResult ? 'Close' : 'Cancel'}
            </Button>
            {!importResult && (
              <Button onClick={handleImport} disabled={isImporting}>
                <Download className="h-4 w-4 mr-2" />
                {isImporting ? 'Importing...' : 'Start Import'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GP51VehicleImportModal;
