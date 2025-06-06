
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Users, 
  Car, 
  Settings, 
  Shield,
  Plus,
  RefreshCw
} from 'lucide-react';
import FullGP51ImportDialog from './FullGP51ImportDialog';
import SystemImportProgressMonitor from './SystemImportProgressMonitor';

const SystemImportManager: React.FC = () => {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleImportComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const importOptions = [
    {
      id: 'complete_system',
      title: 'Complete System Import',
      description: 'Import all users and vehicles from GP51 platform',
      icon: Database,
      badge: 'Recommended',
      badgeVariant: 'default' as const
    },
    {
      id: 'users_only',
      title: 'Users Only Import',
      description: 'Import only user accounts from GP51',
      icon: Users,
      badge: 'Selective',
      badgeVariant: 'secondary' as const
    },
    {
      id: 'vehicles_only',
      title: 'Vehicles Only Import',
      description: 'Import only vehicle data from GP51',
      icon: Car,
      badge: 'Selective',
      badgeVariant: 'secondary' as const
    },
    {
      id: 'selective',
      title: 'Custom Selection',
      description: 'Choose specific users or data ranges to import',
      icon: Settings,
      badge: 'Advanced',
      badgeVariant: 'outline' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                GP51 System Import Management
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Comprehensive data import from GP51 platform with backup and rollback capabilities
              </p>
            </div>
            <Button onClick={() => setShowImportDialog(true)} className="shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              New Import
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Import Options Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {importOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <Card key={option.id} className="transition-all duration-200 hover:shadow-md cursor-pointer"
                  onClick={() => setShowImportDialog(true)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <IconComponent className="w-6 h-6 text-blue-600" />
                  <Badge variant={option.badgeVariant}>{option.badge}</Badge>
                </div>
                <h3 className="font-semibold text-sm mb-2">{option.title}</h3>
                <p className="text-xs text-gray-600">{option.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Safety Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Safety & Backup Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Automatic Backup</h4>
                <p className="text-xs text-gray-600">Complete system backup before any import operation</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Rollback Support</h4>
                <p className="text-xs text-gray-600">One-click rollback to previous state if needed</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Settings className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Data Validation</h4>
                <p className="text-xs text-gray-600">Comprehensive integrity checks and conflict resolution</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Monitor */}
      <SystemImportProgressMonitor refreshTrigger={refreshTrigger} />

      {/* Import Dialog */}
      <FullGP51ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};

export default SystemImportManager;
