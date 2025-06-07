
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Car, Plus, X } from 'lucide-react';
import { useDeviceGroups, useDeviceGroupAssignments, useGroupManagement } from '@/hooks/useGroupManagement';

interface VehicleGroupAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: {
    device_id: string;
    device_name?: string;
    brand?: string;
    model?: string;
  };
}

export const VehicleGroupAssignmentModal: React.FC<VehicleGroupAssignmentModalProps> = ({
  isOpen,
  onClose,
  vehicle
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  const { data: deviceGroups = [], isLoading: groupsLoading } = useDeviceGroups();
  const { data: currentAssignments = [], isLoading: assignmentsLoading } = useDeviceGroupAssignments(vehicle.device_id);
  const { assignVehicleToGroup, removeVehicleFromGroup, isLoading: operationLoading } = useGroupManagement();

  const availableGroups = deviceGroups.filter(
    group => !currentAssignments.some(assignment => assignment.device_group.id === group.id)
  );

  const handleAssignToGroup = async () => {
    if (!selectedGroupId) return;

    const selectedGroup = deviceGroups.find(g => g.id === selectedGroupId);
    if (!selectedGroup?.gp51_group_id) return;

    try {
      await assignVehicleToGroup.mutateAsync({
        deviceId: vehicle.device_id,
        groupId: selectedGroup.gp51_group_id
      });
      setSelectedGroupId('');
    } catch (error) {
      console.error('Failed to assign vehicle to group:', error);
    }
  };

  const handleRemoveFromGroup = async (groupId: number) => {
    try {
      await removeVehicleFromGroup.mutateAsync({
        deviceId: vehicle.device_id,
        groupId
      });
    } catch (error) {
      console.error('Failed to remove vehicle from group:', error);
    }
  };

  const vehicleDisplayName = vehicle.device_name || 
    `${vehicle.brand || 'Unknown'} ${vehicle.model || 'Vehicle'}`.trim() ||
    vehicle.device_id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicle Group Assignment
          </DialogTitle>
          <DialogDescription>
            Manage group assignments for {vehicleDisplayName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Assignments */}
          <div>
            <h4 className="text-sm font-medium mb-3">Current Group Assignments</h4>
            {assignmentsLoading ? (
              <div className="text-sm text-muted-foreground">Loading assignments...</div>
            ) : currentAssignments.length === 0 ? (
              <div className="text-sm text-muted-foreground">No group assignments</div>
            ) : (
              <div className="space-y-2">
                {currentAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">{assignment.device_group.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Device Group ID: {assignment.device_group.gp51_group_id}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => assignment.device_group.gp51_group_id && 
                        handleRemoveFromGroup(assignment.device_group.gp51_group_id)}
                      disabled={operationLoading || !assignment.device_group.gp51_group_id}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Add New Assignment */}
          <div>
            <h4 className="text-sm font-medium mb-3">Assign to New Group</h4>
            <div className="flex gap-2">
              <Select
                value={selectedGroupId}
                onValueChange={setSelectedGroupId}
                disabled={groupsLoading || operationLoading}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {availableGroups.map((group) => (
                    <SelectItem 
                      key={group.id} 
                      value={group.id}
                      disabled={!group.gp51_group_id}
                    >
                      <div>
                        <div className="font-medium">{group.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {group.gp51_group_id ? 
                            `GP51 Group ID: ${group.gp51_group_id}` : 
                            'No GP51 group ID'
                          }
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAssignToGroup}
                disabled={!selectedGroupId || operationLoading}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {availableGroups.length === 0 && !groupsLoading && (
              <div className="text-sm text-muted-foreground mt-2">
                All available groups are already assigned
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
