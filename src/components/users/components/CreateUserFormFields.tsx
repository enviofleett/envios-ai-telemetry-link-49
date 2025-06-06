
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

interface CreateUserFormData {
  name: string;
  email: string;
  phone_number: string;
  role: 'user' | 'admin';
  gp51_user_type: 1 | 2 | 3 | 4;
  create_gp51_account: boolean;
  gp51_username: string;
  gp51_password: string;
}

interface CreateUserFormFieldsProps {
  formData: CreateUserFormData;
  setFormData: (data: CreateUserFormData) => void;
  errors: Record<string, string>;
  isEdit: boolean;
  editUser?: any;
  onGP51UsernameGenerate: () => void;
}

const CreateUserFormFields: React.FC<CreateUserFormFieldsProps> = ({
  formData,
  setFormData,
  errors,
  isEdit,
  editUser,
  onGP51UsernameGenerate
}) => {
  return (
    <>
      <div>
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
      </div>

      {!isEdit && (
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
        </div>
      )}

      {isEdit && (
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={editUser.email}
            disabled
            className="bg-gray-100"
          />
          <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
        </div>
      )}

      <div>
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          value={formData.phone_number}
          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
          className={errors.phone_number ? 'border-red-500' : ''}
        />
        {errors.phone_number && <p className="text-sm text-red-500 mt-1">{errors.phone_number}</p>}
      </div>

      <div>
        <Label htmlFor="role">User Role</Label>
        <Select value={formData.role} onValueChange={(value: 'user' | 'admin') => setFormData({ ...formData, role: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!isEdit && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="create_gp51"
            checked={formData.create_gp51_account}
            onCheckedChange={(checked) => setFormData({ ...formData, create_gp51_account: checked as boolean })}
          />
          <Label htmlFor="create_gp51">Create GP51 Account</Label>
        </div>
      )}

      {(formData.create_gp51_account || isEdit) && (
        <>
          <div>
            <Label htmlFor="gp51_user_type">GP51 User Type</Label>
            <Select 
              value={formData.gp51_user_type.toString()} 
              onValueChange={(value) => setFormData({ ...formData, gp51_user_type: parseInt(value) as 1 | 2 | 3 | 4 })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Company Admin</SelectItem>
                <SelectItem value="2">Sub Admin</SelectItem>
                <SelectItem value="3">End User</SelectItem>
                <SelectItem value="4">Device User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="gp51_username">GP51 Username {!isEdit && '*'}</Label>
              {!isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onGP51UsernameGenerate}
                >
                  Generate
                </Button>
              )}
            </div>
            <Input
              id="gp51_username"
              value={formData.gp51_username}
              onChange={(e) => setFormData({ ...formData, gp51_username: e.target.value })}
              className={errors.gp51_username ? 'border-red-500' : ''}
            />
            {errors.gp51_username && <p className="text-sm text-red-500 mt-1">{errors.gp51_username}</p>}
          </div>

          {!isEdit && (
            <div>
              <Label htmlFor="gp51_password">GP51 Password *</Label>
              <Input
                id="gp51_password"
                type="password"
                value={formData.gp51_password}
                onChange={(e) => setFormData({ ...formData, gp51_password: e.target.value })}
                className={errors.gp51_password ? 'border-red-500' : ''}
              />
              {errors.gp51_password && <p className="text-sm text-red-500 mt-1">{errors.gp51_password}</p>}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default CreateUserFormFields;
