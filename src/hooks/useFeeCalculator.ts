
import { useMemo } from 'react';
import { useMerchantFeeOverrides } from './useMerchantFeeOverrides';
import { useCategoryCommissionRates } from './useCategoryCommissionRates';
import { useCountryMarketplaceSettings } from './useCountryMarketplaceSettings';
import { useMarketplaceSettingsForm } from './useMarketplaceSettingsForm';
import type { MerchantFeeOverride } from '@/types/merchant-fee-override';

interface FeeCalculationContext {
  merchantId?: string;
  categoryId?: string;
  countryCode: string;
}

interface FeeCalculationResult {
  commissionRate: number | null;
  commissionRateSource: string;
  registrationFee: number | null;
  registrationFeeSource: string;
  currency: string;
}

export function useFeeCalculator() {
  const { data: merchantOverrides, isLoading: isLoadingMerchantOverrides } = useMerchantFeeOverrides();
  const { data: categoryRates, isLoading: isLoadingCategoryRates } = useCategoryCommissionRates();
  const { data: countrySettings, isLoading: isLoadingCountrySettings } = useCountryMarketplaceSettings();
  const { settings: globalSettings, isLoading: isLoadingGlobalSettings } = useMarketplaceSettingsForm();

  const isLoading =
    isLoadingMerchantOverrides ||
    isLoadingCategoryRates ||
    isLoadingCountrySettings ||
    isLoadingGlobalSettings;

  const calculateFees = useMemo(() => {
    return (context: FeeCalculationContext): FeeCalculationResult | null => {
      if (isLoading) {
        return null;
      }

      const { merchantId, categoryId, countryCode } = context;

      let finalCommissionRate: number | null = null;
      let commissionRateSource: string = 'Not Found';
      let finalRegistrationFee: number | null = null;
      let registrationFeeSource: string = 'Not Found';
      
      const findBestMerchantOverride = (merchantId: string, countryCode: string): MerchantFeeOverride | undefined => {
          if (!merchantOverrides) return undefined;
          const countrySpecific = merchantOverrides.find(o => o.merchant_id === merchantId && o.country_code === countryCode);
          if (countrySpecific) return countrySpecific;
          return merchantOverrides.find(o => o.merchant_id === merchantId && (o.country_code == null || o.country_code === ''));
      }

      // 1. Merchant Override
      if (merchantId) {
        const override = findBestMerchantOverride(merchantId, countryCode);
        if (override) {
          if (override.commission_rate_override != null) {
            finalCommissionRate = override.commission_rate_override;
            commissionRateSource = `Merchant Override`;
          }
          if (override.registration_fee_override != null) {
            finalRegistrationFee = override.registration_fee_override;
            registrationFeeSource = `Merchant Override`;
          }
        }
      }

      // 2. Category Commission Rate (only for commission)
      if (finalCommissionRate === null && categoryId) {
        const categoryRate = categoryRates?.find(
          r => r.category_id === categoryId && r.country_code === countryCode
        );
        if (categoryRate) {
          finalCommissionRate = categoryRate.commission_rate;
          commissionRateSource = `Category Rate`;
        }
      }

      // 3. Country Settings
      const countrySetting = countrySettings?.find(s => s.country_code === countryCode);
      if (countrySetting) {
        if (finalCommissionRate === null) {
          finalCommissionRate = countrySetting.default_commission_rate;
          commissionRateSource = `Country Default`;
        }
        if (finalRegistrationFee === null) {
          finalRegistrationFee = countrySetting.default_registration_fee;
          registrationFeeSource = `Country Default`;
        }
      }

      // 4. Global Settings
      if (globalSettings) {
        if (finalCommissionRate === null) {
          finalCommissionRate = globalSettings.commission_rate;
          commissionRateSource = `Global Default`;
        }
        if (finalRegistrationFee === null) {
          finalRegistrationFee = globalSettings.registration_fee;
          registrationFeeSource = `Global Default`;
        }
      }

      let finalCurrency = globalSettings?.currency ?? 'USD';
      if (countrySetting) finalCurrency = countrySetting.currency;

      return {
        commissionRate: finalCommissionRate,
        commissionRateSource,
        registrationFee: finalRegistrationFee,
        registrationFeeSource,
        currency: finalCurrency
      };
    };
  }, [isLoading, merchantOverrides, categoryRates, countrySettings, globalSettings]);

  return { calculateFees, isLoading };
}
