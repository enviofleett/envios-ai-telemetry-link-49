
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Key, TestTube, CheckCircle, XCircle, Map, ExternalLink } from 'lucide-react';
import { useMapTilerApi } from '@/hooks/useMapTilerApi';

export const MapTilerApiConfiguration: React.FC = () => {
  const [mapTilerKey, setMapTilerKey] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  const { 
    config, 
    setMapTilerApiKey, 
    testConnection 
  } = useMapTilerApi();

  const handleSaveMapTilerKey = () => {
    if (mapTilerKey.trim()) {
      setMapTilerApiKey(mapTilerKey.trim());
      setMapTilerKey('');
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    await testConnection('maptiler');
    setIsTestingConnection(false);
  };

  const getProviderStatus = () => {
    const isConfigured = config.mapTiler.isConfigured;
    return isConfigured ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Configured
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Not Configured
      </Badge>
    );
  };

  if (config.isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          MapTiler API Configuration
          {getProviderStatus()}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">MapTiler Geocoding API</h3>
              <p className="text-sm text-gray-600">
                Configure MapTiler for geocoding and mapping services
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={!config.mapTiler.isConfigured || isTestingConnection}
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maptiler-key">API Key</Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="maptiler-key"
                    type="password"
                    placeholder="Enter MapTiler API key"
                    value={mapTilerKey}
                    onChange={(e) => setMapTilerKey(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  onClick={handleSaveMapTilerKey}
                  disabled={!mapTilerKey.trim()}
                >
                  Save
                </Button>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Get your MapTiler API Key</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Visit the MapTiler Cloud Console to create and manage your API keys.
                  </p>
                  <Button
                    variant="link"
                    className="text-blue-600 p-0 h-auto mt-2"
                    onClick={() => window.open('https://cloud.maptiler.com/account/keys/', '_blank')}
                  >
                    Open MapTiler Console →
                  </Button>
                </div>
              </div>
            </div>

            {config.mapTiler.isConfigured && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">MapTiler API Configured</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your MapTiler API key is configured and ready for geocoding services.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
