
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, FileText, Satellite } from 'lucide-react';
import CSVVehicleImportManager from '@/components/csv/CSVVehicleImportManager';
import EnhancedCSVImportManager from '@/components/csv/EnhancedCSVImportManager';
import GP51LiveDataImportManager from '@/components/csv/GP51LiveDataImportManager';

const CSVImportTab: React.FC = () => {
  const [importMode, setImportMode] = useState<'standard' | 'enhanced' | 'gp51-live'>('enhanced');

  return (
    <div className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Data Import Management</h3>
        <p className="text-sm text-gray-600 mb-4">
          Import vehicle and user data from CSV files or directly from GP51 platform
        </p>
      </div>

      {/* Import Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              Import users and vehicles together with GP51 conformity and automatic username generation
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
            importMode === 'gp51-live' 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setImportMode('gp51-live')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Satellite className="w-5 h-5 text-green-600" />
              GP51 Live Import
              <Badge variant="outline" className="bg-green-100 text-green-700">Live Data</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-600">
              Import users and vehicles directly from GP51 platform in real-time
            </p>
            <ul className="text-xs text-gray-500 mt-2 space-y-1">
              <li>• Real-time data synchronization</li>
              <li>• No file upload required</li>
              <li>• Advanced filtering options</li>
              <li>• Live conflict detection</li>
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
      {importMode === 'enhanced' && <EnhancedCSVImportManager />}
      {importMode === 'gp51-live' && <GP51LiveDataImportManager />}
      {importMode === 'standard' && <CSVVehicleImportManager />}
    </div>
  );
};

export default CSVImportTab;
