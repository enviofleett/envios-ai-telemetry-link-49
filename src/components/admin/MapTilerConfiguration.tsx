
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Map, Key, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { useMapTilerApi } from '@/hooks/useMapTilerApi';

const MapTilerConfiguration: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { config, setMapTilerApiKey, testConnection } = useMapTilerApi();

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      setMapTilerApiKey(apiKey.trim());
      setApiKey('');
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    await testConnection('maptiler');
    setIsTestingConnection(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          MapTiler Configuration
          {config.mapTiler.isConfigured ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Configured
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Not Configured
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* API Key Configuration */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="maptiler-api-key" className="text-sm font-medium">
              MapTiler API Key
            </Label>
            <p className="text-xs text-gray-600 mt-1">
              Get your API key from{' '}
              <a 
                href="https://cloud.maptiler.com/account/keys/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                MapTiler Cloud Console
              </a>
            </p>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="maptiler-api-key"
                type="password"
                placeholder="Enter your MapTiler API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={handleSaveApiKey}
              disabled={!apiKey.trim()}
            >
              Save
            </Button>
          </div>
        </div>

        {/* Connection Test */}
        {config.mapTiler.isConfigured && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Test Connection</h4>
                <p className="text-xs text-gray-600">
                  Verify that your MapTiler API key is working correctly
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTestingConnection}
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                {isTestingConnection ? 'Testing...' : 'Test'}
              </Button>
            </div>
          </div>
        )}

        {/* Features Overview */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Map Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${config.mapTiler.isConfigured ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Interactive Maps</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${config.mapTiler.isConfigured ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Vehicle Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${config.mapTiler.isConfigured ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Address Geocoding</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${config.mapTiler.isConfigured ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Real-time Updates</span>
            </div>
          </div>
        </div>

        {/* Usage Information */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Usage Information</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• MapTiler provides 100,000 free map loads per month</li>
            <li>• Geocoding requests are cached to minimize API usage</li>
            <li>• Maps automatically update with vehicle positions</li>
            <li>• Address resolution works for global coordinates</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapTilerConfiguration;
