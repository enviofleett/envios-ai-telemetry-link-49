import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  Database, 
  Users, 
  Car, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  RefreshCw,
  Download,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fullSystemImportService, SystemImportOptions, ImportProgress } from '@/services/fullSystemImportService';
import { validateGP51Configuration } from '@/utils/gp51-validator';
import ImportProgressMonitor from '@/components/import/ImportProgressMonitor';

interface FullGP51ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

const FullGP51ImportDialog: React.FC<FullGP51ImportDialogProps> = ({
  open,
  onOpenChange,
  onImportComplete
}) => {
  const [currentStep, setCurrentStep] = useState<'options' | 'validation' | 'confirmation' | 'progress' | 'completed'>('options');
  const [importOptions, setImportOptions] = useState<SystemImportOptions>({
    importType: 'complete_system',
    performCleanup: false,
    preserveAdminEmail: 'chudesyl@gmail.com',
    batchSize: 50
  });
  const [validationResult, setValidationResult] = useState<any>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress[]>([]);
  const [currentProgress, setCurrentProgress] = useState<ImportProgress | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedUsernames, setSelectedUsernames] = useState<string>('');
  const [activeImportId, setActiveImportId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleValidateConfiguration = async () => {
    setCurrentStep('validation');
    
    try {
      console.log('Validating GP51 configuration...');
      const result = await validateGP51Configuration();
      setValidationResult(result);
      
      if (result.isValid) {
        setCurrentStep('confirmation');
        toast({
          title: "Validation Successful",
          description: "GP51 configuration is valid. Ready to proceed with import.",
        });
      } else {
        toast({
          title: "Validation Failed",
          description: result.errors.join(', '),
          variant: "destructive"
        });
        setCurrentStep('options');
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Error",
        description: "Failed to validate GP51 configuration",
        variant: "destructive"
      });
      setCurrentStep('options');
    }
  };

  const handleStartImport = async () => {
    if (currentStep !== 'confirmation') return;

    setCurrentStep('progress');
    setIsImporting(true);

    try {
      const options: SystemImportOptions = {
        ...importOptions,
        selectedUsernames: importOptions.importType === 'selective' 
          ? selectedUsernames.split('\n').filter(u => u.trim())
          : undefined
      };

      console.log('Starting import with options:', options);

      const result = await fullSystemImportService.startFullSystemImport(
        options,
        (progress) => {
          console.log('Progress update:', progress);
          setCurrentProgress(progress);
        }
      );

      setActiveImportId(result.importId);
      setImportResult(result);
      setCurrentStep('completed');
      
      toast({
        title: "Import Completed",
        description: `Successfully imported ${result.successfulUsers} users and ${result.successfulVehicles} vehicles`,
      });

      onImportComplete?.();
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Import Failed",
        description: error.message || "An error occurred during import",
        variant: "destructive"
      });
      
      setCurrentStep('options');
    } finally {
      setIsImporting(false);
    }
  };

  const resetDialog = () => {
    setCurrentStep('options');
    setValidationResult(null);
    setImportProgress([]);
    setCurrentProgress(null);
    setImportResult(null);
    setIsImporting(false);
    setActiveImportId(null);
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 'options':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Import Configuration</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Import Type</Label>
                  <RadioGroup 
                    value={importOptions.importType} 
                    onValueChange={(value) => setImportOptions({...importOptions, importType: value as any})}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="complete_system" id="complete" />
                      <Label htmlFor="complete" className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Complete System Import (Users + Vehicles)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="users_only" id="users" />
                      <Label htmlFor="users" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Users Only
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="vehicles_only" id="vehicles" />
                      <Label htmlFor="vehicles" className="flex items-center gap-2">
                        <Car className="w-4 h-4" />
                        Vehicles Only
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="selective" id="selective" />
                      <Label htmlFor="selective" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Selective Import
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {importOptions.importType === 'selective' && (
                  <div>
                    <Label htmlFor="usernames">Target Usernames (one per line)</Label>
                    <Textarea
                      id="usernames"
                      value={selectedUsernames}
                      onChange={(e) => setSelectedUsernames(e.target.value)}
                      placeholder="username1&#10;username2&#10;username3"
                      className="mt-1"
                      rows={5}
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cleanup"
                      checked={importOptions.performCleanup}
                      onCheckedChange={(checked) => 
                        setImportOptions({...importOptions, performCleanup: checked as boolean})
                      }
                    />
                    <Label htmlFor="cleanup" className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-red-500" />
                      Perform data cleanup before import
                    </Label>
                  </div>
                  
                  {importOptions.performCleanup && (
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-700">
                        <strong>Warning:</strong> This will delete all existing users and vehicles except the preserved admin user.
                        A backup will be created automatically before cleanup.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Label htmlFor="adminEmail">Preserve Admin Email</Label>
                    <Input
                      id="adminEmail"
                      value={importOptions.preserveAdminEmail}
                      onChange={(e) => setImportOptions({...importOptions, preserveAdminEmail: e.target.value})}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="batchSize">Batch Size</Label>
                    <Input
                      id="batchSize"
                      type="number"
                      value={importOptions.batchSize}
                      onChange={(e) => setImportOptions({...importOptions, batchSize: parseInt(e.target.value)})}
                      className="mt-1"
                      min="10"
                      max="200"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleValidateConfiguration}>
                Validate & Continue
              </Button>
            </div>
          </div>
        );

      case 'validation':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Validating Configuration</h3>
              <p className="text-gray-600">Checking GP51 connectivity and system readiness...</p>
            </div>
          </div>
        );

      case 'confirmation':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Confirm Import Configuration
              </h3>
              
              {validationResult && validationResult.warnings.length > 0 && (
                <Alert className="border-orange-200 bg-orange-50 mb-4">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-700">
                    <strong>Warnings:</strong>
                    <ul className="list-disc ml-4 mt-1">
                      {validationResult.warnings.map((warning: string, index: number) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Import Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Import Type:</span>
                    <Badge variant="outline">{importOptions.importType.replace('_', ' ').toUpperCase()}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Cleanup:</span>
                    <Badge variant={importOptions.performCleanup ? "destructive" : "secondary"}>
                      {importOptions.performCleanup ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Preserved Admin:</span>
                    <span className="text-sm font-mono">{importOptions.preserveAdminEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Batch Size:</span>
                    <span>{importOptions.batchSize}</span>
                  </div>
                  {importOptions.importType === 'selective' && (
                    <div className="flex justify-between">
                      <span>Selected Users:</span>
                      <span>{selectedUsernames.split('\n').filter(u => u.trim()).length}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {importOptions.performCleanup && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    <strong>Final Warning:</strong> This operation will permanently delete existing data.
                    Please ensure you have verified the backup and admin preservation settings.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setCurrentStep('options')}>
                Back
              </Button>
              <Button 
                onClick={handleStartImport}
                className="bg-red-600 hover:bg-red-700"
                disabled={isImporting}
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Starting Import...
                  </>
                ) : (
                  'Start Import'
                )}
              </Button>
            </div>
          </div>
        );

      case 'progress':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Import in Progress
              </h3>

              {activeImportId ? (
                <ImportProgressMonitor
                  importId={activeImportId}
                  onComplete={(result) => {
                    setImportResult(result);
                    setCurrentStep('completed');
                  }}
                  onCancel={() => {
                    setCurrentStep('options');
                    setIsImporting(false);
                  }}
                />
              ) : currentProgress && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Current Phase: {currentProgress.phase}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Overall Progress</span>
                        <span>{currentProgress.overallProgress}%</span>
                      </div>
                      <Progress value={currentProgress.overallProgress} className="w-full" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Phase Progress</span>
                        <span>{currentProgress.phaseProgress}%</span>
                      </div>
                      <Progress value={currentProgress.phaseProgress} className="w-full" />
                    </div>

                    <div className="text-sm text-gray-600">
                      <strong>Current Operation:</strong> {currentProgress.currentOperation}
                    </div>

                    {currentProgress.details && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        {currentProgress.details}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      case 'completed':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Import Completed Successfully
              </h3>

              {importResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Import Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <div className="text-2xl font-bold text-blue-600">{importResult.successfulUsers}</div>
                        <div className="text-sm text-blue-700">Users Imported</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded">
                        <div className="text-2xl font-bold text-green-600">{importResult.successfulVehicles}</div>
                        <div className="text-sm text-green-700">Vehicles Imported</div>
                      </div>
                    </div>
                    
                    {importResult.conflicts > 0 && (
                      <div className="text-center p-3 bg-orange-50 rounded">
                        <div className="text-2xl font-bold text-orange-600">{importResult.conflicts}</div>
                        <div className="text-sm text-orange-700">Conflicts Resolved</div>
                      </div>
                    )}

                    <div className="text-sm text-gray-600">
                      <strong>Import ID:</strong> <span className="font-mono">{importResult.importId}</span>
                    </div>
                    
                    {importResult.backupTables.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <strong>Backup Tables:</strong> {importResult.backupTables.length} created
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => {
                resetDialog();
                onOpenChange(false);
              }}>
                Close
              </Button>
              <Button onClick={resetDialog}>
                Start New Import
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {getStepContent()}
      </DialogContent>
    </Dialog>
  );
};

export default FullGP51ImportDialog;
