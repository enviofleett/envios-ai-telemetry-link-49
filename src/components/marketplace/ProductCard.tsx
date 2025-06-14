
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MarketplaceIcon from './components/MarketplaceIcon';
import { MarketplaceProduct } from '@/hooks/useMarketplaceProducts';

interface ProductCardProps {
  product: MarketplaceProduct;
  onSelect: (product: MarketplaceProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <Card className="relative cursor-pointer hover:shadow-lg" onClick={() => onSelect(product)}>
      <CardHeader className="flex flex-row items-center gap-4">
        <MarketplaceIcon name={product.icon} className="h-6 w-6 text-primary" />
        <div>
          <CardTitle>{product.title}</CardTitle>
          <CardDescription>
            {product.description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-bold">
          {formatCurrency(product.price)}
          {product.priceUnit && <span className="text-sm font-normal text-muted-foreground ml-1">{product.priceUnit}</span>}
        </div>
        {product.connection_fee > 0 && (
          <div className="text-sm text-muted-foreground">
            +{formatCurrency(product.connection_fee)} per vehicle connection
          </div>
        )}
      </CardContent>
    </Card>
  );
};
