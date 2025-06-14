
import React from 'react';
import { ProductDetailsModal } from '../ProductDetailsModal';
import { VehicleSelectionModal } from '../VehicleSelectionModal';
import { PaymentModal } from '../PaymentModal';
import { MerchantOnboardingModal } from '../MerchantOnboardingModal';
import { EnhancedMerchantLogin } from '../EnhancedMerchantLogin';

interface MarketplaceModalsProps {
  state: any;
  vehicles: any[];
  handleActivateService: () => void;
  handleVehicleToggle: (id: string) => void;
  handleProceedToPayment: () => void;
  handlePaymentComplete: () => void;
  handleMerchantRegistration: (data: any) => void;
  handleMerchantLogin: (creds: any) => void;
}

export const MarketplaceModals: React.FC<MarketplaceModalsProps> = ({
  state,
  vehicles,
  handleActivateService,
  handleVehicleToggle,
  handleProceedToPayment,
  handlePaymentComplete,
  handleMerchantRegistration,
  handleMerchantLogin,
}) => (
  <>
    <ProductDetailsModal
      product={state.selectedProduct}
      isOpen={state.showProductDetails}
      onClose={() => state.setShowProductDetails(false)}
      onActivate={handleActivateService}
    />
    <VehicleSelectionModal
      product={state.selectedProduct}
      vehicles={vehicles}
      isOpen={state.showVehicleSelection}
      onClose={() => state.setShowVehicleSelection(false)}
      selectedVehicles={state.selectedVehicles}
      onVehicleToggle={handleVehicleToggle}
      onProceedToPayment={handleProceedToPayment}
    />
    <PaymentModal
      product={state.selectedProduct}
      selectedVehicles={state.selectedVehicles}
      isOpen={state.showPayment}
      onClose={() => state.setShowPayment(false)}
      onComplete={handlePaymentComplete}
    />
    <MerchantOnboardingModal
      isOpen={state.showMerchantOnboarding}
      onClose={() => state.setShowMerchantOnboarding(false)}
      onSubmit={handleMerchantRegistration}
    />
    <EnhancedMerchantLogin
      isOpen={state.showMerchantLogin}
      onClose={() => state.setShowMerchantLogin(false)}
      onLogin={handleMerchantLogin}
    />
  </>
);
