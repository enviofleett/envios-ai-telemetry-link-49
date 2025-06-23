
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { subscriberPackageApi } from '@/services/subscriberPackageApi';
import type { PackageFeature, MenuPermission } from '@/types/subscriber-packages';

const createPackageSchema = z.object({
  package_name: z.string().min(1, 'Package name is required'),
  description: z.string().optional(),
  user_type: z.enum(['end_user', 'sub_admin', 'both']),
  subscription_fee_monthly: z.number().min(0).optional(),
  subscription_fee_annually: z.number().min(0).optional(),
  referral_discount_percentage: z.number().min(0).max(100).default(0),
  vehicle_limit: z.number().min(1).optional(),
  chatbot_prompt_limit: z.number().min(0).default(100),
  feature_ids: z.array(z.string()).default([]),
  menu_permission_ids: z.array(z.string()).default([]),
});

type CreatePackageFormData = z.infer<typeof createPackageSchema>;

interface CreatePackageFormProps {
  onSuccess: () => void;
}

const CreatePackageForm: React.FC<CreatePackageFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [features, setFeatures] = useState<PackageFeature[]>([]);
  const [menuPermissions, setMenuPermissions] = useState<MenuPermission[]>([]);
  const { toast } = useToast();

  const form = useForm<CreatePackageFormData>({
    resolver: zodResolver(createPackageSchema),
    defaultValues: {
      package_name: '',
      description: '',
      user_type: 'end_user',
      subscription_fee_monthly: 0,
      subscription_fee_annually: 0,
      referral_discount_percentage: 0,
      vehicle_limit: undefined,
      chatbot_prompt_limit: 100,
      feature_ids: [],
      menu_permission_ids: [],
    }
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [featuresData, menuData] = await Promise.all([
          subscriberPackageApi.getFeatures(),
          subscriberPackageApi.getMenuPermissions()
        ]);
        setFeatures(featuresData);
        setMenuPermissions(menuData);
      } catch (error) {
        console.error('Failed to load package data:', error);
      }
    };

    loadData();
  }, []);

  const onSubmit = async (data: CreatePackageFormData) => {
    setIsLoading(true);
    try {
      await subscriberPackageApi.createPackage(data);

      toast({
        title: "Success",
        description: "Package created successfully",
      });

      form.reset();
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create package",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedFeatures = form.watch('feature_ids');
  const selectedMenuPermissions = form.watch('menu_permission_ids');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Package</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="package_name">Package Name</Label>
              <Input
                id="package_name"
                {...form.register('package_name')}
                placeholder="Enter package name"
              />
              {form.formState.errors.package_name && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.package_name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="user_type">User Type</Label>
              <Select
                value={form.watch('user_type')}
                onValueChange={(value) => form.setValue('user_type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="end_user">End User</SelectItem>
                  <SelectItem value="sub_admin">Sub Admin</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Package description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subscription_fee_monthly">Monthly Fee (₦)</Label>
              <Input
                id="subscription_fee_monthly"
                type="number"
                step="0.01"
                {...form.register('subscription_fee_monthly', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="subscription_fee_annually">Annual Fee (₦)</Label>
              <Input
                id="subscription_fee_annually"
                type="number"
                step="0.01"
                {...form.register('subscription_fee_annually', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicle_limit">Vehicle Limit</Label>
              <Input
                id="vehicle_limit"
                type="number"
                {...form.register('vehicle_limit', { valueAsNumber: true })}
                placeholder="Leave empty for unlimited"
              />
            </div>

            <div>
              <Label htmlFor="chatbot_prompt_limit">Chatbot Prompt Limit</Label>
              <Input
                id="chatbot_prompt_limit"
                type="number"
                {...form.register('chatbot_prompt_limit', { valueAsNumber: true })}
                placeholder="100"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="referral_discount_percentage">Referral Discount (%)</Label>
            <Input
              id="referral_discount_percentage"
              type="number"
              min="0"
              max="100"
              {...form.register('referral_discount_percentage', { valueAsNumber: true })}
              placeholder="0"
            />
          </div>

          <div>
            <Label>Features</Label>
            <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded p-3">
              {features.map((feature) => (
                <div key={feature.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`feature-${feature.id}`}
                    checked={selectedFeatures.includes(feature.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        form.setValue('feature_ids', [...selectedFeatures, feature.id]);
                      } else {
                        form.setValue('feature_ids', selectedFeatures.filter(id => id !== feature.id));
                      }
                    }}
                  />
                  <Label htmlFor={`feature-${feature.id}`} className="text-sm">
                    {feature.feature_name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Menu Permissions</Label>
            <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded p-3">
              {menuPermissions.map((permission) => (
                <div key={permission.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`menu-${permission.id}`}
                    checked={selectedMenuPermissions.includes(permission.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        form.setValue('menu_permission_ids', [...selectedMenuPermissions, permission.id]);
                      } else {
                        form.setValue('menu_permission_ids', selectedMenuPermissions.filter(id => id !== permission.id));
                      }
                    }}
                  />
                  <Label htmlFor={`menu-${permission.id}`} className="text-sm">
                    {permission.menu_name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Package'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePackageForm;
