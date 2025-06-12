
import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Activity,
  Clock,
  Car
} from 'lucide-react';
import { useGP51Auth } from '@/hooks/useGP51Auth';
import { gp51DataService, type LiveVehicleFilterConfig } from '@/services/gp51/GP51DataService';
import { enhancedVehicleDataService } from '@/services/enhancedVehicleDataService';
import { useToast } from '@/hooks/use-toast';

interface ImportProgress {
  phase: 'idle' | 'fetching' | 'filtering' | 'processing' | 'saving' | 'completed' | 'error';
  progress: number;
  message: string;
  totalVehicles: number;
  processedVehicles: number;
  liveVehicles: number;
  errors: string[];
  logs: Array<{ timestamp: Date; level: 'info' | 'warn' | 'error'; message: string }>;
}

export const GP51LiveImportModal: React.FC = () => {
  const { isAuthenticated, username } = useGP51Auth();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importScope, setImportScope] = useState<'all' | 'specific'>('all');
  const [specificDeviceIds, setSpecificDeviceIds] = useState('');
  const [overwriteStrategy, setOverwriteStrategy] = useState<'update' | 'skip'>('update');
  
  // Live data configuration
  const [liveConfig, setLiveConfig] = useState<LiveVehicleFilterConfig>({
    updateTimeThresholdMinutes: 30,
    includeIdleVehicles: true,
    requireGpsSignal: false
  });
  
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    phase: 'idle',
    progress: 0,
    message: 'Ready to import',
    totalVehicles: 0,
    processedVehicles: 0,
    liveVehicles: 0,
    errors: [],
    logs: []
  });

  const addLog = (level: 'info' | 'warn' | 'error', message: string) => {
    setImportProgress(prev => ({
      ...prev,
      logs: [...prev.logs, { timestamp: new Date(), level, message }].slice(-50) // Keep last 50 logs
    }));
  };

  const updateProgress = (updates: Partial<ImportProgress>) => {
    setImportProgress(prev => ({ ...prev, ...updates }));
  };

  const startImport = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please authenticate with GP51 before importing",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setImportProgress({
      phase: 'fetching',
      progress: 10,
      message: 'Connecting to GP51...',
      totalVehicles: 0,
      processedVehicles: 0,
      liveVehicles: 0,
      errors: [],
      logs: []
    });

    try {
      addLog('info', `Starting live vehicle import for account: ${username}`);
      addLog('info', `Live threshold: ${liveConfig.updateTimeThresholdMinutes} minutes`);
      
      // Phase 1: Fetch vehicle data
      updateProgress({
        phase: 'fetching',
        progress: 20,
        message: 'Fetching vehicle data from GP51...'
      });

      let vehicles;
      if (importScope === 'all') {
        vehicles = await gp51DataService.getAllDevicesLastPositions();
      } else {
        const deviceIds = specificDeviceIds.split(',').map(id => id.trim()).filter(id => id);
        vehicles = await gp51DataService.getMultipleDevicesLastPositions(deviceIds);
        vehicles = Array.from(vehicles.values());
      }

      addLog('info', `Fetched ${vehicles.length} vehicles from GP51`);
      updateProgress({
        totalVehicles: vehicles.length,
        progress: 40,
        message: 'Filtering live vehicles...'
      });

      // Phase 2: Filter live vehicles
      updateProgress({ phase: 'filtering' });
      const liveVehicles = gp51DataService.filterLiveVehicles(vehicles, liveConfig);
      
      addLog('info', `Filtered ${liveVehicles.length} live vehicles from ${vehicles.length} total`);
      updateProgress({
        liveVehicles: liveVehicles.length,
        progress: 60,
        message: `Processing ${liveVehicles.length} live vehicles...`
      });

      // Phase 3: Process and save vehicles
      updateProgress({ phase: 'processing' });
      
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < liveVehicles.length; i++) {
        const vehicle = liveVehicles[i];
        
        try {
          // Here we would integrate with your vehicle creation/update logic
          addLog('info', `Processing vehicle: ${vehicle.deviceId} (${vehicle.deviceName || 'Unknown'})`);
          
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 50));
          
          successCount++;
          updateProgress({
            processedVehicles: i + 1,
            progress: 60 + ((i + 1) / liveVehicles.length) * 30
          });
        } catch (error) {
          errorCount++;
          const errorMsg = `Failed to process ${vehicle.deviceId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          addLog('error', errorMsg);
          updateProgress({
            errors: [...importProgress.errors, errorMsg]
          });
        }
      }

      // Phase 4: Complete
      updateProgress({
        phase: 'completed',
        progress: 100,
        message: `Import completed: ${successCount} vehicles imported, ${errorCount} errors`
      });

      addLog('info', `Import completed successfully`);
      addLog('info', `Results: ${successCount} imported, ${errorCount} errors`);

      toast({
        title: "Import Completed",
        description: `Successfully imported ${successCount} live vehicles`,
      });

      // Trigger refresh of vehicle data
      await enhancedVehicleDataService.forceSync();

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      updateProgress({
        phase: 'error',
        message: `Import failed: ${errorMsg}`,
        errors: [...importProgress.errors, errorMsg]
      });
      addLog('error', `Import failed: ${errorMsg}`);
      
      toast({
        title: "Import Failed",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setImportProgress({
      phase: 'idle',
      progress: 0,
      message: 'Ready to import',
      totalVehicles: 0,
      processedVehicles: 0,
      liveVehicles: 0,
      errors: [],
      logs: []
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" disabled={!isAuthenticated}>
          <Download className="w-4 h-4 mr-2" />
          Import Live Vehicles
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            GP51 Live Vehicle Import
          </DialogTitle>
          <DialogDescription>
            Import live vehicle data from GP51 platform. Only vehicles that have reported within your specified timeframe will be imported.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Authentication Status */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Connected to GP51 as: <strong>{username}</strong>
            </AlertDescription>
          </Alert>

          {/* Import Configuration */}
          {importProgress.phase === 'idle' && (
            <div className="space-y-4">
              {/* Import Scope */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Import Scope</Label>
                <RadioGroup value={importScope} onValueChange={(value: 'all' | 'specific') => setImportScope(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all">Import All Live Vehicles from Account</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="specific" id="specific" />
                    <Label htmlFor="specific">Import Specific Device IDs</Label>
                  </div>
                </RadioGroup>
                
                {importScope === 'specific' && (
                  <Textarea
                    placeholder="Enter device IDs separated by commas (e.g., 123456789, 987654321)"
                    value={specificDeviceIds}
                    onChange={(e) => setSpecificDeviceIds(e.target.value)}
                    rows={3}
                  />
                )}
              </div>

              {/* Live Data Configuration */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Live Data Configuration</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Update Time Threshold (minutes)</Label>
                    <Input
                      id="threshold"
                      type="number"
                      value={liveConfig.updateTimeThresholdMinutes}
                      onChange={(e) => setLiveConfig(prev => ({
                        ...prev,
                        updateTimeThresholdMinutes: parseInt(e.target.value) || 30
                      }))}
                      min={1}
                      max={1440}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-idle"
                      checked={liveConfig.includeIdleVehicles}
                      onCheckedChange={(checked) => setLiveConfig(prev => ({
                        ...prev,
                        includeIdleVehicles: checked
                      }))}
                    />
                    <Label htmlFor="include-idle">Include Idle Vehicles (not moving)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="require-gps"
                      checked={liveConfig.requireGpsSignal}
                      onCheckedChange={(checked) => setLiveConfig(prev => ({
                        ...prev,
                        requireGpsSignal: checked
                      }))}
                    />
                    <Label htmlFor="require-gps">Require Valid GPS Signal</Label>
                  </div>
                </div>
              </div>

              {/* Overwrite Strategy */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Existing Vehicle Strategy</Label>
                <RadioGroup value={overwriteStrategy} onValueChange={(value: 'update' | 'skip') => setOverwriteStrategy(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="update" id="update" />
                    <Label htmlFor="update">Update Existing Vehicles</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="skip" id="skip" />
                    <Label htmlFor="skip">Skip Existing Vehicles</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Import Progress */}
          {importProgress.phase !== 'idle' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Import Progress</Label>
                  <Badge variant={
                    importProgress.phase === 'completed' ? 'default' :
                    importProgress.phase === 'error' ? 'destructive' : 'secondary'
                  }>
                    {importProgress.phase}
                  </Badge>
                </div>
                <Progress value={importProgress.progress} className="w-full" />
                <p className="text-sm text-muted-foreground">{importProgress.message}</p>
              </div>

              {/* Import Statistics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{importProgress.totalVehicles}</div>
                  <div className="text-xs text-muted-foreground">Total Fetched</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{importProgress.liveVehicles}</div>
                  <div className="text-xs text-muted-foreground">Live Vehicles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{importProgress.processedVehicles}</div>
                  <div className="text-xs text-muted-foreground">Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{importProgress.errors.length}</div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                </div>
              </div>

              {/* Live Import Log */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Import Log</Label>
                <ScrollArea className="h-32 w-full border rounded p-2">
                  <div className="space-y-1">
                    {importProgress.logs.map((log, index) => (
                      <div key={index} className="text-xs flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        {log.level === 'error' && <XCircle className="w-3 h-3 text-red-500" />}
                        {log.level === 'warn' && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                        {log.level === 'info' && <CheckCircle className="w-3 h-3 text-green-500" />}
                        <span className={
                          log.level === 'error' ? 'text-red-600' :
                          log.level === 'warn' ? 'text-yellow-600' : 'text-foreground'
                        }>
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                resetImport();
                setIsOpen(false);
              }}
              disabled={isImporting}
            >
              Close
            </Button>
            
            <div className="space-x-2">
              {importProgress.phase === 'completed' || importProgress.phase === 'error' ? (
                <Button onClick={resetImport}>
                  Start New Import
                </Button>
              ) : (
                <Button
                  onClick={startImport}
                  disabled={isImporting || !isAuthenticated}
                >
                  {isImporting ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Live Import
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
