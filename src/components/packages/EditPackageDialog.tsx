
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { subscriberPackageApi } from '@/services/subscriberPackageApi';
import { useToast } from '@/hooks/use-toast';
import type { SubscriberPackage, UpdatePackageRequest, PackageFeature, MenuPermission } from '@/types/subscriber-packages';

interface EditPackageDialogProps {
  package: SubscriberPackage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditPackageDialog: React.FC<EditPackageDialogProps> = ({
  package: pkg,
  open,
  onOpenChange,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<UpdatePackageRequest>({
    id: pkg.id,
    package_name: pkg.package_name,
    description: pkg.description || '',
    user_type: pkg.user_type,
    subscription_fee_monthly: pkg.subscription_fee_monthly || 0,
    subscription_fee_annually: pkg.subscription_fee_annually || 0,
    referral_discount_percentage: pkg.referral_discount_percentage || 0,
    feature_ids: [],
    menu_permission_ids: []
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

  const { data: packageFeatures } = useQuery({
    queryKey: ['package-features', pkg.id],
    queryFn: () => subscriberPackageApi.getPackageFeatures(pkg.id),
    enabled: open
  });

  const { data: packageMenus } = useQuery({
    queryKey: ['package-menus', pkg.id],
    queryFn: () => subscriberPackageApi.getPackageMenuPermissions(pkg.id),
    enabled: open
  });

  // Update feature and menu IDs when data loads
  useEffect(() => {
    if (packageFeatures) {
      setFormData(prev => ({
        ...prev,
        feature_ids: packageFeatures.map(f => f.id)
      }));
    }
  }, [packageFeatures]);

  useEffect(() => {
    if (packageMenus) {
      setFormData(prev => ({
        ...prev,
        menu_permission_ids: packageMenus.map(m => m.id)
      }));
    }
  }, [packageMenus]);

  const handleFeatureToggle = (featureId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      feature_ids: checked
        ? [...(prev.feature_ids || []), featureId]
        : (prev.feature_ids || []).filter(id => id !== featureId)
    }));
  };

  const handleMenuPermissionToggle = (menuId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      menu_permission_ids: checked
        ? [...(prev.menu_permission_ids || []), menuId]
        : (prev.menu_permission_ids || []).filter(id => id !== menuId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);

    try {
      await subscriberPackageApi.updatePackage(formData);
      toast({
        title: "Package updated",
        description: "The package has been successfully updated."
      });
      onSuccess();
    } catch (error) {
      console.error('Update package error:', error);
      toast({
        title: "Error",
        description: "Failed to update package. Please try again.",
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Package: {pkg.package_name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
                        checked={formData.feature_ids?.includes(feature.id)}
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
                    checked={formData.menu_permission_ids?.includes(menu.id)}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Package'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPackageDialog;
