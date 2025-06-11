
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useBranding } from '@/contexts/BrandingContext';
import type { EnhancedBrandingSettings } from '@/types/branding-settings';
import { defaultBrandingSettings } from '@/types/branding-settings';
import { validateBrandingSetting } from '@/utils/branding-validation';
import { fetchBrandingSettingsFromDB, updateBrandingSettingInDB } from '@/services/branding-settings-api';

export const useEnhancedBrandingSettings = ({ userId }: { userId?: string } = {}) => {
  const [originalSettings, setOriginalSettings] = useState<EnhancedBrandingSettings>(defaultBrandingSettings);
  const [currentSettings, setCurrentSettings] = useState<EnhancedBrandingSettings>(defaultBrandingSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();
  const { refreshBranding } = useBranding();

  useEffect(() => {
    if (userId) {
      fetchBrandingSettings(userId);
    } else {
      setOriginalSettings(defaultBrandingSettings);
      setCurrentSettings(defaultBrandingSettings);
      setIsLoading(false);
      setHasUnsavedChanges(false);
    }
  }, [userId]);

  const fetchBrandingSettings = async (targetUserId: string) => {
    try {
      setIsLoading(true);
      const fetchedSettings = await fetchBrandingSettingsFromDB(targetUserId);
      setOriginalSettings(fetchedSettings);
      setCurrentSettings(fetchedSettings);
      setHasUnsavedChanges(false);
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

  const updateSetting = useCallback((key: keyof EnhancedBrandingSettings, value: string | boolean) => {
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

    const updatedSettings = { ...currentSettings, [key]: value };
    setCurrentSettings(updatedSettings);
    
    // Check if there are changes compared to original
    const hasChanges = JSON.stringify(updatedSettings) !== JSON.stringify(originalSettings);
    setHasUnsavedChanges(hasChanges);
  }, [userId, currentSettings, originalSettings, toast]);

  const saveAllChanges = async () => {
    if (!userId) {
      toast({ 
        title: "Error", 
        description: "No user selected to update.", 
        variant: "destructive" 
      });
      return false;
    }

    if (!hasUnsavedChanges) {
      toast({ 
        title: "Info", 
        description: "No changes to save.", 
      });
      return true;
    }

    try {
      setIsSaving(true);
      await updateBrandingSettingInDB(userId, currentSettings);

      setOriginalSettings(currentSettings);
      setHasUnsavedChanges(false);

      toast({ 
        title: "Success", 
        description: "All branding settings saved successfully." 
      });
      
      await refreshBranding();
      return true;

    } catch (error: any) {
      console.error('Error saving branding settings:', error);
      toast({ 
        title: "Error", 
        description: `Failed to save settings: ${error.message}`, 
        variant: "destructive" 
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const discardChanges = () => {
    setCurrentSettings(originalSettings);
    setHasUnsavedChanges(false);
    toast({ 
      title: "Info", 
      description: "Changes discarded." 
    });
  };

  const getChangedFields = () => {
    const changed: string[] = [];
    Object.keys(currentSettings).forEach(key => {
      const typedKey = key as keyof EnhancedBrandingSettings;
      if (currentSettings[typedKey] !== originalSettings[typedKey]) {
        changed.push(key);
      }
    });
    return changed;
  };

  return { 
    settings: currentSettings,
    isLoading, 
    isSaving, 
    hasUnsavedChanges,
    updateSetting,
    saveAllChanges,
    discardChanges,
    getChangedFields,
    refreshBranding: () => userId ? fetchBrandingSettings(userId) : Promise.resolve()
  };
};
