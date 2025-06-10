
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { MapPin } from 'lucide-react';

const GeocodingSettingsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Geocoding Configuration
        </CardTitle>
        <CardDescription>
          Configure address lookup and reverse geocoding services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Geocoding</Label>
              <p className="text-sm text-muted-foreground">
                Convert coordinates to addresses automatically
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="space-y-2">
            <Label htmlFor="geocoding-provider">Geocoding Provider</Label>
            <select className="w-full p-2 border rounded-md">
              <option value="google">Google Maps</option>
              <option value="mapbox">Mapbox</option>
              <option value="nominatim">OpenStreetMap (Free)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your geocoding API key"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cache-duration">Cache Duration (hours)</Label>
            <Input
              id="cache-duration"
              type="number"
              defaultValue="24"
              min="1"
              max="168"
            />
          </div>
        </div>

        <Button>Save Geocoding Settings</Button>
      </CardContent>
    </Card>
  );
};

export default GeocodingSettingsTab;
