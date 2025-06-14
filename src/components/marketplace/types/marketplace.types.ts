
// Marketplace refactor shared types

export type UserRole = 'subscriber' | 'merchant' | 'admin';

export interface MarketplaceState {
  activeCategory: string;
  selectedProduct: any;
  showProductDetails: boolean;
  showVehicleSelection: boolean;
  showPayment: boolean;
  showMerchantOnboarding: boolean;
  showMerchantLogin: boolean;
  selectedVehicles: string[];
  searchQuery: string;
  userRole: UserRole;
  setActiveCategory: (val: string) => void;
  setSelectedProduct: (product: any) => void;
  setShowProductDetails: (open: boolean) => void;
  setShowVehicleSelection: (open: boolean) => void;
  setShowPayment: (open: boolean) => void;
  setShowMerchantOnboarding: (open: boolean) => void;
  setShowMerchantLogin: (open: boolean) => void;
  setSelectedVehicles: (ids: string[]) => void;
  setSearchQuery: (q: string) => void;
  setUserRole: (role: UserRole) => void;
}

