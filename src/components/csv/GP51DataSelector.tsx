
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Car, Database, RefreshCw } from 'lucide-react';

interface GP51DataSelectorProps {
  liveData: any;
  importConfig: any;
  isLoading: boolean;
  onConfigChange: (config: any) => void;
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
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Select Data to Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Fetch live data from GP51</span>
            <Button onClick={onFetchData} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {isLoading ? 'Fetching...' : 'Fetch Data'}
            </Button>
          </div>

          {liveData && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="users"
                  checked={importConfig?.includeUsers}
                  onCheckedChange={(checked) => 
                    onConfigChange({ ...importConfig, includeUsers: checked })
                  }
                />
                <label htmlFor="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Import Users ({liveData.users?.length || 0} found)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vehicles"
                  checked={importConfig?.includeVehicles}
                  onCheckedChange={(checked) => 
                    onConfigChange({ ...importConfig, includeVehicles: checked })
                  }
                />
                <label htmlFor="vehicles" className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Import Vehicles ({liveData.vehicles?.length || 0} found)
                </label>
              </div>

              <Button 
                onClick={onProceed} 
                disabled={!importConfig?.includeUsers && !importConfig?.includeVehicles}
                className="w-full"
              >
                Proceed to Preview
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51DataSelector;
