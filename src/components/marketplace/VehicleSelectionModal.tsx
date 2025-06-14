
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, ArrowRight, Car, X } from 'lucide-react';
import { MarketplaceProduct } from '@/hooks/useMarketplaceProducts';
import MarketplaceIcon from './components/MarketplaceIcon';

interface VehicleSelectionModalProps {
  product: MarketplaceProduct | null;
  vehicles: any[];
  isOpen: boolean;
  onClose: () => void;
  selectedVehicles: string[];
  onVehicleToggle: (vehicleId: string) => void;
  onProceedToPayment: () => void;
}

export const VehicleSelectionModal: React.FC<VehicleSelectionModalProps> = ({
  product,
  vehicles,
  isOpen,
  onClose,
  selectedVehicles,
  onVehicleToggle,
  onProceedToPayment
}) => {
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');

  if (!product) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    if (!vehicleSearchQuery) return true;
    return (
      vehicle.devicename?.toLowerCase().includes(vehicleSearchQuery.toLowerCase()) ||
      vehicle.deviceid?.toString().includes(vehicleSearchQuery.toLowerCase())
    );
  });

  const calculateTotal = () => {
    const basePrice = product.price || 0;
    const connectionFee = product.connection_fee || 0;
    return (basePrice + connectionFee) * selectedVehicles.length;
  };

  const itemPrice = (product.price || 0) + (product.connection_fee || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Activate Service</DialogTitle>
          <DialogDescription>Select the vehicles you want to activate this service for</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/20">
            <MarketplaceIcon name={product.icon} className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-semibold">{product.title}</h3>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(itemPrice)} {product.priceUnit}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Select Vehicles</Label>
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by device name or ID..."
                  className="pl-8"
                  value={vehicleSearchQuery}
                  onChange={(e) => setVehicleSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => setVehicleSearchQuery('')}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => (
                  <div key={vehicle.deviceid} className="flex items-center space-x-3 border p-3 rounded-lg">
                    <Checkbox
                      id={vehicle.deviceid}
                      checked={selectedVehicles.includes(vehicle.deviceid)}
                      onCheckedChange={() => onVehicleToggle(vehicle.deviceid)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{vehicle.devicename || `Device ${vehicle.deviceid}`}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ID: {vehicle.deviceid} • Status: {vehicle.status || 'Unknown'}
                      </p>
                    </div>
                    <div className="text-sm font-medium">{formatCurrency(itemPrice)}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  {vehicleSearchQuery ? `No vehicles found matching "${vehicleSearchQuery}"` : "No vehicles available"}
                </div>
              )}
            </div>
          </div>

          {selectedVehicles.length > 0 && (
            <div className="bg-primary/5 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Cost:</span>
                <span className="text-xl font-bold">{formatCurrency(calculateTotal())}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedVehicles.length} vehicle(s) selected
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onProceedToPayment} disabled={selectedVehicles.length === 0}>
              Proceed to Payment
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
