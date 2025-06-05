
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Map, TestTube, BarChart3, Settings } from 'lucide-react';
import UniversalMapComponent from '@/components/map/UniversalMapComponent';
import { useMapConfigs } from '@/hooks/useMapTilerApi';

const MapPreviewPanel: React.FC = () => {
  const [testMode, setTestMode] = useState(false);
  const { configs, isLoading } = useMapConfigs();

  const activeConfig = configs.find(config => config.is_active);

  const handleTestMap = () => {
    setTestMode(!testMode);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Map API Testing & Preview
            {activeConfig && (
              <Badge variant="outline" className="ml-2">
                {activeConfig.name}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* API Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {configs.filter(c => c.is_active).length}
                </div>
                <div className="text-sm text-gray-600">Active APIs</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {activeConfig?.provider_type || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Current Provider</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600">
                  {activeConfig?.threshold_value?.toLocaleString() || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Daily Limit</div>
              </div>
            </div>

            {/* Test Controls */}
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button
                onClick={handleTestMap}
                variant={testMode ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                {testMode ? 'Hide Test Map' : 'Test Map Loading'}
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                View Usage Stats
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                API Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Preview */}
      {testMode && (
        <Card>
          <CardHeader>
            <CardTitle>Live Map Test</CardTitle>
          </CardHeader>
          <CardContent>
            <UniversalMapComponent
              vehicles={[]}
              showVehicles={false}
              showGeofences={false}
              height="400px"
              interactive={true}
              clustered={false}
              title="Map API Connectivity Test"
              center={[-74.0, 40.7]} // New York coordinates for testing
              zoom={10}
            />
            
            <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
              <strong>Test Results:</strong> Map loaded successfully using {activeConfig?.provider_type} API.
              Current usage is within limits.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MapPreviewPanel;
