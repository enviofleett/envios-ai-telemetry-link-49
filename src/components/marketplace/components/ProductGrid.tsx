
import React from "react";
import { ProductCard } from "../ProductCard";

interface ProductGridProps {
  products: any[];
  onSelect: (product: any) => void;
  isLoading: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, onSelect, isLoading }) => (
  <div className="grid gap-6 md:grid-cols-3">
    {isLoading
      ? [...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse p-6 border rounded bg-muted" />
        ))
      : products.map((product) => (
          <ProductCard key={product.id} product={product} onSelect={onSelect} />
        ))}
  </div>
);
