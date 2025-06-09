
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Car, 
  Play,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { GP51LiveData, GP51LiveImportConfig } from '@/hooks/useGP51LiveImport';

interface GP51ImportPreviewProps {
  liveData: GP51LiveData | null;
  importConfig: GP51LiveImportConfig;
  isImporting: boolean;
  onStartImport: () => void;
  onBack: () => void;
  onProceedToProgress: () => void;
}

const GP51ImportPreview: React.FC<GP51ImportPreviewProps> = ({
  liveData,
  importConfig,
  isImporting,
  onStartImport,
  onBack,
  onProceedToProgress
}) => {
  if (!liveData) return null;

  const selectedUsers = liveData.users.filter(user => 
    importConfig.selectedUserIds.includes(user.username)
  );

  const selectedDevices = liveData.devices.filter(device => 
    importConfig.selectedDeviceIds.includes(device.deviceid)
  );

  const userTypeNames = {
    1: 'End User',
    2: 'Sub-Admin', 
    3: 'Device User',
    4: 'Admin'
  };

  const handleStartImport = () => {
    onStartImport();
    // Navigate to progress tab after starting
    setTimeout(() => {
      onProceedToProgress();
    }, 1000);
  };

  return (
    <div className="space-y-4">
      {/* Import Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Import Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{selectedUsers.length}</div>
              <div className="text-sm text-muted-foreground">Users to Import</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{selectedDevices.length}</div>
              <div className="text-sm text-muted-foreground">Devices to Import</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {selectedUsers.length + selectedDevices.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="text-sm">
                {importConfig.conflictResolution.toUpperCase()}
              </Badge>
              <div className="text-sm text-muted-foreground">Conflict Resolution</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Preview */}
      {importConfig.importUsers && selectedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users to Import ({selectedUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {selectedUsers.slice(0, 10).map((user) => (
                <div key={user.username} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div>
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.phone && `${user.phone} • `}
                      {user.deviceids.length} devices assigned
                    </div>
                  </div>
                  <Badge variant="outline">
                    {userTypeNames[user.usertype]}
                  </Badge>
                </div>
              ))}
              {selectedUsers.length > 10 && (
                <div className="text-center text-sm text-muted-foreground py-2">
                  ... and {selectedUsers.length - 10} more users
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Devices Preview */}
      {importConfig.importDevices && selectedDevices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Devices to Import ({selectedDevices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {selectedDevices.slice(0, 10).map((device) => (
                <div key={device.deviceid} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div>
                    <div className="font-medium">{device.devicename}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {device.deviceid} • SIM: {device.simnum}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline">Type {device.devicetype}</Badge>
                    <Badge variant={device.isfree ? "secondary" : "default"}>
                      {device.isfree ? 'Free' : 'Paid'}
                    </Badge>
                  </div>
                </div>
              ))}
              {selectedDevices.length > 10 && (
                <div className="text-center text-sm text-muted-foreground py-2">
                  ... and {selectedDevices.length - 10} more devices
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Import Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Conflict Resolution:</label>
              <p className="text-sm text-muted-foreground capitalize">
                {importConfig.conflictResolution} existing records
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Import Mode:</label>
              <p className="text-sm text-muted-foreground">
                GP51 Live Platform Import
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>This import will fetch the latest data directly from GP51 platform</li>
            <li>User accounts will be created in the system with GP51 usernames</li>
            <li>Devices will be assigned to their respective users automatically</li>
            <li>Existing conflicts will be handled according to your selected resolution strategy</li>
          </ul>
        </AlertDescription>
      </Alert>

      {(selectedUsers.length > 50 || selectedDevices.length > 100) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Large Import Detected:</strong> You are importing {selectedUsers.length + selectedDevices.length} items. 
            This process may take several minutes to complete. Please ensure you have a stable internet connection.
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isImporting}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Selection
        </Button>
        
        <Button 
          onClick={handleStartImport}
          disabled={isImporting || (selectedUsers.length === 0 && selectedDevices.length === 0)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Play className="h-4 w-4 mr-2" />
          {isImporting ? 'Starting Import...' : 'Start Import'}
        </Button>
      </div>
    </div>
  );
};

export default GP51ImportPreview;
