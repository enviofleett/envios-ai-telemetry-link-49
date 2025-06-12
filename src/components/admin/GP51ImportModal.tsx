
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Play,
  Square,
  RefreshCw,
  Car
} from 'lucide-react';
import { GP51ApiService } from '@/services/vehicleData/gp51ApiService';
import { gp51VehiclePersistenceService, VehiclePersistenceOptions } from '@/services/gp51VehiclePersistenceService';
import { GP51DataService } from '@/services/gp51/GP51DataService';

interface ImportProgress {
  phase: 'idle' | 'fetching' | 'processing' | 'completed' | 'error';
  totalVehicles: number;
  processedVehicles: number;
  successfulImports: number;
  skippedVehicles: number;
  errors: number;
  currentOperation: string;
  logs: string[];
}

interface ImportOptions {
  importScope: 'all' | 'specific';
  specificDeviceIds: string[];
  overwriteStrategy: 'update' | 'skip';
  batchSize: number;
}

export const GP51ImportModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    importScope: 'all',
    specificDeviceIds: [],
    overwriteStrategy: 'update',
    batchSize: 50
  });
  const [deviceIdsInput, setDeviceIdsInput] = useState('');
  const [progress, setProgress] = useState<ImportProgress>({
    phase: 'idle',
    totalVehicles: 0,
    processedVehicles: 0,
    successfulImports: 0,
    skippedVehicles: 0,
    errors: 0,
    currentOperation: '',
    logs: []
  });
  const { toast } = useToast();

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setProgress(prev => ({
      ...prev,
      logs: [...prev.logs, logMessage]
    }));
    console.log(`[GP51Import] ${logMessage}`);
  };

  const updateProgress = (updates: Partial<ImportProgress>) => {
    setProgress(prev => ({ ...prev, ...updates }));
  };

  const handleDeviceIdsChange = (value: string) => {
    setDeviceIdsInput(value);
    const deviceIds = value
      .split(/[,\n]/)
      .map(id => id.trim())
      .filter(id => id.length > 0);
    
    setImportOptions(prev => ({
      ...prev,
      specificDeviceIds: deviceIds
    }));
  };

  const startCompleteImport = async () => {
    if (isImporting) return;

    setIsImporting(true);
    updateProgress({
      phase: 'fetching',
      totalVehicles: 0,
      processedVehicles: 0,
      successfulImports: 0,
      skippedVehicles: 0,
      errors: 0,
      currentOperation: 'Initializing import...',
      logs: []
    });

    try {
      addLog('Starting comprehensive GP51 vehicle import...', 'info');
      addLog(`Import scope: ${importOptions.importScope === 'all' ? 'All vehicles from account' : `${importOptions.specificDeviceIds.length} specific devices`}`, 'info');
      addLog(`Overwrite strategy: ${importOptions.overwriteStrategy}`, 'info');

      // Phase 1: Fetch vehicle data from GP51
      updateProgress({ currentOperation: 'Fetching vehicle data from GP51...' });
      
      let vehicles;
      if (importOptions.importScope === 'all') {
        // Fetch all vehicles using the GP51 API service
        addLog('Fetching all vehicles from GP51 account...', 'info');
        const gp51Vehicles = await GP51ApiService.fetchVehicleList();
        addLog(`Found ${gp51Vehicles.length} vehicles in GP51 account`, 'success');

        // Get positions for all vehicles
        const deviceIds = gp51Vehicles.map(v => v.deviceid);
        const positions = await GP51ApiService.fetchPositions(deviceIds);
        addLog(`Retrieved position data for ${positions.length} vehicles`, 'success');

        // Process all vehicles using GP51DataService
        const gp51DataService = new GP51DataService();
        vehicles = await gp51DataService.processVehicleData(gp51Vehicles, positions);
      } else {
        // Fetch specific devices
        addLog(`Fetching data for ${importOptions.specificDeviceIds.length} specific devices...`, 'info');
        const positions = await GP51ApiService.fetchPositions(importOptions.specificDeviceIds);
        addLog(`Retrieved position data for ${positions.length} specified vehicles`, 'success');

        // Process specific vehicles
        const gp51DataService = new GP51DataService();
        const vehicleList = importOptions.specificDeviceIds.map(deviceid => ({
          deviceid,
          devicename: deviceid, // Will be updated from position data if available
          groupname: '',
          status: ''
        }));
        vehicles = await gp51DataService.processVehicleData(vehicleList, positions);
      }

      updateProgress({ 
        phase: 'processing',
        totalVehicles: vehicles.length,
        currentOperation: 'Processing and saving vehicles to database...'
      });

      addLog(`Processing ${vehicles.length} vehicles for database import...`, 'info');

      // Phase 2: Save to database with progress tracking
      const persistenceOptions: VehiclePersistenceOptions = {
        overwriteStrategy: importOptions.overwriteStrategy,
        batchSize: importOptions.batchSize
      };

      const onProgressUpdate = (processed: number, total: number, result: any) => {
        updateProgress({
          processedVehicles: processed,
          successfulImports: progress.successfulImports + (result.success ? 1 : 0),
          errors: progress.errors + (result.success ? 0 : 1),
          currentOperation: `Processing vehicle ${processed}/${total}: ${result.deviceId}`
        });

        if (result.success) {
          addLog(`✓ ${result.action} vehicle: ${result.deviceId}`, 'success');
        } else {
          addLog(`✗ Failed to process vehicle ${result.deviceId}: ${result.error}`, 'error');
        }
      };

      const results = await gp51VehiclePersistenceService.saveVehiclesToSupabase(
        vehicles,
        persistenceOptions,
        onProgressUpdate
      );

      // Phase 3: Generate completion report
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const created = results.filter(r => r.action === 'created').length;
      const updated = results.filter(r => r.action === 'updated').length;
      const skipped = results.filter(r => r.action === 'skipped').length;

      updateProgress({
        phase: 'completed',
        successfulImports: successful,
        errors: failed,
        skippedVehicles: skipped,
        currentOperation: 'Import completed successfully!'
      });

      addLog('=== IMPORT COMPLETED ===', 'success');
      addLog(`Total vehicles processed: ${vehicles.length}`, 'info');
      addLog(`Successfully imported: ${successful}`, 'success');
      addLog(`- Created: ${created}`, 'info');
      addLog(`- Updated: ${updated}`, 'info');
      addLog(`- Skipped: ${skipped}`, 'info');
      addLog(`Failed: ${failed}`, failed > 0 ? 'error' : 'info');

      toast({
        title: "Import Completed",
        description: `Successfully processed ${successful}/${vehicles.length} vehicles`,
      });

    } catch (error) {
      console.error('Import failed:', error);
      updateProgress({
        phase: 'error',
        currentOperation: 'Import failed'
      });
      addLog(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setProgress({
      phase: 'idle',
      totalVehicles: 0,
      processedVehicles: 0,
      successfulImports: 0,
      skippedVehicles: 0,
      errors: 0,
      currentOperation: '',
      logs: []
    });
  };

  const getProgressPercentage = () => {
    if (progress.totalVehicles === 0) return 0;
    return Math.round((progress.processedVehicles / progress.totalVehicles) * 100);
  };

  const getPhaseIcon = () => {
    switch (progress.phase) {
      case 'fetching':
      case 'processing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Car className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Start Complete Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Complete GP51 Vehicle Import
          </DialogTitle>
          <DialogDescription>
            Import all available vehicles from your GP51 account. This includes online, offline, and inactive vehicles.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="configuration" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="progress">Import Progress</TabsTrigger>
            <TabsTrigger value="logs">Import Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="configuration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Import Scope</Label>
                  <div className="flex gap-4">
                    <Button
                      variant={importOptions.importScope === 'all' ? 'default' : 'outline'}
                      onClick={() => setImportOptions(prev => ({ ...prev, importScope: 'all' }))}
                      disabled={isImporting}
                    >
                      Import All Vehicles
                    </Button>
                    <Button
                      variant={importOptions.importScope === 'specific' ? 'default' : 'outline'}
                      onClick={() => setImportOptions(prev => ({ ...prev, importScope: 'specific' }))}
                      disabled={isImporting}
                    >
                      Import Specific Devices
                    </Button>
                  </div>
                </div>

                {importOptions.importScope === 'specific' && (
                  <div className="space-y-2">
                    <Label htmlFor="deviceIds">Device IDs (comma or newline separated)</Label>
                    <Textarea
                      id="deviceIds"
                      value={deviceIdsInput}
                      onChange={(e) => handleDeviceIdsChange(e.target.value)}
                      placeholder="Enter device IDs, separated by commas or new lines..."
                      rows={4}
                      disabled={isImporting}
                    />
                    {importOptions.specificDeviceIds.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {importOptions.specificDeviceIds.length} device(s) specified
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Existing Vehicle Handling</Label>
                  <div className="flex gap-4">
                    <Button
                      variant={importOptions.overwriteStrategy === 'update' ? 'default' : 'outline'}
                      onClick={() => setImportOptions(prev => ({ ...prev, overwriteStrategy: 'update' }))}
                      disabled={isImporting}
                    >
                      Update Existing
                    </Button>
                    <Button
                      variant={importOptions.overwriteStrategy === 'skip' ? 'default' : 'outline'}
                      onClick={() => setImportOptions(prev => ({ ...prev, overwriteStrategy: 'skip' }))}
                      disabled={isImporting}
                    >
                      Skip Existing
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batchSize">Batch Size</Label>
                  <Input
                    id="batchSize"
                    type="number"
                    value={importOptions.batchSize}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, batchSize: parseInt(e.target.value) || 50 }))}
                    min="1"
                    max="100"
                    disabled={isImporting}
                  />
                  <p className="text-sm text-muted-foreground">
                    Process vehicles in batches of this size for better performance
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button 
                onClick={startCompleteImport}
                disabled={isImporting || (importOptions.importScope === 'specific' && importOptions.specificDeviceIds.length === 0)}
                className="flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Complete Import
                  </>
                )}
              </Button>
              
              {progress.phase !== 'idle' && (
                <Button
                  variant="outline"
                  onClick={resetImport}
                  disabled={isImporting}
                >
                  Reset
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getPhaseIcon()}
                  Import Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {progress.phase !== 'idle' && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Current Operation</span>
                        <Badge variant={progress.phase === 'error' ? 'destructive' : 'default'}>
                          {progress.phase}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{progress.currentOperation}</p>
                    </div>

                    {progress.totalVehicles > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{progress.processedVehicles} / {progress.totalVehicles}</span>
                        </div>
                        <Progress value={getProgressPercentage()} className="w-full" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{progress.totalVehicles}</div>
                        <div className="text-sm text-blue-800">Total Fetched</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{progress.successfulImports}</div>
                        <div className="text-sm text-green-800">Successfully Processed</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{progress.skippedVehicles}</div>
                        <div className="text-sm text-orange-800">Skipped</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{progress.errors}</div>
                        <div className="text-sm text-red-800">Errors</div>
                      </div>
                    </div>
                  </>
                )}

                {progress.phase === 'idle' && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Configure your import settings and click "Start Complete Import" to begin.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {progress.logs.length > 0 ? (
                    <div className="space-y-1">
                      {progress.logs.map((log, index) => (
                        <div key={index} className="text-sm font-mono text-gray-700">
                          {log}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No logs available. Start an import to see progress logs.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
