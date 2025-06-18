
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GP51AuthenticationPanel } from '@/components/admin/GP51AuthenticationPanel';
import GP51ImportModal from '@/components/admin/GP51ImportModal';
import GP51Settings from '@/components/admin/GP51Settings';
import GP51ConnectionTester from '@/components/admin/GP51ConnectionTester';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Activity, Settings, Zap, Download, RefreshCw } from 'lucide-react';
import { vehicleImportService } from '@/services/gp51/vehicleImportService';
import { useToast } from '@/hooks/use-toast';

// Define SystemImportOptions type or import it if it exists elsewhere
interface SystemImportOptions {
  importType: "users_only" | "vehicles_only" | "complete_system" | "selective";
  conflictResolution: 'update' | 'skip';
  importAll: boolean;
  selectedDevices: string[];
}

const GP51IntegrationTab: React.FC = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isQuickSyncing, setIsQuickSyncing] = useState(false);
  const [isFullSyncing, setIsFullSyncing] = useState(false);
  const { toast } = useToast();
  
  const [importOptions, setImportOptions] = useState<SystemImportOptions>({
    importType: 'vehicles_only',
    conflictResolution: 'update' as const,
    importAll: true,
    selectedDevices: [] as string[]
  });

  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
  };

  const handleConfirmImport = (confirmedOptions: SystemImportOptions) => {
    console.log('Import confirmed with options:', confirmedOptions);
    setIsImportModalOpen(false);
    startSystemImport(confirmedOptions);
  };
  
  const startSystemImport = (options: SystemImportOptions) => {
    console.log("Starting system import with options:", options);
    // Actual import logic call
  };

  const handleQuickSync = async () => {
    setIsQuickSyncing(true);
    try {
      console.log('🔄 Starting Quick Sync (Batched Update)...');
      const result = await vehicleImportService.importFromGP51(false);
      
      toast({
        title: "Quick Sync Completed",
        description: `${result.message}. Updated ${result.statistics.devicesUpdated} vehicles.`,
      });
    } catch (error) {
      console.error('❌ Quick sync failed:', error);
      toast({
        title: "Quick Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsQuickSyncing(false);
    }
  };

  const handleForceFullSync = async () => {
    setIsFullSyncing(true);
    try {
      console.log('🔄 Starting Force Full Sync...');
      const result = await vehicleImportService.forceFullSyncFromGP51();
      
      toast({
        title: "Full Sync Completed", 
        description: `${result.message}. Processed ${result.statistics.totalDevicesProcessed} devices.`,
      });
    } catch (error) {
      console.error('❌ Full sync failed:', error);
      toast({
        title: "Full Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsFullSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            GP51 Integration Management
          </CardTitle>
          <CardDescription>
            Secure authentication and management for GP51 telemetry service integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="authentication" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="authentication" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Authentication
              </TabsTrigger>
              <TabsTrigger value="connection" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Connection Test
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Vehicle Import
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="legacy" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Legacy
              </TabsTrigger>
            </TabsList>

            <TabsContent value="authentication" className="space-y-4">
              <GP51AuthenticationPanel />
            </TabsContent>

            <TabsContent value="connection" className="space-y-4">
              <GP51ConnectionTester />
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
              <div className="space-y-4">
                {/* Enhanced Quick Sync */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5" />
                      Quick Sync (Recommended)
                    </CardTitle>
                    <CardDescription>
                      Fast, efficient updates for existing vehicles using intelligent batching. Only updates position data for known devices.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <Activity className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Batched Strategy:</strong> Splits device requests into small batches for reliable, fast updates.
                        Perfect for regular sync operations.
                      </AlertDescription>
                    </Alert>
                    
                    <Button 
                      onClick={handleQuickSync} 
                      disabled={isQuickSyncing || isFullSyncing}
                      className="w-full"
                    >
                      {isQuickSyncing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Quick Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Start Quick Sync
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Enhanced Full Sync */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Force Full Sync (Initial Setup)
                    </CardTitle>
                    <CardDescription>
                      Complete vehicle discovery and import. Use for initial setup or when you need to discover new devices.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <Download className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Full Discovery:</strong> Fetches ALL devices from GP51 and imports new ones. 
                        This may take 2-3 minutes but uses advanced timeout handling and retry logic.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>• <strong>Complete fleet discovery</strong> - finds all devices regardless of current status</p>
                      <p>• <strong>New device import</strong> - adds devices not currently in your system</p>
                      <p>• <strong>Enhanced timeout handling</strong> - robust retry mechanism with extended timeouts</p>
                      <p>• <strong>Smart conflict resolution</strong> - updates existing vehicles, adds new ones</p>
                    </div>
                    
                    <Button 
                      onClick={handleForceFullSync} 
                      disabled={isQuickSyncing || isFullSyncing}
                      variant="outline" 
                      className="w-full"
                    >
                      {isFullSyncing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Full Syncing...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Force Full Sync
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Legacy Complete Import */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Legacy Complete Import (Advanced)
                    </CardTitle>
                    <CardDescription>
                      Advanced import with granular options. For users with specific import requirements.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>• <strong>Selective import options</strong> - choose specific import types</p>
                      <p>• <strong>Advanced conflict resolution</strong> - fine-tune how duplicates are handled</p>
                      <p>• <strong>Device selection</strong> - import specific devices only</p>
                    </div>
                    
                    <Button onClick={handleOpenImportModal} variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Open Advanced Import
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>Advanced GP51 settings and configuration options will be available here.</p>
                <p className="text-sm mt-2">Features coming soon: Rate limiting, polling intervals, data sync settings</p>
              </div>
            </TabsContent>

            <TabsContent value="legacy" className="space-y-4">
              <GP51Settings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <GP51ImportModal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        onConfirm={() => handleConfirmImport(importOptions)} 
        options={importOptions}
      />
    </div>
  );
};

export default GP51IntegrationTab;
