
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import EnhancedBulkImportManager from '@/components/admin/EnhancedBulkImportManager';
import { Database, Shield, Zap, Clock } from 'lucide-react';

const EnhancedBulkImportTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-600" />
            <CardTitle>Enhanced Bulk Import System</CardTitle>
          </div>
          <CardDescription>
            Advanced, secure import system for large-scale GP51 vehicle data synchronization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              This system safely imports all 3,822 vehicles from GP51 with automatic backup, 
              progress tracking, and error recovery. Import is processed in chunks to prevent 
              system overload and ensure data integrity.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Zap className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium">Chunked Processing</div>
                <div className="text-sm text-gray-600">50 vehicles per chunk</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">Auto Backup</div>
                <div className="text-sm text-gray-600">Before import starts</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <div className="font-medium">Real-time Progress</div>
                <div className="text-sm text-gray-600">Live status updates</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Manager */}
      <EnhancedBulkImportManager />
    </div>
  );
};

export default EnhancedBulkImportTab;
