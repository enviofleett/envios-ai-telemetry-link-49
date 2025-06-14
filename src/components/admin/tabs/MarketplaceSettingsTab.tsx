
import React from "react";
import MarketplaceSettingsCard from "./marketplace-settings/MarketplaceSettingsCard";
import MarketplaceSettingsForm from "./marketplace-settings/MarketplaceSettingsForm";
import { useMarketplaceSettingsForm } from "@/hooks/useMarketplaceSettingsForm";

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
    <MarketplaceSettingsCard>
      <MarketplaceSettingsForm
        form={form}
        handleChange={handleChange}
        handleSave={handleSave}
        isSaving={isSaving}
        hasId={!!settings?.id}
      />
    </MarketplaceSettingsCard>
  );
};

export default MarketplaceSettingsTab;
