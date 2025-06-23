
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { subscriberPackageApi } from '@/services/subscriberPackageApi';
import type { SubscriberPackage } from '@/types/subscriber-packages';

const editPackageSchema = z.object({
  package_name: z.string().min(1, 'Package name is required'),
  description: z.string().optional(),
  user_type: z.enum(['end_user', 'sub_admin', 'both']),
  subscription_fee_monthly: z.number().min(0).optional(),
  subscription_fee_annually: z.number().min(0).optional(),
  referral_discount_percentage: z.number().min(0).max(100).default(0),
  vehicle_limit: z.number().min(1).optional(),
  chatbot_prompt_limit: z.number().min(0).default(100),
});

type EditPackageFormData = z.infer<typeof editPackageSchema>;

interface EditPackageDialogProps {
  package: SubscriberPackage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditPackageDialog: React.FC<EditPackageDialogProps> = ({
  package: packageData,
  open,
  onOpenChange,
  onSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditPackageFormData>({
    resolver: zodResolver(editPackageSchema),
    defaultValues: {
      package_name: '',
      description: '',
      user_type: 'end_user',
      subscription_fee_monthly: 0,
      subscription_fee_annually: 0,
      referral_discount_percentage: 0,
      vehicle_limit: undefined,
      chatbot_prompt_limit: 100,
    }
  });

  useEffect(() => {
    if (packageData) {
      form.reset({
        package_name: packageData.package_name,
        description: packageData.description || '',
        user_type: packageData.user_type,
        subscription_fee_monthly: packageData.subscription_fee_monthly || 0,
        subscription_fee_annually: packageData.subscription_fee_annually || 0,
        referral_discount_percentage: packageData.referral_discount_percentage,
        vehicle_limit: packageData.vehicle_limit || undefined,
        chatbot_prompt_limit: packageData.chatbot_prompt_limit,
      });
    }
  }, [packageData, form]);

  const onSubmit = async (data: EditPackageFormData) => {
    if (!packageData) return;

    setIsLoading(true);
    try {
      await subscriberPackageApi.updatePackage({
        id: packageData.id,
        ...data,
        feature_ids: [], // Will be handled separately
        menu_permission_ids: [], // Will be handled separately
      });

      toast({
        title: "Success",
        description: "Package updated successfully",
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update package",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Package</DialogTitle>
          <DialogDescription>
            Update the package details and pricing information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                placeholder="Unlimited"
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

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Package'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPackageDialog;
