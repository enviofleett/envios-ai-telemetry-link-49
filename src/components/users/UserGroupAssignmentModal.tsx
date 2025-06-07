
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, UserPlus, UserMinus } from 'lucide-react';
import { useUserGroups, useUserGroupAssignments, useGroupManagement } from '@/hooks/useGroupManagement';

interface UserGroupAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    gp51_username?: string;
  };
}

export const UserGroupAssignmentModal: React.FC<UserGroupAssignmentModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  const { data: userGroups = [], isLoading: groupsLoading } = useUserGroups();
  const { data: currentAssignments = [], isLoading: assignmentsLoading } = useUserGroupAssignments(user.id);
  const { assignUserToGroup, removeUserFromGroup, isLoading: operationLoading } = useGroupManagement();

  const availableGroups = userGroups.filter(
    group => !currentAssignments.some(assignment => assignment.user_group.id === group.id)
  );

  const handleAssignToGroup = async () => {
    if (!selectedGroupId || !user.gp51_username) return;

    const selectedGroup = userGroups.find(g => g.id === selectedGroupId);
    if (!selectedGroup) return;

    try {
      await assignUserToGroup.mutateAsync({
        username: user.gp51_username,
        groupId: selectedGroup.gp51_group_id
      });
      setSelectedGroupId('');
    } catch (error) {
      console.error('Failed to assign user to group:', error);
    }
  };

  const handleRemoveFromGroup = async (groupId: number) => {
    if (!user.gp51_username) return;

    try {
      await removeUserFromGroup.mutateAsync({
        username: user.gp51_username,
        groupId
      });
    } catch (error) {
      console.error('Failed to remove user from group:', error);
    }
  };

  if (!user.gp51_username) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Group Assignment</DialogTitle>
            <DialogDescription>
              This user does not have a GP51 username and cannot be assigned to groups.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={onClose}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Group Assignments</DialogTitle>
          <DialogDescription>
            Assign or remove {user.name} from user groups
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
                      <div className="font-medium text-sm">{assignment.user_group.name}</div>
                      {assignment.user_group.description && (
                        <div className="text-xs text-muted-foreground">
                          {assignment.user_group.description}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFromGroup(assignment.user_group.gp51_group_id)}
                      disabled={operationLoading}
                    >
                      <UserMinus className="h-4 w-4" />
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
                    <SelectItem key={group.id} value={group.id}>
                      <div>
                        <div className="font-medium">{group.name}</div>
                        {group.description && (
                          <div className="text-xs text-muted-foreground">
                            {group.description}
                          </div>
                        )}
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
                <UserPlus className="h-4 w-4" />
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
