
import React from 'react';
import GP51Settings from '../GP51Settings';
import GP51ConnectionTester from '../GP51ConnectionTester';
import GP51DiagnosticsPanel from '../GP51DiagnosticsPanel';
import GP51DebugPanel from '../GP51DebugPanel';
import GP51HealthIndicator from '../GP51HealthIndicator';
import UnifiedImportPanel from '../UnifiedImportPanel';
import GP51RawDiagnosticPanel from '../GP51RawDiagnosticPanel';
import GP51UserManagement from '../GP51UserManagement';
import GP51HistoricalData from '../GP51HistoricalData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Safe array helper - prevents "map is not a function" errors
function safeArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  console.warn('Expected array but got:', typeof value, value);
  return [];
}

const GP51IntegrationTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <GP51HealthIndicator />
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="historical">Historical Data</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GP51Settings />
            <GP51ConnectionTester />
          </div>
          <GP51DiagnosticsPanel />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <GP51UserManagement />
        </TabsContent>

        <TabsContent value="historical" className="space-y-6">
          <GP51HistoricalData />
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <UnifiedImportPanel />
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-6">
          <GP51RawDiagnosticPanel />
          <GP51DebugPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GP51IntegrationTab;
