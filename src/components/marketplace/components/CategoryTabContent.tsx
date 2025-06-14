
import React from "react";
import { ProductGrid } from "./ProductGrid";

interface CategoryTabContentProps {
  title: string;
  subtitle: string;
  products: any[];
  isLoading: boolean;
  onProductSelect: (product: any) => void;
}

export const CategoryTabContent: React.FC<CategoryTabContentProps> = ({
  title,
  subtitle,
  products,
  isLoading,
  onProductSelect,
}) => (
  <div className="space-y-6 mt-6">
    <div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{subtitle}</p>
    </div>
    <ProductGrid products={products} onSelect={onProductSelect} isLoading={isLoading} />
  </div>
);
