
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, FileText } from 'lucide-react';
import CSVVehicleImportManager from '@/components/csv/CSVVehicleImportManager';
import EnhancedCSVImportManager from '@/components/csv/EnhancedCSVImportManager';

const CSVImportTab: React.FC = () => {
  const [importMode, setImportMode] = useState<'standard' | 'enhanced'>('enhanced');

  return (
    <div className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">CSV Import Management</h3>
        <p className="text-sm text-gray-600 mb-4">
          Import vehicle and user data from CSV files with validation and conflict resolution
        </p>
      </div>

      {/* Import Mode Selection */}
      <div className="flex gap-4 mb-6">
        <Card 
          className={`cursor-pointer transition-all ${
            importMode === 'enhanced' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setImportMode('enhanced')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Enhanced Import
              <Badge variant="secondary">Recommended</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-600">
              Import users and vehicles together with GP51 conformity, automatic username generation, and real-time synchronization
            </p>
            <ul className="text-xs text-gray-500 mt-2 space-y-1">
              <li>• User-vehicle relationship mapping</li>
              <li>• GP51 username auto-generation</li>
              <li>• Device type validation & mapping</li>
              <li>• Real-time conflict resolution</li>
            </ul>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${
            importMode === 'standard' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setImportMode('standard')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              Standard Import
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-600">
              Import vehicles only with basic validation and assignment to existing users
            </p>
            <ul className="text-xs text-gray-500 mt-2 space-y-1">
              <li>• Vehicle data import only</li>
              <li>• Basic validation rules</li>
              <li>• Manual user assignment</li>
              <li>• Simple conflict detection</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Render appropriate import manager */}
      {importMode === 'enhanced' ? (
        <EnhancedCSVImportManager />
      ) : (
        <CSVVehicleImportManager />
      )}
    </div>
  );
};

export default CSVImportTab;
