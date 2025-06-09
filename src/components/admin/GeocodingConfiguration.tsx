
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Map, Key, TestTube, CheckCircle, XCircle, Globe, Settings } from 'lucide-react';
import { useMapTilerApi } from '@/hooks/useMapTilerApi';
import { unifiedGeocodingService } from '@/services/geocoding/unifiedGeocodingService';

const GeocodingConfiguration: React.FC = () => {
  const [mapTilerKey, setMapTilerKey] = useState('');
  const [googleMapsKey, setGoogleMapsKey] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState<string | null>(null);
  const [primaryProvider, setPrimaryProvider] = useState<'google-maps' | 'maptiler'>('google-maps');
  
  const { 
    config, 
    setMapTilerApiKey, 
    setGoogleMapsApiKey, 
    testConnection,
    clearCache,
    getMetrics,
    getCacheStats
  } = useMapTilerApi();

  const handleSaveMapTilerKey = () => {
    if (mapTilerKey.trim()) {
      setMapTilerApiKey(mapTilerKey.trim());
      setMapTilerKey('');
    }
  };

  const handleSaveGoogleMapsKey = () => {
    if (googleMapsKey.trim()) {
      setGoogleMapsApiKey(googleMapsKey.trim());
      setGoogleMapsKey('');
    }
  };

  const handleTestConnection = async (provider?: 'maptiler' | 'google-maps') => {
    setIsTestingConnection(provider || 'all');
    await testConnection(provider);
    setIsTestingConnection(null);
  };

  const handleUpdatePrimaryProvider = (provider: 'google-maps' | 'maptiler') => {
    setPrimaryProvider(provider);
    unifiedGeocodingService.updateConfig({
      primaryProvider: provider,
      fallbackProvider: provider === 'google-maps' ? 'maptiler' : 'google-maps'
    });
  };

  const getProviderStatus = (provider: 'mapTiler' | 'googleMaps') => {
    const isConfigured = config[provider].isConfigured;
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
          <Globe className="h-5 w-5" />
          Geocoding Configuration
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="providers">API Providers</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-6">
            {/* Google Maps Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    Google Maps Geocoding
                    {getProviderStatus('googleMaps')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Primary geocoding provider for accurate address resolution
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleTestConnection('google-maps')}
                  disabled={!config.googleMaps.isConfigured || isTestingConnection === 'google-maps'}
                  className="flex items-center gap-2"
                >
                  <TestTube className="h-4 w-4" />
                  {isTestingConnection === 'google-maps' ? 'Testing...' : 'Test'}
                </Button>
              </div>
              
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Enter Google Maps API key"
                    value={googleMapsKey}
                    onChange={(e) => setGoogleMapsKey(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  onClick={handleSaveGoogleMapsKey}
                  disabled={!googleMapsKey.trim()}
                >
                  Save
                </Button>
              </div>
              
              <p className="text-xs text-gray-600">
                Get your API key from{' '}
                <a 
                  href="https://console.cloud.google.com/apis/credentials" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google Cloud Console
                </a>
                {' '}(Enable Geocoding API)
              </p>
            </div>

            {/* MapTiler Configuration */}
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    MapTiler Geocoding
                    {getProviderStatus('mapTiler')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Fallback geocoding provider for global coverage
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleTestConnection('maptiler')}
                  disabled={!config.mapTiler.isConfigured || isTestingConnection === 'maptiler'}
                  className="flex items-center gap-2"
                >
                  <TestTube className="h-4 w-4" />
                  {isTestingConnection === 'maptiler' ? 'Testing...' : 'Test'}
                </Button>
              </div>
              
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
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
              
              <p className="text-xs text-gray-600">
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
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Primary Geocoding Provider</Label>
                <Select value={primaryProvider} onValueChange={handleUpdatePrimaryProvider}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google-maps">Google Maps (Recommended)</SelectItem>
                    <SelectItem value="maptiler">MapTiler</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600 mt-1">
                  Primary provider is tried first, with automatic fallback to the other provider
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <h4 className="font-medium">Cache Management</h4>
                  <p className="text-sm text-gray-600">Clear cached geocoding results</p>
                </div>
                <Button variant="outline" onClick={clearCache}>
                  Clear Cache
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Provider Success Rates</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Google Maps:</span>
                    <span className="font-mono">
                      {/* Metrics would be displayed here */}
                      --
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>MapTiler:</span>
                    <span className="font-mono">
                      --
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Cache Statistics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Entries:</span>
                    <span className="font-mono">
                      --
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache Hit Rate:</span>
                    <span className="font-mono">
                      --
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => handleTestConnection()}
                disabled={isTestingConnection === 'all'}
                className="w-full"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {isTestingConnection === 'all' ? 'Testing All Providers...' : 'Test All Providers'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default GeocodingConfiguration;
