
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Plus, Edit, Trash2, AlertTriangle, Shield } from 'lucide-react';
import StabilizedMapProvider from './StabilizedMapProvider';

interface GeofenceZone {
  id: string;
  name: string;
  type: 'circular' | 'polygon';
  center?: { lat: number; lon: number };
  radius?: number; // in meters
  polygon?: Array<{ lat: number; lon: number }>;
  alertType: 'entry' | 'exit' | 'both';
  isActive: boolean;
  createdAt: string;
  triggeredCount: number;
}

interface GeofenceManagerProps {
  zones?: GeofenceZone[];
  onZoneCreate?: (zone: Omit<GeofenceZone, 'id' | 'createdAt' | 'triggeredCount'>) => void;
  onZoneUpdate?: (id: string, zone: Partial<GeofenceZone>) => void;
  onZoneDelete?: (id: string) => void;
  height?: string;
  className?: string;
}

const GeofenceManager: React.FC<GeofenceManagerProps> = ({
  zones = [],
  onZoneCreate,
  onZoneUpdate,
  onZoneDelete,
  height = "500px",
  className = ""
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [newZone, setNewZone] = useState({
    name: '',
    type: 'circular' as 'circular' | 'polygon',
    alertType: 'both' as 'entry' | 'exit' | 'both',
    isActive: true
  });

  const activeZones = zones.filter(zone => zone.isActive);
  const totalTriggers = zones.reduce((sum, zone) => sum + zone.triggeredCount, 0);

  const handleCreateZone = () => {
    if (!newZone.name.trim()) return;

    onZoneCreate?.({
      ...newZone,
      center: { lat: 0, lon: 0 }, // Default center - should be set by map click
      radius: 1000 // Default 1km radius
    });

    setNewZone({
      name: '',
      type: 'circular',
      alertType: 'both',
      isActive: true
    });
    setIsCreating(false);
  };

  const handleToggleZone = (id: string, isActive: boolean) => {
    onZoneUpdate?.(id, { isActive });
  };

  const handleDeleteZone = (id: string) => {
    if (window.confirm('Are you sure you want to delete this geofence zone?')) {
      onZoneDelete?.(id);
    }
  };

  // Convert geofence zones to map markers for visualization
  const zoneMarkers = zones.map(zone => ({
    deviceid: zone.id,
    devicename: zone.name,
    lastPosition: zone.center ? {
      lat: zone.center.lat,
      lon: zone.center.lon,
      speed: 0,
      updatetime: zone.createdAt
    } : undefined
  })).filter(marker => marker.lastPosition);

  const getZoneTypeIcon = (type: string) => {
    return type === 'circular' ? '⭕' : '📐';
  };

  const getAlertTypeColor = (alertType: string) => {
    switch (alertType) {
      case 'entry': return 'bg-green-100 text-green-800';
      case 'exit': return 'bg-red-100 text-red-800';
      case 'both': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Geofence Management
              <Badge variant="outline" className="ml-2">
                {activeZones.length} active zones
              </Badge>
            </CardTitle>
            
            <Button
              onClick={() => setIsCreating(true)}
              disabled={isCreating}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Zone
            </Button>
          </div>
          
          {/* Summary Stats */}
          <div className="flex flex-wrap gap-4 mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Total Zones: {zones.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-sm">Active: {activeZones.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm">Total Triggers: {totalTriggers}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Create New Zone Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Geofence Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Zone Name</label>
                <Input
                  placeholder="Enter zone name..."
                  value={newZone.name}
                  onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Zone Type</label>
                <Select 
                  value={newZone.type} 
                  onValueChange={(value: 'circular' | 'polygon') => 
                    setNewZone({ ...newZone, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="circular">Circular Zone</SelectItem>
                    <SelectItem value="polygon">Polygon Zone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Alert Type</label>
                <Select 
                  value={newZone.alertType} 
                  onValueChange={(value: 'entry' | 'exit' | 'both') => 
                    setNewZone({ ...newZone, alertType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Alert</SelectItem>
                    <SelectItem value="exit">Exit Alert</SelectItem>
                    <SelectItem value="both">Entry & Exit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleCreateZone} disabled={!newZone.name.trim()}>
                Create Zone
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map with Geofence Zones */}
      <Card>
        <CardHeader>
          <CardTitle>Zone Visualization</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <StabilizedMapProvider
            vehicles={zoneMarkers}
            height={height}
            enableClustering={false}
            className="rounded-b-lg border-0"
          />
        </CardContent>
      </Card>

      {/* Zones List */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Zones</CardTitle>
        </CardHeader>
        <CardContent>
          {zones.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No geofence zones created yet</p>
              <p className="text-sm text-gray-400">Create your first zone to start monitoring</p>
            </div>
          ) : (
            <div className="space-y-3">
              {zones.map((zone) => (
                <div key={zone.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getZoneTypeIcon(zone.type)}</span>
                    <div>
                      <div className="font-medium">{zone.name}</div>
                      <div className="text-sm text-gray-500">
                        Created: {new Date(zone.createdAt).toLocaleDateString()}
                        {zone.triggeredCount > 0 && (
                          <span className="ml-2">• {zone.triggeredCount} triggers</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getAlertTypeColor(zone.alertType)}>
                      {zone.alertType}
                    </Badge>
                    
                    <Badge variant={zone.isActive ? "default" : "secondary"}>
                      {zone.isActive ? "Active" : "Inactive"}
                    </Badge>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleZone(zone.id, !zone.isActive)}
                    >
                      {zone.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingZone(zone.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteZone(zone.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GeofenceManager;
