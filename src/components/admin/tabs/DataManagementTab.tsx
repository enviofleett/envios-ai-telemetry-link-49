
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnhancedBulkImportTab from './EnhancedBulkImportTab';
import { Database, Download, RefreshCw, Shield } from 'lucide-react';

// Safe array helper - prevents "map is not a function" errors
function safeArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  console.warn('Expected array but got:', typeof value, value);
  return [];
}

const DataManagementTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Data Management</h2>
        <p className="text-gray-600">Manage vehicle data import, sync, and backup operations</p>
      </div>

      <Tabs defaultValue="bulk-import" className="space-y-6">
        <TabsList>
          <TabsTrigger value="bulk-import" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Enhanced Bulk Import
          </TabsTrigger>
          <TabsTrigger value="sync-management" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync Management
          </TabsTrigger>
          <TabsTrigger value="backup-restore" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Backup & Restore
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bulk-import">
          <EnhancedBulkImportTab />
        </TabsContent>

        <TabsContent value="sync-management">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Real-time Sync Management
              </CardTitle>
              <CardDescription>
                Configure and monitor ongoing vehicle data synchronization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Real-time sync management features coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup-restore">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Backup & Restore Operations
              </CardTitle>
              <CardDescription>
                Manage data backups and restore operations for safety
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Backup and restore features coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataManagementTab;
