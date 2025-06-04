
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface EditUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: { name: string; email: string };
  onFormDataChange: (data: { name: string; email: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  isOpen,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  isLoading
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update User'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
