
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import { ProductDetailsModal } from './ProductDetailsModal';
import { VehicleSelectionModal } from './VehicleSelectionModal';
import { PaymentModal } from './PaymentModal';
import { MerchantOnboardingModal } from './MerchantOnboardingModal';
import { MerchantLoginModal } from './MerchantLoginModal';
import { MarketplaceBanner } from './MarketplaceBanner';
import { ProductCard } from './ProductCard';
import { useMarketplaceProducts } from '@/hooks/useMarketplaceProducts';
import { 
  Search, 
  Star, 
  UserPlus, 
  LogIn,
  Store 
} from 'lucide-react';

interface EnhancedMarketplaceProps {
  userRole?: 'admin' | 'subscriber' | 'merchant';
}

export function EnhancedMarketplace({ userRole = 'subscriber' }: EnhancedMarketplaceProps) {
  const [activeCategory, setActiveCategory] = useState('telemetry');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showActivation, setShowActivation] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [showMerchantOnboarding, setShowMerchantOnboarding] = useState(false);
  const [showMerchantLogin, setShowMerchantLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Use real vehicle data from GP51
  const { vehicles } = useUnifiedVehicleData({
    search: '',
    status: 'all'
  });

  // Use marketplace products hook
  const { products, isLoading } = useMarketplaceProducts();

  const filteredProducts = products.filter(product => 
    product.category === activeCategory &&
    (searchQuery === '' || 
     product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     product.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  const handleActivate = () => {
    setShowProductDetails(false);
    setShowActivation(true);
  };

  const handleVehicleToggle = (vehicleId: string) => {
    setSelectedVehicles(prev =>
      prev.includes(vehicleId) 
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const handleProceedToPayment = () => {
    setShowActivation(false);
    setShowPayment(true);
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    setSelectedVehicles([]);
    setSelectedProduct(null);
    // Here you would typically integrate with your payment processing
    console.log('Payment completed for vehicles:', selectedVehicles);
  };

  const handleMerchantRegistration = (data: any) => {
    console.log('Merchant registration:', data);
    setShowMerchantOnboarding(false);
  };

  const handleMerchantLogin = (credentials: { email: string; password: string }) => {
    console.log('Merchant login:', credentials);
    setShowMerchantLogin(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground">
            Discover premium services and products for your fleet
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowMerchantLogin(true)}>
            <LogIn className="h-4 w-4 mr-2" />
            Merchant Login
          </Button>
          <Button onClick={() => setShowMerchantOnboarding(true)} className="bg-green-600 hover:bg-green-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Become a Merchant
          </Button>
          
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search marketplace..." 
              className="pl-8 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Merchant Banner */}
      <MarketplaceBanner 
        onMerchantLogin={() => setShowMerchantLogin(true)}
        onMerchantRegister={() => setShowMerchantOnboarding(true)}
      />

      {/* Product Categories */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="telemetry">Premium Telemetry</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="parts">Spare Parts</TabsTrigger>
        </TabsList>

        <TabsContent value="telemetry" className="space-y-6 pt-4">
          <div>
            <h3 className="text-xl font-semibold">Premium Telemetry Features</h3>
            <p className="text-muted-foreground">Enhance your fleet management with advanced telemetry solutions</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id}
                product={product}
                onSelect={handleProductClick}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insurance" className="space-y-6 pt-4">
          <div>
            <h3 className="text-xl font-semibold">Fleet Insurance</h3>
            <p className="text-muted-foreground">Protect your fleet with tailored insurance packages</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id}
                product={product}
                onSelect={handleProductClick}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="parts" className="space-y-6 pt-4">
          <div>
            <h3 className="text-xl font-semibold">Spare Parts & Maintenance</h3>
            <p className="text-muted-foreground">Quality parts and maintenance packages for your fleet</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id}
                product={product}
                onSelect={handleProductClick}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={showProductDetails}
        onClose={() => setShowProductDetails(false)}
        onActivate={handleActivate}
      />

      <VehicleSelectionModal
        product={selectedProduct}
        vehicles={vehicles}
        isOpen={showActivation}
        onClose={() => setShowActivation(false)}
        selectedVehicles={selectedVehicles}
        onVehicleToggle={handleVehicleToggle}
        onProceedToPayment={handleProceedToPayment}
      />

      <PaymentModal
        product={selectedProduct}
        selectedVehicles={selectedVehicles}
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onComplete={handlePaymentComplete}
      />

      <MerchantOnboardingModal
        isOpen={showMerchantOnboarding}
        onClose={() => setShowMerchantOnboarding(false)}
        onSubmit={handleMerchantRegistration}
      />

      <MerchantLoginModal
        isOpen={showMerchantLogin}
        onClose={() => setShowMerchantLogin(false)}
        onSubmit={handleMerchantLogin}
      />
    </div>
  );
}
