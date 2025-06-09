
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Car, 
  Download, 
  Filter,
  ArrowRight,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { GP51LiveData, GP51LiveImportConfig } from '@/hooks/useGP51LiveImport';

interface GP51DataSelectorProps {
  liveData: GP51LiveData | null;
  importConfig: GP51LiveImportConfig;
  isLoading: boolean;
  onConfigChange: (config: Partial<GP51LiveImportConfig>) => void;
  onFetchData: () => void;
  onProceed: () => void;
}

const GP51DataSelector: React.FC<GP51DataSelectorProps> = ({
  liveData,
  importConfig,
  isLoading,
  onConfigChange,
  onFetchData,
  onProceed
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const userTypeNames = {
    1: 'End User',
    2: 'Sub-Admin',
    3: 'Device User', 
    4: 'Admin'
  };

  const handleUserTypeToggle = (userType: number) => {
    const newUserTypes = importConfig.userTypes.includes(userType)
      ? importConfig.userTypes.filter(t => t !== userType)
      : [...importConfig.userTypes, userType];
    onConfigChange({ userTypes: newUserTypes });
  };

  const handleUserSelection = (userId: string, selected: boolean) => {
    const newSelectedUsers = selected
      ? [...importConfig.selectedUserIds, userId]
      : importConfig.selectedUserIds.filter(id => id !== userId);
    onConfigChange({ selectedUserIds: newSelectedUsers });
  };

  const handleDeviceSelection = (deviceId: string, selected: boolean) => {
    const newSelectedDevices = selected
      ? [...importConfig.selectedDeviceIds, deviceId]
      : importConfig.selectedDeviceIds.filter(id => id !== deviceId);
    onConfigChange({ selectedDeviceIds: newSelectedDevices });
  };

  const selectAllUsers = () => {
    const filteredUsers = liveData?.users.filter(user => 
      importConfig.userTypes.includes(user.usertype)
    ) || [];
    onConfigChange({ selectedUserIds: filteredUsers.map(u => u.username) });
  };

  const selectAllDevices = () => {
    onConfigChange({ selectedDeviceIds: liveData?.devices.map(d => d.deviceid) || [] });
  };

  const filteredUsers = liveData?.users.filter(user => 
    importConfig.userTypes.includes(user.usertype)
  ) || [];

  const filteredDevices = liveData?.devices || [];

  return (
    <div className="space-y-4">
      {/* Data Fetch Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Live Data from GP51 Platform</span>
            <Button onClick={onFetchData} disabled={isLoading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {liveData ? 'Refresh Data' : 'Fetch Live Data'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {liveData ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{liveData.statistics.totalUsers}</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{liveData.statistics.activeUsers}</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{liveData.statistics.totalDevices}</div>
                <div className="text-sm text-muted-foreground">Total Devices</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{liveData.statistics.activeDevices}</div>
                <div className="text-sm text-muted-foreground">Active Devices</div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Click "Fetch Live Data" to retrieve current users and devices from GP51 platform
            </p>
          )}
        </CardContent>
      </Card>

      {liveData && (
        <>
          {/* Import Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Import Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="import-users"
                    checked={importConfig.importUsers}
                    onCheckedChange={(checked) => onConfigChange({ importUsers: checked as boolean })}
                  />
                  <label htmlFor="import-users" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Import Users
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="import-devices"
                    checked={importConfig.importDevices}
                    onCheckedChange={(checked) => onConfigChange({ importDevices: checked as boolean })}
                  />
                  <label htmlFor="import-devices" className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Import Devices
                  </label>
                </div>
              </div>

              {importConfig.importUsers && (
                <div>
                  <label className="text-sm font-medium">User Types to Import:</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(userTypeNames).map(([type, name]) => (
                      <Badge
                        key={type}
                        variant={importConfig.userTypes.includes(parseInt(type)) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleUserTypeToggle(parseInt(type))}
                      >
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Selection */}
          {importConfig.importUsers && filteredUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Users ({importConfig.selectedUserIds.length} of {filteredUsers.length} selected)
                  </span>
                  <Button onClick={selectAllUsers} variant="outline" size="sm">
                    Select All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredUsers.map((user) => (
                    <div key={user.username} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={importConfig.selectedUserIds.includes(user.username)}
                          onCheckedChange={(checked) => handleUserSelection(user.username, checked as boolean)}
                        />
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-muted-foreground">
                            {userTypeNames[user.usertype]} • {user.deviceids.length} devices
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {userTypeNames[user.usertype]}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Device Selection */}
          {importConfig.importDevices && filteredDevices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Devices ({importConfig.selectedDeviceIds.length} of {filteredDevices.length} selected)
                  </span>
                  <Button onClick={selectAllDevices} variant="outline" size="sm">
                    Select All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredDevices.map((device) => (
                    <div key={device.deviceid} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={importConfig.selectedDeviceIds.includes(device.deviceid)}
                          onCheckedChange={(checked) => handleDeviceSelection(device.deviceid, checked as boolean)}
                        />
                        <div>
                          <div className="font-medium">{device.devicename}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {device.deviceid} • Type: {device.devicetype}
                          </div>
                        </div>
                      </div>
                      <Badge variant={device.isfree ? "secondary" : "default"}>
                        {device.isfree ? 'Free' : 'Paid'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" disabled>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <Button 
              onClick={onProceed}
              disabled={
                (!importConfig.importUsers || importConfig.selectedUserIds.length === 0) &&
                (!importConfig.importDevices || importConfig.selectedDeviceIds.length === 0)
              }
            >
              Preview Import
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default GP51DataSelector;
