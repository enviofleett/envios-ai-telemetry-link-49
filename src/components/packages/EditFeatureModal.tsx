
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
import { useToast } from '@/hooks/use-toast';
import { subscriberPackageApi } from '@/services/subscriberPackageApi';
import type { PackageFeature } from '@/types/subscriber-packages';

const editFeatureSchema = z.object({
  feature_name: z.string().min(1, 'Feature name is required'),
  description: z.string().optional(),
});

type EditFeatureFormData = z.infer<typeof editFeatureSchema>;

interface EditFeatureModalProps {
  feature: PackageFeature | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditFeatureModal: React.FC<EditFeatureModalProps> = ({
  feature,
  isOpen,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditFeatureFormData>({
    resolver: zodResolver(editFeatureSchema),
    defaultValues: {
      feature_name: '',
      description: '',
    }
  });

  useEffect(() => {
    if (feature) {
      form.reset({
        feature_name: feature.feature_name,
        description: feature.description || '',
      });
    }
  }, [feature, form]);

  const onSubmit = async (data: EditFeatureFormData) => {
    if (!feature) return;

    setIsLoading(true);
    try {
      // Ensure required fields are present
      const updateData = {
        id: feature.id,
        feature_name: data.feature_name, // This is required
        description: data.description,
      };

      await subscriberPackageApi.updateFeature(updateData);

      toast({
        title: "Success",
        description: "Feature updated successfully",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update feature",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Feature</DialogTitle>
          <DialogDescription>
            Update the feature name and description.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="feature_name">Feature Name</Label>
            <Input
              id="feature_name"
              {...form.register('feature_name')}
              placeholder="Enter feature name"
            />
            {form.formState.errors.feature_name && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.feature_name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Feature description"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Feature'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFeatureModal;
