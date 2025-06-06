import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, Plus, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedUserData } from '@/hooks/useOptimizedUserData';

interface BackupVehicle {
  device_id: string;
  device_name: string;
  gp51_username: string;
}

interface UserMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVehicles: BackupVehicle[];
  onMappingComplete: () => void;
}

interface VehicleMapping {
  vehicle: BackupVehicle;
  targetUserId?: string;
  newUserData?: {
    name: string;
    email: string;
    phone_number?: string;
  };
}

const UserMappingDialog: React.FC<UserMappingDialogProps> = ({
  open,
  onOpenChange,
  selectedVehicles,
  onMappingComplete
}) => {
  const [mappings, setMappings] = useState<VehicleMapping[]>([]);
  const [selectedAction, setSelectedAction] = useState<'existing' | 'new' | ''>('');
  const [bulkTargetUserId, setBulkTargetUserId] = useState('');
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    phone_number: ''
  });
  const [importing, setImporting] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing users for selection
  const { data: usersData } = useOptimizedUserData({
    page: 1,
    limit: 200,
    enabled: open
  });

  const users = usersData?.users || [];

  // Initialize mappings when vehicles change
  React.useEffect(() => {
    if (selectedVehicles.length > 0) {
      setMappings(selectedVehicles.map(vehicle => ({ vehicle })));
    }
  }, [selectedVehicles]);

  const importVehiclesMutation = useMutation({
    mutationFn: async (finalMappings: VehicleMapping[]) => {
      const results = {
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const mapping of finalMappings) {
        try {
          let targetUserId = mapping.targetUserId;

          // Create new user if needed
          if (mapping.newUserData && !targetUserId) {
            const { data: newUser, error: userError } = await supabase.functions.invoke('user-management', {
              method: 'POST',
              body: {
                ...mapping.newUserData,
                gp51_username: mapping.vehicle.gp51_username
              }
            });

            if (userError) throw new Error(`Failed to create user: ${userError.message}`);
            targetUserId = newUser.user.id;
          }

          // Import vehicle - using only string device_type and minimal required fields
          const vehicleData = {
            device_id: mapping.vehicle.device_id,
            device_name: mapping.vehicle.device_name,
            device_type: 'unknown', // Default string value since we don't have this from backup
            envio_user_id: targetUserId,
            is_active: true,
            gp51_metadata: {
              original_gp51_username: mapping.vehicle.gp51_username,
              imported_from_backup: true,
              import_timestamp: new Date().toISOString()
            }
          };

          const { error: vehicleError } = await supabase
            .from('vehicles')
            .insert(vehicleData);

          if (vehicleError) {
            throw new Error(`Failed to import vehicle ${mapping.vehicle.device_id}: ${vehicleError.message}`);
          }

          results.successful++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`${mapping.vehicle.device_name}: ${error.message}`);
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['users-optimized'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      
      toast({
        title: 'Vehicle Import Complete',
        description: `Successfully imported ${results.successful} vehicles. ${results.failed > 0 ? `${results.failed} failed.` : ''}`,
        variant: results.failed > 0 ? 'destructive' : 'default'
      });

      if (results.errors.length > 0) {
        console.error('Import errors:', results.errors);
      }

      onMappingComplete();
    },
    onError: (error: any) => {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  const handleBulkAssignment = () => {
    if (selectedAction === 'existing' && bulkTargetUserId) {
      setMappings(mappings.map(mapping => ({
        ...mapping,
        targetUserId: bulkTargetUserId,
        newUserData: undefined
      })));
    } else if (selectedAction === 'new' && newUserData.name && newUserData.email) {
      setMappings(mappings.map(mapping => ({
        ...mapping,
        targetUserId: undefined,
        newUserData: { ...newUserData }
      })));
    }
  };

  const handleImport = async () => {
    const incompleteMappings = mappings.filter(m => !m.targetUserId && !m.newUserData);
    
    if (incompleteMappings.length > 0) {
      toast({
        title: 'Incomplete Mappings',
        description: `Please assign users to all ${incompleteMappings.length} remaining vehicles.`,
        variant: 'destructive'
      });
      return;
    }

    setImporting(true);
    await importVehiclesMutation.mutateAsync(mappings);
    setImporting(false);
  };

  const completedMappings = mappings.filter(m => m.targetUserId || m.newUserData).length;
  const totalMappings = mappings.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Map Vehicles to Users ({selectedVehicles.length} vehicles)
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Progress Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Total Vehicles</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">{totalMappings}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Mapped</span>
                </div>
                <div className="text-2xl font-bold text-green-900">{completedMappings}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">Remaining</span>
                </div>
                <div className="text-2xl font-bold text-orange-900">{totalMappings - completedMappings}</div>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bulk Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assignment Type</Label>
                  <Select value={selectedAction} onValueChange={(value: 'existing' | 'new') => setSelectedAction(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="existing">Assign to Existing User</SelectItem>
                      <SelectItem value="new">Create New User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedAction === 'existing' && (
                  <div className="space-y-2">
                    <Label>Select User</Label>
                    <Select value={bulkTargetUserId} onValueChange={setBulkTargetUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {selectedAction === 'new' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={newUserData.name}
                      onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={newUserData.phone_number}
                      onChange={(e) => setNewUserData({...newUserData, phone_number: e.target.value})}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              )}

              <Button 
                onClick={handleBulkAssignment}
                disabled={
                  (selectedAction === 'existing' && !bulkTargetUserId) ||
                  (selectedAction === 'new' && (!newUserData.name || !newUserData.email))
                }
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Apply to All {totalMappings} Vehicles
              </Button>
            </CardContent>
          </Card>

          {/* Mapping Preview */}
          <Card className="flex-1 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Vehicle Mappings
                <Badge variant={completedMappings === totalMappings ? 'default' : 'outline'}>
                  {completedMappings}/{totalMappings} Complete
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-64 overflow-y-auto border-t">
                {mappings.map((mapping, index) => (
                  <div key={mapping.vehicle.device_id} className="flex items-center justify-between p-4 border-b">
                    <div className="flex-1">
                      <div className="font-medium">{mapping.vehicle.device_name}</div>
                      <div className="text-sm text-gray-500">{mapping.vehicle.device_id}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      {mapping.targetUserId ? (
                        <Badge variant="default">
                          {users.find(u => u.id === mapping.targetUserId)?.name || 'Existing User'}
                        </Badge>
                      ) : mapping.newUserData ? (
                        <Badge variant="secondary">
                          New: {mapping.newUserData.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not Assigned</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={completedMappings !== totalMappings || importing}
            className="flex-1"
          >
            {importing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Import {totalMappings} Vehicles
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserMappingDialog;
