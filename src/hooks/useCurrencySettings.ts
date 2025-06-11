
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/contexts/CurrencyContext';

export interface CurrencySettings {
  currency_code: string;
  currency_symbol: string;
  currency_format: string;
}

const defaultCurrencySettings: CurrencySettings = {
  currency_code: 'USD',
  currency_symbol: '$',
  currency_format: 'en-US',
};

export const useCurrencySettings = () => {
  const [settings, setSettings] = useState<CurrencySettings>(defaultCurrencySettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { refreshCurrency } = useCurrency();

  useEffect(() => {
    fetchCurrencySettings();
  }, []);

  const fetchCurrencySettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('company_settings')
        .select('currency_code, currency_symbol, currency_format')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching currency settings:', error);
        return;
      }

      if (data) {
        setSettings({
          currency_code: data.currency_code || defaultCurrencySettings.currency_code,
          currency_symbol: data.currency_symbol || defaultCurrencySettings.currency_symbol,
          currency_format: data.currency_format || defaultCurrencySettings.currency_format,
        });
      }
    } catch (error) {
      console.error('Error in fetchCurrencySettings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCurrencySettings = async (newSettings: Partial<CurrencySettings>) => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      const { error } = await supabase
        .from('company_settings')
        .upsert({
          user_id: user.id,
          currency_code: updatedSettings.currency_code,
          currency_symbol: updatedSettings.currency_symbol,
          currency_format: updatedSettings.currency_format,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating currency settings:', error);
        setSettings(settings);
        toast({
          title: "Error",
          description: "Failed to update currency settings",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Currency settings updated",
        });
        
        // Refresh currency context
        await refreshCurrency();
      }
    } catch (error) {
      console.error('Error in updateCurrencySettings:', error);
      setSettings(settings);
      toast({
        title: "Error",
        description: "Failed to update currency settings",
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
    updateCurrencySettings,
  };
};
