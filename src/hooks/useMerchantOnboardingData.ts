
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MerchantCategory } from '@/types/merchant-application';

export interface FeeSettings {
    registration_fee: number;
    free_categories_included: number;
    additional_category_fee: number;
    currency: string;
}

const fetchCategories = async (): Promise<MerchantCategory[]> => {
  const { data, error } = await supabase
    .from('merchant_categories')
    .select('id, name, description, icon')
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
};

const fetchMarketplaceSettings = async (): Promise<FeeSettings | null> => {
    const { data: settingsData, error: settingsError } = await supabase
        .from('marketplace_settings')
        .select('registration_fee, free_categories_included, additional_category_fee, currency')
        .limit(1)
        .maybeSingle(); 
    
    if(settingsError) throw settingsError;

    return settingsData;
}

export const useMerchantOnboardingData = () => {
  const { data: categories, isLoading: isLoadingCategories, isError: isErrorCategories, error: errorCategories } = useQuery({
      queryKey: ['merchant-categories'],
      queryFn: fetchCategories,
  });

  const { data: settings, isLoading: isLoadingSettings, isError: isErrorSettings, error: errorSettings } = useQuery({
      queryKey: ['marketplace-settings-fees'],
      queryFn: fetchMarketplaceSettings,
  });

  return {
    categories,
    settings,
    isLoading: isLoadingCategories || isLoadingSettings,
    isError: isErrorCategories || isErrorSettings,
    error: errorCategories || errorSettings,
  };
};
