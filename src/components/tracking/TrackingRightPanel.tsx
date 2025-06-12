
import React from 'react';
import { Map, Satellite, Layers, Settings, Download, Eye, EyeOff, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const TrackingRightPanel: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Map Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Map className="h-4 w-4" />
            Map View
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Map className="h-3 w-3" />
              Road
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Satellite className="h-3 w-3" />
              Satellite
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="traffic" className="text-xs">Show Traffic</Label>
              <Switch id="traffic" size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="labels" className="text-xs">Show Labels</Label>
              <Switch id="labels" defaultChecked size="sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Display Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="routes" className="text-xs">Vehicle Routes</Label>
              <Switch id="routes" size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="speed" className="text-xs">Speed Info</Label>
              <Switch id="speed" defaultChecked size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="names" className="text-xs">Vehicle Names</Label>
              <Switch id="names" defaultChecked size="sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Quick Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start">
            Show Online Only
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            Moving Vehicles
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            High Speed Alert
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Actions */}
      <div className="space-y-2">
        <Button variant="outline" size="sm" className="w-full flex items-center gap-2">
          <Download className="h-3 w-3" />
          Export Data
        </Button>
        <Button variant="outline" size="sm" className="w-full flex items-center gap-2">
          <Settings className="h-3 w-3" />
          Settings
        </Button>
      </div>
    </div>
  );
};

export default TrackingRightPanel;
