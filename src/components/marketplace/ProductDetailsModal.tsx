
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Zap, Play, CheckCircle, Users, ThumbsUp, ThumbsDown } from 'lucide-react';
import { MarketplaceProduct } from '@/hooks/useMarketplaceProducts';

interface ProductDetailsModalProps {
  product: MarketplaceProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onActivate: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onActivate
}) => {
  if (!product) return null;

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
              <product.icon className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{product.title}</DialogTitle>
              <DialogDescription className="text-base mt-1">By {product.developer}</DialogDescription>
              <div className="flex items-center gap-4 mt-2">
                {renderStars(product.rating)}
                <span className="text-sm text-muted-foreground">{product.reviewCount} reviews</span>
                <Badge variant="outline">{product.version}</Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{product.price}</div>
              {product.priceUnit && (
                <div className="text-sm text-muted-foreground">{product.priceUnit}</div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={onActivate} className="flex-1">
              <Zap className="h-4 w-4 mr-2" />
              Activate Service
            </Button>
            <Button variant="outline">
              <Play className="h-4 w-4 mr-2" />
              Demo
            </Button>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="font-semibold">About this service</h3>
            <p className="text-muted-foreground">{product.fullDescription}</p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h3 className="font-semibold">Features</h3>
            <div className="grid grid-cols-2 gap-2">
              {product.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold">Compatibility</h3>
              <div className="space-y-1">
                {product.compatibility.map((item, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold">Additional Information</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Updated: {product.lastUpdated}</div>
                <div>Version: {product.version}</div>
                <div>Size: {product.size}</div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          {product.reviews.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Reviews</h3>
              <div className="space-y-4">
                {product.reviews.map((review, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{review.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-muted-foreground">{review.date}</span>
                      </div>
                    </div>
                    <p className="text-sm mb-3">{review.comment}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        <span>{review.helpful}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsDown className="h-3 w-3" />
                        <span>{review.notHelpful}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
