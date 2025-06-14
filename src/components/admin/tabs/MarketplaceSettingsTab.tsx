import React from "react";
import MarketplaceSettingsCard from "./marketplace-settings/MarketplaceSettingsCard";
import MarketplaceSettingsForm from "./marketplace-settings/MarketplaceSettingsForm";
import CategoryCommissionRatesCard from "./marketplace-settings/CategoryCommissionRatesCard";
import MerchantFeeOverridesCard from "./marketplace-settings/MerchantFeeOverridesCard";
import CountryMarketplaceSettingsCard from "./marketplace-settings/CountryMarketplaceSettingsCard";
import { useMarketplaceSettingsForm } from "@/hooks/useMarketplaceSettingsForm";
import { FeeCalculatorCard } from "./marketplace-settings/FeeCalculatorCard";

export const MarketplaceSettingsTab: React.FC = () => {
  const {
    form,
    handleChange,
    handleSave,
    isLoading,
    isError,
    error,
    isSaving,
    settings,
  } = useMarketplaceSettingsForm();

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  if (isError)
    return (
      <div className="text-red-600 py-4">
        Error loading settings: {(error as any)?.message || "Unknown error"}
      </div>
    );

  return (
    <div className="space-y-8">
      <MarketplaceSettingsCard>
        <MarketplaceSettingsForm
          form={form}
          handleChange={handleChange}
          handleSave={handleSave}
          isSaving={isSaving}
          hasId={!!settings?.id}
        />
      </MarketplaceSettingsCard>

      {/* Reordered cards to follow logical hierarchy */}
      <CountryMarketplaceSettingsCard />
      <CategoryCommissionRatesCard />
      <MerchantFeeOverridesCard />
      
      {/* New card for fee calculator */}
      <FeeCalculatorCard />
    </div>
  );
};

export default MarketplaceSettingsTab;
