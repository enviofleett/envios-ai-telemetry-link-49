
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus } from 'lucide-react';

const DeviceTypeManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Device Types
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">GPS Tracker</h3>
                <Badge variant="secondary">Default</Badge>
              </div>
              <p className="text-sm text-gray-600">Standard GPS tracking device</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Fleet Monitor</h3>
                <Badge variant="secondary">Advanced</Badge>
              </div>
              <p className="text-sm text-gray-600">Advanced fleet monitoring device</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Asset Tracker</h3>
                <Badge variant="secondary">Basic</Badge>
              </div>
              <p className="text-sm text-gray-600">Asset tracking device</p>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceTypeManagement;
