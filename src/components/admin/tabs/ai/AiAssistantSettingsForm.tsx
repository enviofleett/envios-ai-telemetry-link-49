
import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getAiAssistantSettings, updateAiAssistantSettings } from '@/services/admin/aiAssistantService';
import type { AiAssistantSettings } from '@/types/ai';
import { AI_PROVIDER_CONFIG } from '@/types/ai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  is_active: z.boolean(),
  provider: z.enum(['openai', 'google_gemini', 'anthropic_claude', 'hugging_face']),
  model: z.string().min(1, 'Model is required.'),
  system_prompt: z.string().nullable(),
});

type AiAssistantFormValues = z.infer<typeof formSchema>;

const AiAssistantSettingsForm: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading, isError, error } = useQuery({
    queryKey: ['aiAssistantSettings'],
    queryFn: getAiAssistantSettings,
  });

  const mutation = useMutation({
    mutationFn: updateAiAssistantSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['aiAssistantSettings'], data);
      toast({
        title: 'Success',
        description: 'AI Assistant settings updated successfully.',
      });
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: `Failed to update settings: ${err.message}`,
        variant: 'destructive',
      });
    },
  });

  const form = useForm<AiAssistantFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      is_active: false,
      provider: 'openai',
      model: 'gpt-4o-mini',
      system_prompt: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        is_active: settings.is_active,
        provider: settings.provider,
        model: settings.model,
        system_prompt: settings.system_prompt,
      });
    }
  }, [settings, form]);

  const onSubmit = (values: AiAssistantFormValues) => {
    mutation.mutate(values);
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Settings</AlertTitle>
        <AlertDescription>{(error as Error)?.message || 'An unknown error occurred.'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Configuration</CardTitle>
            <CardDescription>Activate and configure the AI assistant. For the assistant to work, you must provide an API key for the selected provider.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Enable AI Assistant</FormLabel>
                    <FormDescription>
                      Turn the chatbot on or off for all users.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>AI Provider & Model</CardTitle>
            <CardDescription>Select the AI provider and specify the model to use. You will need to provide an API key for the selected provider.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Provider</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an AI provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(AI_PROVIDER_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the AI service to power the chatbot.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., gpt-4o-mini" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the exact model name from the selected provider.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Prompt</CardTitle>
            <CardDescription>
              Define the base instructions and personality for the AI assistant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="system_prompt"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="You are a helpful assistant for a fleet management platform..."
                      className="min-h-[150px]"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AiAssistantSettingsForm;
