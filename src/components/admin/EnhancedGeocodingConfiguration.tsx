
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, Key, TestTube, CheckCircle, XCircle, Globe, BarChart3, Database } from 'lucide-react';
import { useEnhancedGeocodingApi } from '@/hooks/useEnhancedGeocodingApi';

const EnhancedGeocodingConfiguration: React.FC = () => {
  const [mapTilerKey, setMapTilerKey] = useState('');
  const [googleMapsKey, setGoogleMapsKey] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState<string | null>(null);
  
  const { 
    config, 
    setMapTilerApiKey, 
    setGoogleMapsApiKey, 
    testConnection,
    clearCache,
    loadStatistics
  } = useEnhancedGeocodingApi();

  const handleSaveMapTilerKey = async () => {
    if (mapTilerKey.trim()) {
      await setMapTilerApiKey(mapTilerKey.trim());
      setMapTilerKey('');
    }
  };

  const handleSaveGoogleMapsKey = async () => {
    if (googleMapsKey.trim()) {
      await setGoogleMapsApiKey(googleMapsKey.trim());
      setGoogleMapsKey('');
    }
  };

  const handleTestConnection = async (provider?: 'maptiler' | 'google-maps') => {
    setIsTestingConnection(provider || 'all');
    await testConnection(provider);
    setIsTestingConnection(null);
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
          Enhanced Geocoding Configuration
          <Badge variant="outline">Database Integrated</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="providers">API Providers</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="monitoring">Statistics</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
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
                    Primary geocoding provider with database persistence
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
                  Save to Database
                </Button>
              </div>
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
                    Fallback geocoding provider with database persistence
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
                  Save to Database
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <h4 className="font-medium">Cache Management</h4>
                  <p className="text-sm text-gray-600">Clear cached geocoding results</p>
                </div>
                <Button variant="outline" onClick={clearCache}>
                  Clear All Caches
                </Button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <h4 className="font-medium">Reload Statistics</h4>
                  <p className="text-sm text-gray-600">Refresh usage statistics from database</p>
                </div>
                <Button variant="outline" onClick={loadStatistics}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Refresh Stats
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Usage Statistics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Requests:</span>
                    <span className="font-mono">
                      {config.statistics?.total_requests || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="font-mono">
                      {config.statistics?.total_requests > 0 
                        ? Math.round((config.statistics.successful_requests / config.statistics.total_requests) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache Hit Rate:</span>
                    <span className="font-mono">
                      {config.statistics?.total_requests > 0 
                        ? Math.round((config.statistics.cache_hits / config.statistics.total_requests) * 100) 
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Provider Usage</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Google Maps:</span>
                    <span className="font-mono">
                      {config.statistics?.google_maps_requests || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>MapTiler:</span>
                    <span className="font-mono">
                      {config.statistics?.maptiler_requests || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Response:</span>
                    <span className="font-mono">
                      {config.statistics?.average_response_time 
                        ? Math.round(config.statistics.average_response_time) + 'ms'
                        : '--'}
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

          <TabsContent value="database" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <h4 className="font-medium">Database Integration Status</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium text-sm">Configuration Storage</h5>
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Active</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">API keys stored securely</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium text-sm">Usage Tracking</h5>
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Active</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">All requests logged</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium text-sm">Cache Management</h5>
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Active</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Database-backed caching</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedGeocodingConfiguration;
