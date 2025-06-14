import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GP51AuthenticationPanel } from '@/components/admin/GP51AuthenticationPanel';
import GP51ImportModal from '@/components/admin/GP51ImportModal';
import GP51Settings from '@/components/admin/GP51Settings';
import GP51ConnectionTester from '@/components/admin/GP51ConnectionTester';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Shield, Activity, Settings, Zap, Download } from 'lucide-react';

// Define SystemImportOptions type or import it if it exists elsewhere
interface SystemImportOptions {
  importType: 'devices' | 'geofences' | 'all'; // Example types, adjust as needed
  conflictResolution: 'update' | 'skip';
  importAll: boolean;
  selectedDevices: string[];
}


const GP51IntegrationTab: React.FC = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  // Ensure importOptions matches SystemImportOptions, including importType
  const [importOptions, setImportOptions] = useState<SystemImportOptions>({
    importType: 'devices', // Added missing importType
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

  // This function now uses the component's state for options,
  // if the modal's onConfirm doesn't pass options back directly.
  // Or, if modal passes options, this signature is fine: (options: SystemImportOptions)
  const handleConfirmImport = (confirmedOptions: SystemImportOptions) => {
    console.log('Import confirmed with options:', confirmedOptions);
    // Potentially use confirmedOptions if the modal passes them,
    // otherwise, use `importOptions` from this component's state.
    setIsImportModalOpen(false);
    // Add actual import logic here, e.g., startSystemImport(confirmedOptions)
  };
  
  // Example function you might call (adjust as per your actual import logic)
  const startSystemImport = (options: SystemImportOptions) => {
    console.log("Starting system import with options:", options);
    // Actual import logic call
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Complete Vehicle Data Import
                  </CardTitle>
                  <CardDescription>
                    Import all available vehicles from your GP51 account. This comprehensive import includes online, offline, and inactive vehicles.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• <strong>Complete fleet import</strong> - fetches all vehicles regardless of current status</p>
                    <p>• <strong>Flexible scope options</strong> - import all vehicles or specify particular devices</p>
                    <p>• <strong>Batch processing</strong> with progress tracking and comprehensive error handling</p>
                    <p>• <strong>Smart conflict resolution</strong> - choose to update existing vehicles or skip duplicates</p>
                    <p>• <strong>Status classification</strong> - vehicles are categorized as online, offline, or inactive</p>
                  </div>
                  
                  <Button onClick={handleOpenImportModal} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Start Vehicle Import
                  </Button>
                </CardContent>
              </Card>
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
        // Assuming GP51ImportModal's onConfirm prop expects (options: SystemImportOptions) => void
        // If it expects () => void, then it should be:
        // onConfirm={() => handleConfirmImport(importOptions)}
        // For now, assuming it passes options from its internal state upon confirmation:
        onConfirm={handleConfirmImport} 
        options={importOptions} // Pass the initial/current options to the modal
      />
    </div>
  );
};

export default GP51IntegrationTab;
