
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useBranding } from '@/contexts/BrandingContext';
import type { EnhancedBrandingSettings } from '@/types/branding-settings';
import { defaultBrandingSettings } from '@/types/branding-settings';
import { validateBrandingSetting } from '@/utils/branding-validation';
import { fetchBrandingSettingsFromDB, updateBrandingSettingInDB } from '@/services/branding-settings-api';

export const useEnhancedBrandingSettings = ({ userId }: { userId?: string } = {}) => {
  const [settings, setSettings] = useState<EnhancedBrandingSettings>(defaultBrandingSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { refreshBranding } = useBranding();

  useEffect(() => {
    // Only fetch settings if a userId is provided.
    if (userId) {
      fetchBrandingSettings(userId);
    } else {
      // If no userId, clear settings to defaults and stop loading.
      // This prevents using stale data when an admin deselects a user.
      setSettings(defaultBrandingSettings);
      setIsLoading(false);
    }
    // The hook will re-run this effect whenever the userId changes.
  }, [userId]);

  const fetchBrandingSettings = async (targetUserId: string) => {
    try {
      setIsLoading(true);
      const fetchedSettings = await fetchBrandingSettingsFromDB(targetUserId);
      setSettings(fetchedSettings);
    } catch (error: any) {
      console.error('Error fetching branding settings:', error);
      toast({
        title: "Error",
        description: "Failed to load branding settings.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof EnhancedBrandingSettings, value: string | boolean) => {
    // An admin must have selected a user to update their settings.
    if (!userId) {
      toast({ 
        title: "Error", 
        description: "No user selected to update.", 
        variant: "destructive" 
      });
      return;
    }

    const validationError = validateBrandingSetting(key, value);
    if (validationError) {
      toast({ 
        title: "Validation Error", 
        description: validationError, 
        variant: "destructive" 
      });
      return;
    }

    try {
      setIsSaving(true);
      const updatedSettings = { ...settings, [key]: value };
      setSettings(updatedSettings);

      await updateBrandingSettingInDB(userId, updatedSettings);

      toast({ 
        title: "Success", 
        description: "Branding settings updated successfully." 
      });
      
      // Refresh branding context to apply changes immediately.
      await refreshBranding();

    } catch (error: any) {
      console.error('Error updating branding settings:', error);
      setSettings(settings); // Revert on error
      toast({ 
        title: "Error", 
        description: `Failed to update settings: ${error.message}`, 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return { 
    settings, 
    isLoading, 
    isSaving, 
    updateSetting, 
    refreshBranding: () => userId ? fetchBrandingSettings(userId) : Promise.resolve()
  };
};
