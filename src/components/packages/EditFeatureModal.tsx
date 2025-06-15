
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriberPackageApi } from '@/services/subscriberPackageApi';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { PackageFeature } from '@/types/subscriber-packages';

interface EditFeatureModalProps {
  feature: PackageFeature | null;
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  feature_name: z.string().min(3, { message: 'Feature name must be at least 3 characters long.' }),
  description: z.string().optional(),
});

const EditFeatureModal: React.FC<EditFeatureModalProps> = ({ feature, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      feature_name: feature?.feature_name || '',
      description: feature?.description || '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: {id: string, feature_name: string, description?: string}) => subscriberPackageApi.updateFeature(values),
    onSuccess: () => {
      toast({
        title: 'Feature Updated',
        description: 'The feature has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['package-features'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update feature: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!feature) return;
    mutation.mutate({ id: feature.id, ...values });
  };

  if (!feature) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Feature</DialogTitle>
          <DialogDescription>
            Update the name and description for the feature: {feature.feature_name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="feature_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feature Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Real-time Tracking" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Track your vehicles in real-time on the map."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFeatureModal;
