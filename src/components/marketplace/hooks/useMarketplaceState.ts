
import { useState } from 'react';
import { UserRole, MarketplaceState } from '../types/marketplace.types';

export const useMarketplaceState = (): MarketplaceState => {
  const [activeCategory, setActiveCategory] = useState('telemetry');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showVehicleSelection, setShowVehicleSelection] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showMerchantOnboarding, setShowMerchantOnboarding] = useState(false);
  const [showMerchantLogin, setShowMerchantLogin] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('subscriber');

  return {
    activeCategory,
    selectedProduct,
    showProductDetails,
    showVehicleSelection,
    showPayment,
    showMerchantOnboarding,
    showMerchantLogin,
    selectedVehicles,
    searchQuery,
    userRole,
    setActiveCategory,
    setSelectedProduct,
    setShowProductDetails,
    setShowVehicleSelection,
    setShowPayment,
    setShowMerchantOnboarding,
    setShowMerchantLogin,
    setSelectedVehicles,
    setSearchQuery,
    setUserRole,
  };
};
