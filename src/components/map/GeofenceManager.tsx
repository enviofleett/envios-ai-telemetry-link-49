
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { geofencingService, type Geofence, type GeofenceAlert } from '@/services/geofencing';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  CheckCircle,
  Bell,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner';

const GeofenceManager: React.FC = () => {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [geofencesData, alertsData] = await Promise.all([
        geofencingService.getGeofences(),
        geofencingService.getGeofenceAlerts()
      ]);
      setGeofences(geofencesData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Failed to load geofencing data:', error);
      toast.error('Failed to load geofencing data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGeofence = async (geofenceData: Omit<Geofence, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await geofencingService.createGeofence(geofenceData);
      toast.success('Geofence created successfully');
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      toast.error('Failed to create geofence');
    }
  };

  const handleUpdateGeofence = async (id: string, updates: Partial<Geofence>) => {
    try {
      await geofencingService.updateGeofence(id, updates);
      toast.success('Geofence updated successfully');
      setEditingGeofence(null);
      loadData();
    } catch (error) {
      toast.error('Failed to update geofence');
    }
  };

  const handleDeleteGeofence = async (id: string) => {
    if (!confirm('Are you sure you want to delete this geofence?')) return;
    
    try {
      await geofencingService.deleteGeofence(id);
      toast.success('Geofence deleted successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to delete geofence');
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await geofencingService.acknowledgeAlert(alertId);
      toast.success('Alert acknowledged');
      loadData();
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const getAlertIcon = (alertType: string) => {
    return alertType === 'enter' ? (
      <div className="w-2 h-2 rounded-full bg-green-500"></div>
    ) : (
      <div className="w-2 h-2 rounded-full bg-red-500"></div>
    );
  };

  const unacknowledgedAlerts = alerts.filter(alert => !alert.is_acknowledged);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <LoadingSpinner />
            <span className="ml-2">Loading geofencing data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Geofence Management</h2>
          <p className="text-gray-600">Manage geographical boundaries and alerts</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Geofence
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Geofences</p>
                <p className="text-2xl font-bold">{geofences.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold">{geofences.filter(g => g.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Alerts Today</p>
                <p className="text-2xl font-bold">
                  {alerts.filter(a => 
                    new Date(a.triggered_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Unacknowledged</p>
                <p className="text-2xl font-bold">{unacknowledgedAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      {unacknowledgedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Unacknowledged Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unacknowledgedAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.alert_type)}
                    <div>
                      <div className="font-medium">
                        Vehicle {alert.device_id} {alert.alert_type === 'enter' ? 'entered' : 'exited'} geofence
                      </div>
                      <div className="text-sm text-gray-500">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(alert.triggered_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                  >
                    Acknowledge
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Geofences List */}
      <Card>
        <CardHeader>
          <CardTitle>Geofences</CardTitle>
        </CardHeader>
        <CardContent>
          {geofences.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Geofences</h3>
              <p className="text-gray-600 mb-4">
                Create your first geofence to start monitoring vehicle boundaries
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Geofence
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {geofences.map((geofence) => (
                <div key={geofence.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{geofence.name}</h3>
                        <Badge variant={geofence.is_active ? "default" : "secondary"}>
                          {geofence.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className={
                          geofence.fence_type === 'inclusion' ? 'text-green-600' : 'text-red-600'
                        }>
                          {geofence.fence_type}
                        </Badge>
                      </div>
                      
                      {geofence.description && (
                        <p className="text-sm text-gray-600 mb-2">{geofence.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          Alert on Enter: {geofence.alert_on_enter ? 'Yes' : 'No'}
                        </span>
                        <span>
                          Alert on Exit: {geofence.alert_on_exit ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingGeofence(geofence)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteGeofence(geofence.id)}
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

      {/* Create/Edit Form Modal would go here */}
      {(showCreateForm || editingGeofence) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                {editingGeofence ? 'Edit Geofence' : 'Create Geofence'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Note: This is a simplified form. In a full implementation, you would include
                a map interface for drawing geofence boundaries.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingGeofence(null);
                  }}
                >
                  Cancel
                </Button>
                <Button>
                  {editingGeofence ? 'Update' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GeofenceManager;
