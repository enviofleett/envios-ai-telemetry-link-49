
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFullSystemImport } from '@/hooks/useFullSystemImport';
import { Database, AlertTriangle } from 'lucide-react';
import type { SystemImportOptions } from '@/types/system-import';

const SystemImportManager: React.FC = () => {
  const [adminEmail, setAdminEmail] = useState('');
  const { startFullSystemImport, isImporting, progress } = useFullSystemImport();

  const handleStartImport = () => {
    const options: SystemImportOptions = {
      importType: 'complete_system',
      performCleanup: false,
      preserveAdminEmail: adminEmail,
      batchSize: 50,
      // Required properties with defaults
      importUsers: true,
      importDevices: true,
      conflictResolution: 'overwrite'
    };

    startFullSystemImport(options);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Import Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">System Import</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  This will perform a complete system import from GP51, including all users and vehicles.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="adminEmail" className="block text-sm font-medium mb-2">
                Admin Email to Preserve
              </label>
              <input
                id="adminEmail"
                type="email"
                className="w-full p-2 border rounded-md"
                placeholder="admin@company.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
            </div>

            <Button
              onClick={handleStartImport}
              disabled={isImporting || !adminEmail}
              className="w-full"
            >
              {isImporting ? 'Importing...' : 'Start System Import'}
            </Button>

            {progress && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Import Progress</h4>
                <p className="text-sm">{progress.message}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemImportManager;
