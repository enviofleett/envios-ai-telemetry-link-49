
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMapConfigs } from '@/hooks/useMapTilerApi';
import { MapProviderFactory } from '@/services/mapProviders/MapProviderFactory';
import { MapConfig } from '@/types/mapProviders';
import { toast } from 'sonner';
import { 
  Map, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  AlertTriangle,
  CheckCircle,
  Activity,
  TrendingUp,
  Settings
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

const MultiProviderMapManagement = () => {
  const { configs, isLoading, saveConfig, deleteConfig, refetch } = useMapConfigs();
  const [editingConfig, setEditingConfig] = useState<MapConfig | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  const supportedProviders = MapProviderFactory.getSupportedProviders();

  const handleSave = async (config: MapConfig) => {
    try {
      await saveConfig(config);
      toast.success('Map provider configuration saved successfully');
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

  const handleTest = async (config: MapConfig) => {
    setTestingProvider(config.id);
    
    try {
      const testUrl = getTestUrl(config);
      
      if (!testUrl) {
        toast.error(`Testing not implemented for ${config.provider_type}`);
        return;
      }

      const startTime = Date.now();
      const response = await fetch(testUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(10000)
      });
      
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        toast.success(`${config.name} test successful (${responseTime}ms)`);
      } else {
        toast.error(`${config.name} test failed: HTTP ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`${config.name} test failed: ${errorMessage}`);
    } finally {
      setTestingProvider(null);
    }
  };

  const getTestUrl = (config: MapConfig): string => {
    switch (config.provider_type) {
      case 'maptiler':
        return `https://api.maptiler.com/maps/streets/style.json?key=${config.api_key}`;
      case 'mapbox':
        return `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${config.api_key}`;
      default:
        return '';
    }
  };

  const getTodayUsage = (config: MapConfig) => {
    if (!config.map_api_usage || config.map_api_usage.length === 0) return 0;
    
    const today = new Date().toISOString().split('T')[0];
    const todayUsage = config.map_api_usage.find((usage: any) => 
      usage.usage_date === today
    );
    
    return todayUsage?.request_count || 0;
  };

  const getUsagePercentage = (config: MapConfig) => {
    const usage = getTodayUsage(config);
    return (usage / config.threshold_value) * 100;
  };

  const getStatusBadge = (config: MapConfig) => {
    if (!config.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    switch (config.health_status) {
      case 'healthy':
        return <Badge className="bg-green-500 text-white">Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500 text-white">Degraded</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 text-white">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getProviderIcon = (providerType: string) => {
    switch (providerType) {
      case 'maptiler':
        return '🗺️';
      case 'mapbox':
        return '📍';
      case 'google':
        return '🌍';
      case 'leaflet':
        return '🍃';
      default:
        return '🗺️';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <LoadingSpinner />
            <span className="ml-2">Loading map providers...</span>
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
              Multi-Provider Map Management
            </CardTitle>
            <Button 
              onClick={() => {
                setEditingConfig({
                  id: '',
                  name: '',
                  api_key: '',
                  provider_type: 'maptiler',
                  threshold_type: 'daily_requests',
                  threshold_value: 100000,
                  is_active: true,
                  fallback_priority: (configs.length + 1),
                  cost_per_request: 0.001
                });
                setShowForm(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Provider
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Provider Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {configs.filter(c => c.is_active).length}
              </div>
              <div className="text-sm text-gray-600">Active Providers</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {configs.filter(c => c.health_status === 'healthy').length}
              </div>
              <div className="text-sm text-gray-600">Healthy</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {configs.reduce((sum, config) => sum + getTodayUsage(config), 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Requests Today</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {supportedProviders.length}
              </div>
              <div className="text-sm text-gray-600">Supported Types</div>
            </div>
          </div>

          {/* Supported Providers Info */}
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Supported Providers:</strong> {supportedProviders.map(provider => 
                `${getProviderIcon(provider)} ${provider}`
              ).join(', ')}
            </AlertDescription>
          </Alert>

          {configs.length === 0 ? (
            <div className="text-center py-8">
              <Map className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Map Providers Configured</h3>
              <p className="text-gray-600 mb-4">
                Add your first map provider to enable maps across the application
              </p>
              <Button 
                onClick={() => {
                  setEditingConfig({
                    id: '',
                    name: 'Primary MapTiler',
                    api_key: '',
                    provider_type: 'maptiler',
                    threshold_type: 'daily_requests',
                    threshold_value: 100000,
                    is_active: true,
                    fallback_priority: 1,
                    cost_per_request: 0.001
                  });
                  setShowForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Map Provider
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {configs.map((config) => (
                <div key={config.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getProviderIcon(config.provider_type)}</span>
                        <h3 className="font-semibold">{config.name}</h3>
                        {getStatusBadge(config)}
                        <Badge variant="outline">Priority {config.fallback_priority}</Badge>
                        {config.health_status === 'healthy' && (
                          <Badge variant="outline" className="text-green-600">
                            <Activity className="h-3 w-3 mr-1" />
                            {config.response_time_ms || 0}ms
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Provider:</span>
                          <span className="ml-1 capitalize">{config.provider_type}</span>
                        </div>
                        <div>
                          <span className="font-medium">Daily Limit:</span>
                          <span className="ml-1">{config.threshold_value.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="font-medium">Today's Usage:</span>
                          <span className="ml-1">{getTodayUsage(config).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="font-medium">Cost/Request:</span>
                          <span className="ml-1">${(config.cost_per_request || 0).toFixed(4)}</span>
                        </div>
                      </div>

                      {/* Usage Progress Bar */}
                      <div className="mb-2">
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
                        onClick={() => handleTest(config)}
                        disabled={testingProvider === config.id}
                      >
                        {testingProvider === config.id ? (
                          <LoadingSpinner />
                        ) : (
                          <TrendingUp className="h-4 w-4" />
                        )}
                      </Button>
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
        <MultiProviderConfigForm
          config={editingConfig}
          supportedProviders={supportedProviders}
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

const MultiProviderConfigForm: React.FC<{
  config: MapConfig;
  supportedProviders: string[];
  onSave: (config: MapConfig) => void;
  onCancel: () => void;
}> = ({ config, supportedProviders, onSave, onCancel }) => {
  const [formData, setFormData] = useState(config);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const getProviderSpecificFields = () => {
    switch (formData.provider_type) {
      case 'maptiler':
        return (
          <div className="space-y-4">
            <div>
              <Label>MapTiler Style (Optional)</Label>
              <Select 
                value={formData.provider_specific_config?.style || 'streets'}
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  provider_specific_config: { 
                    ...formData.provider_specific_config, 
                    style: value 
                  }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="streets">Streets</SelectItem>
                  <SelectItem value="satellite">Satellite</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="topo">Topographic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'mapbox':
        return (
          <div className="space-y-4">
            <div>
              <Label>Mapbox Style</Label>
              <Select 
                value={formData.provider_specific_config?.style || 'streets-v12'}
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  provider_specific_config: { 
                    ...formData.provider_specific_config, 
                    style: value 
                  }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="streets-v12">Streets</SelectItem>
                  <SelectItem value="satellite-v9">Satellite</SelectItem>
                  <SelectItem value="light-v11">Light</SelectItem>
                  <SelectItem value="dark-v11">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {config.id ? 'Edit' : 'Add'} Map Provider Configuration
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
                  {supportedProviders.map(provider => (
                    <SelectItem key={provider} value={provider}>
                      {provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </SelectItem>
                  ))}
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
              placeholder={`Enter your ${formData.provider_type} API key`}
              required
            />
          </div>

          {/* Provider-specific configuration */}
          {getProviderSpecificFields()}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="threshold_value">Daily Request Limit</Label>
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
            <div>
              <Label htmlFor="cost">Cost per Request ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.0001"
                value={formData.cost_per_request || 0}
                onChange={(e) => setFormData({ ...formData, cost_per_request: parseFloat(e.target.value) })}
                min="0"
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

export default MultiProviderMapManagement;
