
import React from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { MarketplaceState, UserRole } from "../types/marketplace.types";
import { Input } from "@/components/ui/input";

interface MarketplaceHeaderProps {
  state: MarketplaceState;
}

export const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({ state }) => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">
        {state.userRole === "merchant" ? "Merchant Portal" : "Marketplace"}
      </h1>
      <p className="text-muted-foreground">
        {state.userRole === "merchant"
          ? "Manage your products and track your business performance"
          : "Discover premium services and products for your fleet"}
      </p>
    </div>
    <div className="flex items-center gap-4">
      {state.userRole === "subscriber" && (
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8 w-64"
            value={state.searchQuery}
            onChange={(e) => state.setSearchQuery(e.target.value)}
          />
        </div>
      )}
      <Button
        variant="outline"
        onClick={() =>
          state.setUserRole(state.userRole === "merchant" ? "subscriber" : "merchant")
        }
      >
        {state.userRole === "merchant" ? "Switch to Customer View" : "Merchant View"}
      </Button>
    </div>
  </div>
);
