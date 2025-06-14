import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProductCardProps {
  product: any;
  onSelect: (product: any) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  return (
    <Card className="relative cursor-pointer hover:shadow-lg" onClick={() => onSelect(product)}>
      <CardHeader className="flex flex-row items-center gap-4">
        <product.icon className="h-6 w-6 text-primary" />
        <div>
          <CardTitle>{product.title}</CardTitle>
          <CardDescription>
            {product.description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-bold">{product.price}{product.priceUnit}</div>
        {product.connection_fee > 0 && (
          <div className="text-sm text-muted-foreground">
            +${product.connection_fee} per vehicle connection
          </div>
        )}
      </CardContent>
    </Card>
  );
};
