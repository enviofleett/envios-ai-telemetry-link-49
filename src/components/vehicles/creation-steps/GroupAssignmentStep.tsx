
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Users, Info } from 'lucide-react';
import { useDeviceGroups } from '@/hooks/useGroupManagement';
import type { VehicleFormData } from '../EnhancedVehicleCreationModal';

interface GroupAssignmentStepProps {
  formData: VehicleFormData;
  updateFormData: (updates: Partial<VehicleFormData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const GroupAssignmentStep: React.FC<GroupAssignmentStepProps> = ({
  formData,
  updateFormData,
  onNext,
  onPrevious
}) => {
  const { data: deviceGroups = [], isLoading } = useDeviceGroups();

  const handleGroupToggle = (groupId: number, checked: boolean) => {
    if (checked) {
      updateFormData({
        selectedGroups: [...formData.selectedGroups, groupId]
      });
    } else {
      updateFormData({
        selectedGroups: formData.selectedGroups.filter(id => id !== groupId)
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Assignment
          </h3>
          <p className="text-sm text-muted-foreground">
            Assign this device to one or more groups for organized management
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading available groups...</p>
          </div>
        ) : deviceGroups.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No device groups are available. You can create groups after vehicle creation.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <Label>Available Device Groups</Label>
            <div className="space-y-3 max-h-64 overflow-y-auto border rounded-lg p-4">
              {deviceGroups.map((group) => (
                <div key={group.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={`group-${group.id}`}
                    checked={formData.selectedGroups.includes(group.gp51_group_id || 0)}
                    onCheckedChange={(checked) => 
                      group.gp51_group_id && handleGroupToggle(group.gp51_group_id, checked as boolean)
                    }
                    disabled={!group.gp51_group_id}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`group-${group.id}`} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{group.name}</span>
                        {group.gp51_group_id ? (
                          <Badge variant="secondary" className="text-xs">
                            GP51 ID: {group.gp51_group_id}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            No GP51 ID
                          </Badge>
                        )}
                      </div>
                      {group.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {group.description}
                        </p>
                      )}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Groups Summary */}
        {formData.selectedGroups.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Groups ({formData.selectedGroups.length})</Label>
            <div className="flex flex-wrap gap-2">
              {formData.selectedGroups.map((groupId) => {
                const group = deviceGroups.find(g => g.gp51_group_id === groupId);
                return group ? (
                  <Badge key={groupId} variant="default">
                    {group.name}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Group assignments can be modified after vehicle creation. You can proceed without selecting any groups.
          </AlertDescription>
        </Alert>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onNext}>
          Next Step
        </Button>
      </div>
    </div>
  );
};
