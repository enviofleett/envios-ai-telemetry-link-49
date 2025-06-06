
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Car, Users, ArrowRight } from 'lucide-react';
import VehicleImportReviewDialog from './VehicleImportReviewDialog';

const VehicleImportTab: React.FC = () => {
  const [showImportDialog, setShowImportDialog] = useState(false);

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Vehicle Data Recovery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">Backup Data Available</span>
            </div>
            <p className="text-sm text-blue-700">
              Found 3,821 vehicles in backup table <code>vehicle_assignment_backup_20250605</code> 
              that can be imported and assigned to current users.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Available Vehicles</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">3,821</div>
                <div className="text-xs text-gray-500">From backup table</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Original GP51 User</span>
                </div>
                <div className="text-lg font-bold text-gray-900 mt-1">08144225467</div>
                <div className="text-xs text-gray-500">Needs reassignment</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Import Status</span>
                </div>
                <div className="text-lg font-bold text-green-900 mt-1">Ready</div>
                <div className="text-xs text-green-600">Can start mapping</div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 mb-2">Import Process</h4>
            <ol className="text-sm text-amber-700 space-y-1">
              <li>1. Review vehicle list from backup table</li>
              <li>2. Map vehicles to existing or new users</li>
              <li>3. Import vehicles with proper user assignments</li>
              <li>4. Validate and confirm successful import</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => setShowImportDialog(true)}
              className="flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Start Vehicle Import
            </Button>
            <Badge variant="outline">Data Migration Tool</Badge>
          </div>
        </CardContent>
      </Card>

      <VehicleImportReviewDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
      />
    </div>
  );
};

export default VehicleImportTab;
