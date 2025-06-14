import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { subscriberPackageApi } from '@/services/subscriberPackageApi';
import { useToast } from '@/hooks/use-toast';
import type { CreatePackageRequest, PackageFeature, MenuPermission } from '@/types/subscriber-packages';

interface CreatePackageFormProps {
  onSuccess: () => void;
}

const CreatePackageForm: React.FC<CreatePackageFormProps> = ({ onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreatePackageRequest>({
    package_name: '',
    description: '',
    user_type: 'end_user',
    subscription_fee_monthly: 0,
    subscription_fee_annually: 0,
    referral_discount_percentage: 0,
    feature_ids: [],
    menu_permission_ids: [],
    vehicle_limit: null
  });

  const { toast } = useToast();

  const { data: features } = useQuery({
    queryKey: ['package-features'],
    queryFn: subscriberPackageApi.getFeatures
  });

  const { data: menuPermissions } = useQuery({
    queryKey: ['menu-permissions'],
    queryFn: subscriberPackageApi.getMenuPermissions
  });

  const handleFeatureToggle = (featureId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      feature_ids: checked
        ? [...prev.feature_ids, featureId]
        : prev.feature_ids.filter(id => id !== featureId)
    }));
  };

  const handleMenuPermissionToggle = (menuId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      menu_permission_ids: checked
        ? [...prev.menu_permission_ids, menuId]
        : prev.menu_permission_ids.filter(id => id !== menuId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.package_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Package name is required.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await subscriberPackageApi.createPackage(formData);
      toast({
        title: "Package created",
        description: "The package has been successfully created."
      });
      onSuccess();
    } catch (error) {
      console.error('Create package error:', error);
      toast({
        title: "Error",
        description: "Failed to create package. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedFeatures = features?.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, PackageFeature[]>);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Package</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="package_name">Package Name *</Label>
              <Input
                id="package_name"
                value={formData.package_name}
                onChange={(e) => setFormData(prev => ({ ...prev, package_name: e.target.value }))}
                placeholder="Enter package name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_type">User Type *</Label>
              <Select value={formData.user_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, user_type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="end_user">End User</SelectItem>
                  <SelectItem value="sub_admin">Sub Admin</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Package description"
              rows={3}
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly_fee">Monthly Fee (₦)</Label>
              <Input
                id="monthly_fee"
                type="number"
                min="0"
                step="0.01"
                value={formData.subscription_fee_monthly || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, subscription_fee_monthly: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="annual_fee">Annual Fee (₦)</Label>
              <Input
                id="annual_fee"
                type="number"
                min="0"
                step="0.01"
                value={formData.subscription_fee_annually || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, subscription_fee_annually: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referral_discount">Referral Discount (%)</Label>
              <Input
                id="referral_discount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.referral_discount_percentage || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, referral_discount_percentage: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Vehicle Limit */}
          <div className="space-y-2">
            <Label htmlFor="vehicle_limit">Vehicle Limit</Label>
            <Input
              id="vehicle_limit"
              type="number"
              min="0"
              step="1"
              value={formData.vehicle_limit ?? ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                vehicle_limit: e.target.value === '' ? null : parseInt(e.target.value)
              }))}
              placeholder="Enter vehicle limit (leave blank for unlimited)"
            />
          </div>

          {/* Features */}
          <div className="space-y-4">
            <Label>Package Features</Label>
            {groupedFeatures && Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
              <div key={category} className="space-y-2">
                <h4 className="font-medium text-sm capitalize">{category}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {categoryFeatures.map((feature) => (
                    <div key={feature.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature.id}
                        checked={formData.feature_ids.includes(feature.id)}
                        onCheckedChange={(checked) => handleFeatureToggle(feature.id, !!checked)}
                      />
                      <Label htmlFor={feature.id} className="text-sm">
                        {feature.feature_name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Menu Permissions */}
          <div className="space-y-4">
            <Label>Menu Permissions</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {menuPermissions?.map((menu) => (
                <div key={menu.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={menu.id}
                    checked={formData.menu_permission_ids.includes(menu.id)}
                    onCheckedChange={(checked) => handleMenuPermissionToggle(menu.id, !!checked)}
                  />
                  <Label htmlFor={menu.id} className="text-sm">
                    {menu.menu_name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onSuccess}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Package'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default CreatePackageForm;
