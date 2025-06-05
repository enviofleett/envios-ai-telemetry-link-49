import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useMapConfigs } from '@/hooks/useMapTilerApi';
import { toast } from 'sonner';
import { 
  Map, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface MapApiConfig {
  id?: string;
  name: string;
  api_key: string;
  provider_type: string;
  threshold_type: string;
  threshold_value: number;
  is_active: boolean;
  fallback_priority: number;
}

const MapApiManagement = () => {
  const { configs, isLoading, saveConfig, deleteConfig, refetch } = useMapConfigs();
  const [editingConfig, setEditingConfig] = useState<MapApiConfig | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSave = async (config: MapApiConfig) => {
    try {
      await saveConfig(config);
      toast.success('Map API configuration saved successfully');
      setEditingConfig(null);
      setShowForm(false);
    } catch (error) {
      toast.error('Failed to save configuration');
      console.error('Save error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;
    
    try {
      await deleteConfig(id);
      toast.success('Configuration deleted successfully');
    } catch (error) {
      toast.error('Failed to delete configuration');
      console.error('Delete error:', error);
    }
  };

  const getTodayUsage = (config: any) => {
    if (!config.map_api_usage || config.map_api_usage.length === 0) return 0;
    
    const today = new Date().toISOString().split('T')[0];
    const todayUsage = config.map_api_usage.find((usage: any) => 
      usage.usage_date === today
    );
    
    return todayUsage?.request_count || 0;
  };

  const getUsagePercentage = (config: any) => {
    const usage = getTodayUsage(config);
    return (usage / config.threshold_value) * 100;
  };

  const getStatusBadge = (config: any) => {
    if (!config.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    const percentage = getUsagePercentage(config);
    if (percentage >= 90) {
      return <Badge variant="destructive">Near Limit</Badge>;
    } else if (percentage >= 50) {
      return <Badge className="bg-yellow-500">Moderate Use</Badge>;
    } else {
      return <Badge className="bg-green-500">Active</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <LoadingSpinner />
            <span className="ml-2">Loading map configurations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              MapTiler API Management
            </CardTitle>
            <Button 
              onClick={() => {
                setEditingConfig({
                  name: '',
                  api_key: '',
                  provider_type: 'maptiler',
                  threshold_type: 'daily_requests',
                  threshold_value: 100000,
                  is_active: true,
                  fallback_priority: (configs.length + 1)
                });
                setShowForm(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add API Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <div className="text-center py-8">
              <Map className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Map APIs Configured</h3>
              <p className="text-gray-600 mb-4">
                Add your first MapTiler API key to enable maps across the application
              </p>
              <Button 
                onClick={() => {
                  setEditingConfig({
                    name: 'Primary MapTiler',
                    api_key: '',
                    provider_type: 'maptiler',
                    threshold_type: 'daily_requests',
                    threshold_value: 100000,
                    is_active: true,
                    fallback_priority: 1
                  });
                  setShowForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add MapTiler API Key
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {configs.map((config) => (
                <div key={config.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{config.name}</h3>
                        {getStatusBadge(config)}
                        <Badge variant="outline">Priority {config.fallback_priority}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">API Key:</span>
                          <span className="ml-1 font-mono">
                            {config.api_key.substring(0, 8)}...
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Provider:</span>
                          <span className="ml-1 capitalize">{config.provider_type}</span>
                        </div>
                        <div>
                          <span className="font-medium">Threshold:</span>
                          <span className="ml-1">
                            {config.threshold_value.toLocaleString()} {config.threshold_type.replace('_', ' ')}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Today's Usage:</span>
                          <span className="ml-1">
                            {getTodayUsage(config).toLocaleString()} requests
                          </span>
                        </div>
                      </div>

                      {/* Usage Progress Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Usage Progress</span>
                          <span>{getUsagePercentage(config).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              getUsagePercentage(config) >= 90 ? 'bg-red-500' :
                              getUsagePercentage(config) >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(getUsagePercentage(config), 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingConfig(config);
                          setShowForm(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(config.id!)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Form Modal */}
      {showForm && editingConfig && (
        <MapConfigForm
          config={editingConfig}
          onSave={handleSave}
          onCancel={() => {
            setEditingConfig(null);
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
};

const MapConfigForm: React.FC<{
  config: MapApiConfig;
  onSave: (config: MapApiConfig) => void;
  onCancel: () => void;
}> = ({ config, onSave, onCancel }) => {
  const [formData, setFormData] = useState(config);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          {config.id ? 'Edit' : 'Add'} Map API Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Configuration Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Primary MapTiler"
                required
              />
            </div>
            <div>
              <Label htmlFor="provider">Provider Type</Label>
              <Select 
                value={formData.provider_type} 
                onValueChange={(value) => setFormData({ ...formData, provider_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maptiler">MapTiler</SelectItem>
                  <SelectItem value="mapbox">Mapbox</SelectItem>
                  <SelectItem value="openstreetmap">OpenStreetMap</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              placeholder="Enter your MapTiler API key"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="threshold_type">Threshold Type</Label>
              <Select 
                value={formData.threshold_type} 
                onValueChange={(value) => setFormData({ ...formData, threshold_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily_requests">Daily Requests</SelectItem>
                  <SelectItem value="monthly_requests">Monthly Requests</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="threshold_value">Threshold Value</Label>
              <Input
                id="threshold_value"
                type="number"
                value={formData.threshold_value}
                onChange={(e) => setFormData({ ...formData, threshold_value: parseInt(e.target.value) })}
                min="1"
                required
              />
            </div>
            <div>
              <Label htmlFor="priority">Fallback Priority</Label>
              <Input
                id="priority"
                type="number"
                value={formData.fallback_priority}
                onChange={(e) => setFormData({ ...formData, fallback_priority: parseInt(e.target.value) })}
                min="1"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active Configuration</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MapApiManagement;
