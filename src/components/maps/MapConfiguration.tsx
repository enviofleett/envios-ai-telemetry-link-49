
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Key, CheckCircle, AlertTriangle } from 'lucide-react';

interface MapConfigurationProps {
  onConfigurationSave?: () => void;
}

const MapConfiguration: React.FC<MapConfigurationProps> = ({ onConfigurationSave }) => {
  const [mapTilerKey, setMapTilerKey] = useState('');
  const [googleMapsKey, setGoogleMapsKey] = useState('');
  const [isTestingMapTiler, setIsTestingMapTiler] = useState(false);
  const [isTestingGoogle, setIsTestingGoogle] = useState(false);
  const [mapTilerStatus, setMapTilerStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [googleStatus, setGoogleStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const testMapTilerConnection = async () => {
    if (!mapTilerKey.trim()) {
      setMapTilerStatus('error');
      return;
    }

    setIsTestingMapTiler(true);
    try {
      // Test MapTiler by fetching a style
      const response = await fetch(`https://api.maptiler.com/maps/streets-v2/style.json?key=${mapTilerKey}`);
      if (response.ok) {
        setMapTilerStatus('success');
      } else {
        setMapTilerStatus('error');
      }
    } catch (error) {
      console.error('MapTiler test failed:', error);
      setMapTilerStatus('error');
    } finally {
      setIsTestingMapTiler(false);
    }
  };

  const testGoogleMapsConnection = async () => {
    if (!googleMapsKey.trim()) {
      setGoogleStatus('error');
      return;
    }

    setIsTestingGoogle(true);
    try {
      // Test Google Maps by geocoding a simple address
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=New+York&key=${googleMapsKey}`
      );
      const data = await response.json();
      
      if (response.ok && data.status === 'OK') {
        setGoogleStatus('success');
      } else {
        setGoogleStatus('error');
      }
    } catch (error) {
      console.error('Google Maps test failed:', error);
      setGoogleStatus('error');
    } finally {
      setIsTestingGoogle(false);
    }
  };

  const handleSave = () => {
    // In a real implementation, you would save these to environment variables
    // or a secure backend configuration
    console.log('Saving map configuration:', { mapTilerKey, googleMapsKey });
    
    if (onConfigurationSave) {
      onConfigurationSave();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Key className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MapPin className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Map Configuration</h1>
          <p className="text-sm text-muted-foreground">
            Configure MapTiler and Google Maps API keys for mapping functionality
          </p>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> API keys should be configured as environment variables in production. 
          This interface is for testing purposes only.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MapTiler Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(mapTilerStatus)}
              MapTiler Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maptiler-key">MapTiler API Key</Label>
              <Input
                id="maptiler-key"
                type="password"
                placeholder="Enter your MapTiler API key"
                value={mapTilerKey}
                onChange={(e) => setMapTilerKey(e.target.value)}
              />
            </div>
            
            <Button
              onClick={testMapTilerConnection}
              disabled={isTestingMapTiler || !mapTilerKey.trim()}
              className="w-full"
            >
              {isTestingMapTiler ? 'Testing...' : 'Test Connection'}
            </Button>

            {mapTilerStatus === 'success' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  MapTiler connection successful! Maps will load properly.
                </AlertDescription>
              </Alert>
            )}

            {mapTilerStatus === 'error' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  MapTiler connection failed. Please check your API key.
                </AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-gray-600">
              <p>Get your API key from: <a href="https://cloud.maptiler.com/account/keys/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">MapTiler Cloud</a></p>
            </div>
          </CardContent>
        </Card>

        {/* Google Maps Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(googleStatus)}
              Google Maps Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="google-key">Google Maps API Key</Label>
              <Input
                id="google-key"
                type="password"
                placeholder="Enter your Google Maps API key"
                value={googleMapsKey}
                onChange={(e) => setGoogleMapsKey(e.target.value)}
              />
            </div>
            
            <Button
              onClick={testGoogleMapsConnection}
              disabled={isTestingGoogle || !googleMapsKey.trim()}
              className="w-full"
            >
              {isTestingGoogle ? 'Testing...' : 'Test Connection'}
            </Button>

            {googleStatus === 'success' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Google Maps connection successful! Geocoding will work properly.
                </AlertDescription>
              </Alert>
            )}

            {googleStatus === 'error' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Google Maps connection failed. Please check your API key and ensure Geocoding API is enabled.
                </AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-gray-600">
              <p>Get your API key from: <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></p>
              <p className="mt-1">Ensure the Geocoding API is enabled for your project.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <Button onClick={handleSave} className="w-full">
            Save Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapConfiguration;
