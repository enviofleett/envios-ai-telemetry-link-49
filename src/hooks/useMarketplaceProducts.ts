
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MarketplaceReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
  notHelpful: number;
}

export interface MarketplaceProduct {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  price: number;
  priceUnit: string;
  rating: number;
  reviewCount: number;
  popular: boolean;
  icon: string | null;
  category: string;
  features: string[];
  screenshots: string[];
  reviews: MarketplaceReview[];
  compatibility: string[];
  size: string;
  version: string;
  lastUpdated: string;
  developer: string;
  merchantId: string;
  connection_fee: number;
}

const transformProduct = (dbProduct: any): MarketplaceProduct => {
  return {
    id: dbProduct.id,
    title: dbProduct.name,
    description: dbProduct.short_description || '',
    fullDescription: dbProduct.description || '',
    price: dbProduct.price || 0,
    priceUnit: dbProduct.price_unit || '',
    rating: dbProduct.rating || 0,
    reviewCount: dbProduct.review_count || 0,
    popular: dbProduct.popular || false,
    icon: dbProduct.icon,
    category: dbProduct.category,
    features: dbProduct.features || [],
    screenshots: dbProduct.screenshots || [],
    reviews: (dbProduct.marketplace_product_reviews || []).map((review: any) => ({
      id: review.id,
      author: review.author_name || 'Anonymous',
      rating: review.rating,
      date: review.created_at,
      comment: review.comment || '',
      helpful: review.helpful_count || 0,
      notHelpful: review.not_helpful_count || 0,
    })),
    compatibility: dbProduct.compatibility || [],
    size: dbProduct.size || 'N/A',
    version: dbProduct.version || 'N/A',
    lastUpdated: dbProduct.updated_at,
    developer: dbProduct.developer || 'Unknown Developer',
    merchantId: dbProduct.merchant_id || '',
    connection_fee: dbProduct.connection_fee || 0,
  };
};

export const useMarketplaceProducts = () => {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('marketplace_products')
        .select(`
          *,
          marketplace_product_reviews (
            *
          )
        `);

      if (error) {
        console.error('Error fetching marketplace products:', error);
        setProducts([]);
      } else if (data) {
        const transformedProducts = data.map(transformProduct);
        setProducts(transformedProducts);
      }
      
      setIsLoading(false);
    };

    fetchProducts();
  }, []);

  return {
    products,
    isLoading
  };
};
