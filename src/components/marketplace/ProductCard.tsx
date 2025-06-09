
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { MarketplaceProduct } from '@/hooks/useMarketplaceProducts';

interface ProductCardProps {
  product: MarketplaceProduct;
  onSelect: (product: MarketplaceProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <Card
      className="flex flex-col cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onSelect(product)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <product.icon className="h-6 w-6 text-primary" />
          </div>
          {product.popular && (
            <Badge className="bg-primary text-primary-foreground">Popular</Badge>
          )}
        </div>
        <CardTitle className="mt-4">{product.title}</CardTitle>
        <CardDescription>{product.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="flex items-center gap-1 text-yellow-500 mb-2">
          {renderStars(product.rating)}
          <span className="ml-1 text-sm text-muted-foreground">({product.reviewCount})</span>
        </div>
        <div className="text-sm text-muted-foreground">By {product.developer}</div>
      </CardContent>
      
      <CardFooter className="flex flex-col items-start gap-4 border-t pt-4">
        <div>
          <div className="text-2xl font-bold">{product.price}</div>
          {product.priceUnit && (
            <div className="text-sm text-muted-foreground">{product.priceUnit}</div>
          )}
        </div>
        <Button
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(product);
          }}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};
