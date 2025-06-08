
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BrandingSettings {
  id?: string;
  user_id?: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  border_color: string;
  muted_color: string;
  font_family_heading: string;
  font_family_body: string;
  font_size_scale: string;
  button_style: string;
  custom_css: string;
  created_at?: string;
  updated_at?: string;
}

export const useBrandingSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['branding-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data || {
        logo_url: '',
        favicon_url: '',
        primary_color: '#3b82f6',
        secondary_color: '#6366f1',
        accent_color: '#2563eb',
        background_color: '#ffffff',
        text_color: '#1f2937',
        border_color: '#e5e7eb',
        muted_color: '#6b7280',
        font_family_heading: 'Inter',
        font_family_body: 'Inter',
        font_size_scale: 'medium',
        button_style: 'rounded',
        custom_css: ''
      };
    }
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<BrandingSettings>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('branding_settings')
        .upsert({
          user_id: user.id,
          ...newSettings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding-settings'] });
      toast({
        title: "Success",
        description: "Branding settings saved successfully"
      });
    },
    onError: (error) => {
      console.error('Failed to save branding settings:', error);
      toast({
        title: "Error",
        description: "Failed to save branding settings",
        variant: "destructive"
      });
    }
  });

  const uploadAsset = useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName);

      return publicUrl;
    },
    onError: (error) => {
      console.error('Failed to upload asset:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      });
    }
  });

  return {
    settings,
    isLoading,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
    uploadAsset: uploadAsset.mutate,
    isUploading: uploadAsset.isPending
  };
};
