
import React from "react";
import { useMarketplaceProducts } from "@/hooks/useMarketplaceProducts";
import { useUnifiedVehicleData } from "@/hooks/useUnifiedVehicleData";
import { useToast } from "@/hooks/use-toast";
import { MarketplaceBanner } from "./MarketplaceBanner";
import { useMarketplaceState } from "./hooks/useMarketplaceState";
import { MarketplaceHeader } from "./components/MarketplaceHeader";
import { ProductCatalog } from "./components/ProductCatalog";
import { MarketplaceModals } from "./modals/MarketplaceModals";
import { MerchantPortalView } from "./components/MerchantPortalView";

export const EnhancedMarketplace: React.FC = () => {
  const state = useMarketplaceState();
  const { toast } = useToast();
  const { products, isLoading } = useMarketplaceProducts();
  const { vehicles } = useUnifiedVehicleData();

  // Filtered products by category/search
  const filteredProducts = products.filter((product) => {
    const matchesCategory = product.category === state.activeCategory;
    const matchesSearch =
      state.searchQuery === "" ||
      product.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(state.searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handlers (could move these to a hook for more refactoring)
  const handleProductSelect = (product: any) => {
    state.setSelectedProduct(product);
    state.setShowProductDetails(true);
  };
  const handleActivateService = () => {
    state.setShowProductDetails(false);
    state.setShowVehicleSelection(true);
  };
  const handleVehicleToggle = (vehicleId: string) => {
    state.setSelectedVehicles(
      state.selectedVehicles.includes(vehicleId)
        ? state.selectedVehicles.filter((id) => id !== vehicleId)
        : [...state.selectedVehicles, vehicleId]
    );
  };
  const handleProceedToPayment = () => {
    state.setShowVehicleSelection(false);
    state.setShowPayment(true);
  };
  const handlePaymentComplete = () => {
    state.setShowPayment(false);
    state.setSelectedVehicles([]);
    state.setSelectedProduct(null);
    toast({
      title: "Service Activated",
      description: "Your service has been successfully activated for the selected vehicles.",
    });
  };
  const handleMerchantLogin = (creds: { email: string; password: string }) => {
    state.setUserRole("merchant");
    state.setShowMerchantLogin(false);
    toast({
      title: "Login Successful",
      description: "Welcome back! You can now manage your products and view analytics.",
    });
  };
  const handleMerchantRegistration = async (data: any) => {
    state.setShowMerchantOnboarding(false);
    toast({
      title: "Registration Submitted",
      description: "Please complete payment and await admin approval.",
    });
  };

  if (state.userRole === "merchant")
    return <MerchantPortalView onSwitchRole={() => state.setUserRole("subscriber")} />;

  return (
    <div className="space-y-6">
      <MarketplaceHeader state={state} />
      <MarketplaceBanner
        onMerchantLogin={() => state.setShowMerchantLogin(true)}
        onMerchantRegister={() => state.setShowMerchantOnboarding(true)}
      />
      <ProductCatalog
        state={state}
        filteredProducts={filteredProducts}
        isLoading={isLoading}
        onProductSelect={handleProductSelect}
      />
      <MarketplaceModals
        state={state}
        vehicles={vehicles}
        handleActivateService={handleActivateService}
        handleVehicleToggle={handleVehicleToggle}
        handleProceedToPayment={handleProceedToPayment}
        handlePaymentComplete={handlePaymentComplete}
        handleMerchantRegistration={handleMerchantRegistration}
        handleMerchantLogin={handleMerchantLogin}
      />
    </div>
  );
};
