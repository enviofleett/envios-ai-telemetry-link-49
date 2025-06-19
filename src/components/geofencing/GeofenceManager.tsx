
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { geofencingService, type Geofence } from '@/services/geofencingService';
import { MapPin, AlertCircle, CheckCircle, Plus, Edit, Trash2 } from 'lucide-react';

const GeofenceManager: React.FC = () => {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fence_type: 'inclusion' as 'inclusion' | 'exclusion',
    alert_on_enter: true,
    alert_on_exit: false,
    is_active: true
  });

  useEffect(() => {
    loadGeofences();
  }, []);

  const loadGeofences = async () => {
    try {
      setIsLoading(true);
      const data = await geofencingService.getGeofences();
      setGeofences(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load geofences",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For demo purposes, create a simple circular geofence
    // In a real implementation, you'd have a map interface to draw geofences
    const demoGeometry = {
      type: "Polygon",
      coordinates: [[
        [-74.0059, 40.7128], // New York City demo coordinates
        [-74.0059, 40.7228],
        [-73.9959, 40.7228],
        [-73.9959, 40.7128],
        [-74.0059, 40.7128]
      ]]
    };

    try {
      if (editingGeofence) {
        await geofencingService.updateGeofence(editingGeofence.id, formData);
        toast({
          title: "Success",
          description: "Geofence updated successfully"
        });
      } else {
        // Get current user ID (in a real app, this would come from auth context)
        const currentUserId = 'demo-user-id'; // Replace with actual user ID
        
        await geofencingService.createGeofence({
          ...formData,
          geometry: demoGeometry,
          created_by: currentUserId
        });
        
        toast({
          title: "Success",
          description: "Geofence created successfully"
        });
      }
      
      resetForm();
      loadGeofences();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save geofence",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await geofencingService.deleteGeofence(id);
      toast({
        title: "Success",
        description: "Geofence deleted successfully"
      });
      loadGeofences();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete geofence",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      fence_type: 'inclusion',
      alert_on_enter: true,
      alert_on_exit: false,
      is_active: true
    });
    setShowCreateForm(false);
    setEditingGeofence(null);
  };

  const startEdit = (geofence: Geofence) => {
    setFormData({
      name: geofence.name,
      description: geofence.description || '',
      fence_type: geofence.fence_type,
      alert_on_enter: geofence.alert_on_enter,
      alert_on_exit: geofence.alert_on_exit,
      is_active: geofence.is_active
    });
    setEditingGeofence(geofence);
    setShowCreateForm(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading geofences...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Geofence Management
            </div>
            <Button 
              onClick={() => setShowCreateForm(true)} 
              disabled={showCreateForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Geofence
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showCreateForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {editingGeofence ? 'Edit Geofence' : 'Create New Geofence'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="fence_type">Fence Type</Label>
                    <Select 
                      value={formData.fence_type} 
                      onValueChange={(value: 'inclusion' | 'exclusion') => 
                        setFormData({ ...formData, fence_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inclusion">Inclusion Zone</SelectItem>
                        <SelectItem value="exclusion">Exclusion Zone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="alert_on_enter"
                      checked={formData.alert_on_enter}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, alert_on_enter: checked })
                      }
                    />
                    <Label htmlFor="alert_on_enter">Alert on Enter</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="alert_on_exit"
                      checked={formData.alert_on_exit}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, alert_on_exit: checked })
                      }
                    />
                    <Label htmlFor="alert_on_exit">Alert on Exit</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingGeofence ? 'Update' : 'Create'} Geofence
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {geofences.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No geofences created yet. Click "Create Geofence" to get started.
              </div>
            ) : (
              geofences.map((geofence) => (
                <Card key={geofence.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{geofence.name}</h3>
                          <Badge variant={geofence.fence_type === 'inclusion' ? 'default' : 'destructive'}>
                            {geofence.fence_type}
                          </Badge>
                          <Badge variant={geofence.is_active ? 'default' : 'secondary'}>
                            {geofence.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        {geofence.description && (
                          <p className="text-gray-600 text-sm mb-3">{geofence.description}</p>
                        )}
                        <div className="flex gap-4 text-sm text-gray-500">
                          {geofence.alert_on_enter && (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              Enter alerts
                            </div>
                          )}
                          {geofence.alert_on_exit && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              Exit alerts
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(geofence)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(geofence.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeofenceManager;
