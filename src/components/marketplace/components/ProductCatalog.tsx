
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryTabContent } from './CategoryTabContent';

interface ProductCatalogProps {
  state: any; // MarketplaceState, but easier for usage
  filteredProducts: any[];
  isLoading: boolean;
  onProductSelect: (product: any) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  state,
  filteredProducts,
  isLoading,
  onProductSelect,
}) => (
  <Tabs value={state.activeCategory} onValueChange={state.setActiveCategory}>
    <TabsList className="grid w-full grid-cols-3">
      <TabsTrigger value="telemetry">Premium Telemetry</TabsTrigger>
      <TabsTrigger value="insurance">Insurance</TabsTrigger>
      <TabsTrigger value="parts">Spare Parts</TabsTrigger>
    </TabsList>
    <TabsContent value="telemetry">
      <CategoryTabContent
        title="Premium Telemetry Features"
        subtitle="Enhance your fleet management with advanced telemetry solutions"
        products={filteredProducts}
        isLoading={isLoading}
        onProductSelect={onProductSelect}
      />
    </TabsContent>
    <TabsContent value="insurance">
      <CategoryTabContent
        title="Fleet Insurance"
        subtitle="Protect your fleet with tailored insurance packages"
        products={filteredProducts}
        isLoading={isLoading}
        onProductSelect={onProductSelect}
      />
    </TabsContent>
    <TabsContent value="parts">
      <CategoryTabContent
        title="Spare Parts & Maintenance"
        subtitle="Quality parts and maintenance packages for your fleet"
        products={filteredProducts}
        isLoading={isLoading}
        onProductSelect={onProductSelect}
      />
    </TabsContent>
  </Tabs>
);
