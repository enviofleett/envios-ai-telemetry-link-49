
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Car, MapPin, Clock, Share2, History, Edit, Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Vehicle {
  id: string;
  device_id: string;
  device_name: string;
  status: string;
  sim_number?: string;
  notes?: string;
  is_active: boolean;
  last_position?: {
    lat: number;
    lon: number;
    speed: number;
    course: number;
    updatetime: string;
    statusText: string;
  };
  created_at: string;
  updated_at: string;
  gp51_sessions: {
    id: string;
    username: string;
    token_expires_at: string;
  };
}

const VehicleManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [formData, setFormData] = useState({
    notes: '',
    simNumber: '',
    isActive: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vehiclesData, isLoading } = useQuery({
    queryKey: ['vehicles-management'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('vehicle-management');
      if (error) throw error;
      return data.vehicles as Vehicle[];
    },
  });

  const updateVehicleMutation = useMutation({
    mutationFn: async (vehicleData: { vehicleId: string; notes: string; simNumber: string; isActive: boolean }) => {
      const { data, error } = await supabase.functions.invoke('vehicle-management', {
        body: vehicleData
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles-management'] });
      setIsEditDialogOpen(false);
      setSelectedVehicle(null);
      toast({ title: 'Vehicle updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error updating vehicle', description: error.message, variant: 'destructive' });
    },
  });

  const generateShareUrlMutation = useMutation({
    mutationFn: async ({ deviceId, sessionId }: { deviceId: string; sessionId: string }) => {
      const { data, error } = await supabase.functions.invoke('vehicle-management', {
        body: null,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const url = new URL(window.location.origin + '/api/vehicle-management');
      url.searchParams.set('action', 'share-track');
      url.searchParams.set('deviceId', deviceId);
      url.searchParams.set('sessionId', sessionId);
      url.searchParams.set('interval', '24');

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to generate share URL');
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      return result.shareUrl;
    },
    onSuccess: (url) => {
      setShareUrl(url);
      setIsShareDialogOpen(true);
    },
    onError: (error: any) => {
      toast({ title: 'Error generating share URL', description: error.message, variant: 'destructive' });
    },
  });

  const filteredVehicles = vehiclesData?.filter(vehicle => {
    const matchesSearch = vehicle.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vehicle.sim_number && vehicle.sim_number.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && vehicle.is_active) ||
                         (statusFilter === 'inactive' && !vehicle.is_active) ||
                         vehicle.status?.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      notes: vehicle.notes || '',
      simNumber: vehicle.sim_number || '',
      isActive: vehicle.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVehicle) {
      updateVehicleMutation.mutate({
        vehicleId: selectedVehicle.id,
        ...formData
      });
    }
  };

  const handleShareTrack = (vehicle: Vehicle) => {
    generateShareUrlMutation.mutate({
      deviceId: vehicle.device_id,
      sessionId: vehicle.gp51_sessions.id
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string, isActive: boolean) => {
    if (!isActive) return 'secondary';
    switch (status?.toLowerCase()) {
      case 'online':
      case 'active':
        return 'default';
      case 'offline':
        return 'destructive';
      case 'alert':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading vehicles...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
        <div className="text-sm text-gray-500">
          {filteredVehicles.length} vehicles found
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by device name, ID, or SIM number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredVehicles.map((vehicle) => (
          <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Car className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{vehicle.device_name}</CardTitle>
                    <div className="text-sm text-gray-500">ID: {vehicle.device_id}</div>
                  </div>
                </div>
                <Badge variant={getStatusColor(vehicle.status, vehicle.is_active)}>
                  {vehicle.is_active ? vehicle.status || 'Unknown' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {vehicle.sim_number && (
                <div className="text-sm">
                  <span className="font-medium">SIM:</span> {vehicle.sim_number}
                </div>
              )}
              
              {vehicle.last_position && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span>Lat: {vehicle.last_position.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="ml-5">Lon: {vehicle.last_position.lon.toFixed(6)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span>{formatDate(vehicle.last_position.updatetime)}</span>
                  </div>
                </div>
              )}

              {vehicle.notes && (
                <div className="text-sm">
                  <span className="font-medium">Notes:</span>
                  <p className="text-gray-600 mt-1">{vehicle.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleEditVehicle(vehicle)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleShareTrack(vehicle)}>
                  <Share2 className="h-3 w-3 mr-1" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No vehicles found</div>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateVehicle} className="space-y-4">
            <div>
              <Label htmlFor="sim-number">SIM Number</Label>
              <Input
                id="sim-number"
                value={formData.simNumber}
                onChange={(e) => setFormData({ ...formData, simNumber: e.target.value })}
                placeholder="Enter SIM number"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add notes about this vehicle"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="is-active">Active</Label>
            </div>
            <Button type="submit" disabled={updateVehicleMutation.isPending}>
              {updateVehicleMutation.isPending ? 'Updating...' : 'Update Vehicle'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Vehicle Track</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Share this URL to allow others to view the vehicle's track:
            </p>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly />
              <Button onClick={() => copyToClipboard(shareUrl)}>
                Copy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleManagement;
