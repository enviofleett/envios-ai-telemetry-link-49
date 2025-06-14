import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, BarChart3, Package } from 'lucide-react';
import { useMarketplaceProducts } from '@/hooks/useMarketplaceProducts';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import { ProductCard } from './ProductCard';
import { MarketplaceBanner } from './MarketplaceBanner';
import { ProductDetailsModal } from './ProductDetailsModal';
import { VehicleSelectionModal } from './VehicleSelectionModal';
import { PaymentModal } from './PaymentModal';
import { MerchantOnboardingModal } from './MerchantOnboardingModal';
import { EnhancedMerchantLogin } from './EnhancedMerchantLogin';
import { MerchantAnalytics } from './MerchantAnalytics';
import { MerchantDashboard } from './MerchantDashboard';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'subscriber' | 'merchant' | 'admin';

export const EnhancedMarketplace: React.FC = () => {
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

  const { products, isLoading } = useMarketplaceProducts();
  const { vehicles } = useUnifiedVehicleData();
  const { toast } = useToast();

  const filteredProducts = products.filter(product => {
    const matchesCategory = product.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  const handleActivateService = () => {
    setShowProductDetails(false);
    setShowVehicleSelection(true);
  };

  const handleVehicleToggle = (vehicleId: string) => {
    setSelectedVehicles(prev => 
      prev.includes(vehicleId) 
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const handleProceedToPayment = () => {
    setShowVehicleSelection(false);
    setShowPayment(true);
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    setSelectedVehicles([]);
    setSelectedProduct(null);
    toast({
      title: 'Service Activated',
      description: 'Your service has been successfully activated for the selected vehicles.',
    });
  };

  const handleMerchantLogin = (credentials: { email: string; password: string }) => {
    console.log('Merchant login:', credentials);
    setUserRole('merchant');
    setShowMerchantLogin(false);
    toast({
      title: 'Login Successful',
      description: 'Welcome back! You can now manage your products and view analytics.',
    });
  };

  const handleMerchantRegistration = async (data: any) => {
    try {
      setShowMerchantOnboarding(false);
      // (Optional) Show onboarding confirmation or refresh merchant center
      toast({
        title: 'Registration Submitted',
        description: 'Please complete payment and await admin approval.',
      });
    } catch (err: any) {
      toast({
        title: 'Registration Failed',
        description: err.message || 'An error occurred.',
        variant: "destructive",
      });
    }
  };

  // If merchant, show merchant dashboard
  if (userRole === 'merchant') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Merchant Portal</h1>
            <p className="text-muted-foreground">
              Manage your products and track your business performance
            </p>
          </div>
          <Button variant="outline" onClick={() => setUserRole('subscriber')}>
            Switch to Customer View
          </Button>
        </div>

        <MerchantDashboard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground">
            Discover premium services and products for your fleet
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-8 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => setUserRole('merchant')}>
            Merchant View
          </Button>
        </div>
      </div>

      <MarketplaceBanner
        onMerchantLogin={() => setShowMerchantLogin(true)}
        onMerchantRegister={() => setShowMerchantOnboarding(true)}
      />

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="telemetry">Premium Telemetry</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="parts">Spare Parts</TabsTrigger>
        </TabsList>

        <TabsContent value="telemetry" className="space-y-6 mt-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Premium Telemetry Features</h3>
            <p className="text-muted-foreground mb-6">
              Enhance your fleet management with advanced telemetry solutions
            </p>
          </div>
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-4 bg-muted rounded mb-4" />
                    <div className="h-8 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={handleProductSelect}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="insurance" className="space-y-6 mt-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Fleet Insurance</h3>
            <p className="text-muted-foreground mb-6">
              Protect your fleet with tailored insurance packages
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={handleProductSelect}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="parts" className="space-y-6 mt-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Spare Parts & Maintenance</h3>
            <p className="text-muted-foreground mb-6">
              Quality parts and maintenance packages for your fleet
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={handleProductSelect}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <ProductDetailsModal
        product={selectedProduct}
        isOpen={showProductDetails}
        onClose={() => setShowProductDetails(false)}
        onActivate={handleActivateService}
      />

      <VehicleSelectionModal
        product={selectedProduct}
        vehicles={vehicles}
        isOpen={showVehicleSelection}
        onClose={() => setShowVehicleSelection(false)}
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

      <EnhancedMerchantLogin
        isOpen={showMerchantLogin}
        onClose={() => setShowMerchantLogin(false)}
        onLogin={handleMerchantLogin}
      />
    </div>
  );
};
