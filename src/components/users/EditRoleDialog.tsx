
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface EditRoleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRole: string;
  onRoleChange: (role: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const EditRoleDialog: React.FC<EditRoleDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedRole,
  onRoleChange,
  onSubmit,
  isLoading
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update User Role</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={selectedRole} onValueChange={onRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Role'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRoleDialog;
