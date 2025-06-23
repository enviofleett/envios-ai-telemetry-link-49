
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, Database } from 'lucide-react';

const SystemImport: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Import</h1>
        <p className="text-gray-600">Import data from external systems and manage data synchronization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Data Import
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Import vehicles, users, and other data from CSV files or external systems.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Data Export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Export system data for backup or migration purposes.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Monitor data synchronization status and manage sync operations.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemImport;
