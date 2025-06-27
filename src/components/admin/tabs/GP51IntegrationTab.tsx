
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

// Import GP51 components - using conditional imports to avoid errors if components don't exist
const GP51Settings = React.lazy(() => 
  import('../GP51Settings').catch(() => ({ default: () => <div>GP51 Settings component not found</div> }))
);

const GP51ConnectionTester = React.lazy(() => 
  import('../GP51ConnectionTester').catch(() => ({ default: () => <div>GP51 Connection Tester component not found</div> }))
);

const GP51DiagnosticsPanel = React.lazy(() => 
  import('../GP51DiagnosticsPanel').catch(() => ({ default: () => <div>GP51 Diagnostics Panel component not found</div> }))
);

const GP51DebugPanel = React.lazy(() => 
  import('../GP51DebugPanel').catch(() => ({ default: () => <div>GP51 Debug Panel component not found</div> }))
);

const GP51HealthIndicator = React.lazy(() => 
  import('../GP51HealthIndicator').catch(() => ({ default: () => <div>GP51 Health Indicator component not found</div> }))
);

const UnifiedImportPanel = React.lazy(() => 
  import('../UnifiedImportPanel').catch(() => ({ default: () => <div>Unified Import Panel component not found</div> }))
);

const GP51RawDiagnosticPanel = React.lazy(() => 
  import('../GP51RawDiagnosticPanel').catch(() => ({ default: () => <div>GP51 Raw Diagnostic Panel component not found</div> }))
);

const GP51UserManagement = React.lazy(() => 
  import('../GP51UserManagement').catch(() => ({ default: () => <div>GP51 User Management component not found</div> }))
);

const GP51HistoricalData = React.lazy(() => 
  import('../GP51HistoricalData').catch(() => ({ default: () => <div>GP51 Historical Data component not found</div> }))
);

const UnifiedGP51Dashboard = React.lazy(() => 
  import('../UnifiedGP51Dashboard').catch(() => ({ default: () => <div>Unified GP51 Dashboard component not found</div> }))
);

const GP51IntegrationTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>GP51 Fleet Management Integration</strong> - Manage your GP51 device connections, import data, and monitor system health.
        </AlertDescription>
      </Alert>

      <React.Suspense fallback={<div className="flex items-center justify-center p-8">Loading GP51 Health Indicator...</div>}>
        <GP51HealthIndicator />
      </React.Suspense>
      
      <Tabs defaultValue="unified" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="unified">Dashboard</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="historical">Historical Data</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="unified" className="space-y-6">
          <React.Suspense fallback={<div className="flex items-center justify-center p-8">Loading Unified Dashboard...</div>}>
            <UnifiedGP51Dashboard />
          </React.Suspense>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <React.Suspense fallback={<div className="flex items-center justify-center p-4">Loading GP51 Settings...</div>}>
              <GP51Settings />
            </React.Suspense>
            <React.Suspense fallback={<div className="flex items-center justify-center p-4">Loading Connection Tester...</div>}>
              <GP51ConnectionTester />
            </React.Suspense>
          </div>
          <React.Suspense fallback={<div className="flex items-center justify-center p-4">Loading Diagnostics Panel...</div>}>
            <GP51DiagnosticsPanel />
          </React.Suspense>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <React.Suspense fallback={<div className="flex items-center justify-center p-8">Loading User Management...</div>}>
            <GP51UserManagement />
          </React.Suspense>
        </TabsContent>

        <TabsContent value="historical" className="space-y-6">
          <React.Suspense fallback={<div className="flex items-center justify-center p-8">Loading Historical Data...</div>}>
            <GP51HistoricalData />
          </React.Suspense>
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <React.Suspense fallback={<div className="flex items-center justify-center p-8">Loading Import Panel...</div>}>
            <UnifiedImportPanel />
          </React.Suspense>
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-6">
          <React.Suspense fallback={<div className="flex items-center justify-center p-8">Loading Diagnostic Panels...</div>}>
            <GP51RawDiagnosticPanel />
            <GP51DebugPanel />
          </React.Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GP51IntegrationTab;
