
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import CSVVehicleImportManager from '@/components/csv/CSVVehicleImportManager';

const CSVImportTab: React.FC = () => {
  return (
    <TabsContent value="csv-import" className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">CSV Vehicle Import</h3>
        <p className="text-sm text-gray-600 mb-4">
          Import vehicle data from CSV files with validation and conflict resolution
        </p>
      </div>
      <CSVVehicleImportManager />
    </TabsContent>
  );
};

export default CSVImportTab;
