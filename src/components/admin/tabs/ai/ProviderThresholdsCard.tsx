
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updateAiProviderThreshold } from '@/services/admin/aiAssistantService';
import type { AiProvider, AiProviderThreshold } from '@/types/ai';
import { AI_PROVIDER_CONFIG } from '@/types/ai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const thresholdSchema = z.object({
  daily_limit: z.coerce.number().min(0, 'Must be a non-negative number.'),
  monthly_limit: z.coerce.number().min(0, 'Must be a non-negative number.'),
});

const formSchema = z.object({
  openai: thresholdSchema,
  google_gemini: thresholdSchema,
  anthropic_claude: thresholdSchema,
  hugging_face: thresholdSchema,
});

type ProviderThresholdsFormValues = z.infer<typeof formSchema>;

interface ProviderThresholdsCardProps {
  thresholds: AiProviderThreshold[];
}

const ProviderThresholdsCard: React.FC<ProviderThresholdsCardProps> = ({ thresholds }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const defaultValues = Object.fromEntries(
    Object.keys(AI_PROVIDER_CONFIG).map(provider => {
      const providerThresholds = thresholds.find(t => t.provider === provider);
      return [
        provider,
        {
          daily_limit: providerThresholds?.daily_limit ?? 0,
          monthly_limit: providerThresholds?.monthly_limit ?? 0,
        },
      ];
    })
  ) as ProviderThresholdsFormValues;

  const form = useForm<ProviderThresholdsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const mutation = useMutation<
    AiProviderThreshold | null,
    Error,
    { provider: string; values: { daily_limit: number; monthly_limit: number } }
  >({
    mutationFn: ({ provider, values }) =>
      updateAiProviderThreshold(provider, values),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['aiProviderThresholds'] });
    },
    onError: (err, variables) => {
      toast({
        title: `Error updating ${variables.provider}`,
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (values: ProviderThresholdsFormValues) => {
    const updatePromises = (
      Object.keys(values) as Array<keyof ProviderThresholdsFormValues>
    ).map(provider => mutation.mutateAsync({ provider, values: values[provider] }));

    try {
      await Promise.all(updatePromises);
      toast({
        title: 'Success',
        description: 'Provider thresholds updated successfully.',
      });
    } catch (error) {
      // Individual errors are handled by the mutation's onError callback
      console.error("One or more threshold updates failed.", error);
    }
  };
  
  const isSubmitting = form.formState.isSubmitting;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider Prompt Thresholds</CardTitle>
        <CardDescription>
          Set daily and monthly prompt limits for each AI provider to control usage and costs. Set to 0 for unlimited.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(AI_PROVIDER_CONFIG).map(([providerKey, config]) => {
                const provider = providerKey as keyof ProviderThresholdsFormValues;
                return (
                  <div key={provider} className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-semibold">{config.name}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`${provider}.daily_limit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Daily Limit</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g., 1000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`${provider}.monthly_limit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Limit</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g., 20000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                {(isSubmitting || mutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Thresholds
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProviderThresholdsCard;
