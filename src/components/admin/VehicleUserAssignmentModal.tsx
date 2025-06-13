
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, User, UserCheck, UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { gp51VehiclePersistenceService } from '@/services/gp51VehiclePersistenceService';
import { useToast } from '@/hooks/use-toast';

interface EnvioUser {
  id: string;
  name: string;
  email: string;
  registration_status: string;
}

interface VehicleUserAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleDeviceId: string;
  currentUserId?: string | null;
  currentUserName?: string | null;
  onAssignmentComplete: () => void;
}

export const VehicleUserAssignmentModal: React.FC<VehicleUserAssignmentModalProps> = ({
  isOpen,
  onClose,
  vehicleId,
  vehicleDeviceId,
  currentUserId,
  currentUserName,
  onAssignmentComplete
}) => {
  const [users, setUsers] = useState<EnvioUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<EnvioUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('envio_users')
        .select('id, name, email, registration_status')
        .order('name');

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive"
        });
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const assignUser = async (userId: string, userName: string) => {
    setIsAssigning(true);
    try {
      await gp51VehiclePersistenceService.assignUserToVehicle(vehicleId, userId);
      
      toast({
        title: "Success",
        description: `Vehicle ${vehicleDeviceId} assigned to ${userName}`,
      });
      onAssignmentComplete();
      onClose();
    } catch (error) {
      console.error('Error assigning user:', error);
      toast({
        title: "Error",
        description: "Failed to assign user to vehicle",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const unassignUser = async () => {
    setIsAssigning(true);
    try {
      await gp51VehiclePersistenceService.assignUserToVehicle(vehicleId, null);
      
      toast({
        title: "Success",
        description: `Vehicle ${vehicleDeviceId} unassigned from user`,
      });
      onAssignmentComplete();
      onClose();
    } catch (error) {
      console.error('Error unassigning user:', error);
      toast({
        title: "Error",
        description: "Failed to unassign user from vehicle",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Assign User to Vehicle
          </DialogTitle>
          <DialogDescription>
            Assign vehicle <strong>{vehicleDeviceId}</strong> to a user in your system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Assignment */}
          {currentUserId && currentUserName && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Currently assigned to:</span>
                  <Badge variant="outline">{currentUserName}</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={unassignUser}
                  disabled={isAssigning}
                >
                  <UserX className="w-4 h-4 mr-1" />
                  Unassign
                </Button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* User List */}
          <div className="space-y-2">
            <Label>Select User to Assign</Label>
            <ScrollArea className="h-64 w-full border rounded">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {searchTerm ? 'No users found matching your search' : 'No users available'}
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 rounded border transition-colors ${
                        user.id === currentUserId
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <Badge 
                            variant={user.registration_status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {user.registration_status}
                          </Badge>
                        </div>
                        {user.id === currentUserId ? (
                          <Badge variant="outline">Currently Assigned</Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => assignUser(user.id, user.name)}
                            disabled={isAssigning}
                          >
                            Assign
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isAssigning}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
