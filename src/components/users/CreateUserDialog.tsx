
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCreateUserForm } from './hooks/useCreateUserForm';
import CreateUserFormFields from './components/CreateUserFormFields';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editUser?: any;
}

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ open, onOpenChange, editUser }) => {
  const {
    formData,
    setFormData,
    errors,
    isLoading,
    handleSubmit,
    handleGP51UsernameGenerate,
    isEdit
  } = useCreateUserForm({
    editUser,
    onSuccess: () => onOpenChange(false)
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editUser ? 'Edit User' : 'Create New User'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <CreateUserFormFields
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            isEdit={isEdit}
            editUser={editUser}
            onGP51UsernameGenerate={handleGP51UsernameGenerate}
          />

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (editUser ? 'Updating...' : 'Creating...') : (editUser ? 'Update User' : 'Create User')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
