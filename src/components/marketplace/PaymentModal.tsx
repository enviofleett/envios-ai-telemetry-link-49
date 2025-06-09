
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, FileText } from 'lucide-react';
import { MarketplaceProduct } from '@/hooks/useMarketplaceProducts';

interface PaymentModalProps {
  product: MarketplaceProduct | null;
  selectedVehicles: string[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  product,
  selectedVehicles,
  isOpen,
  onClose,
  onComplete
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'invoice'>('credit');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: ''
  });

  if (!product) return null;

  const calculateTotal = () => {
    if (!product.price.includes('$')) return 0;
    const basePrice = parseFloat(product.price.replace('$', '').replace(',', ''));
    return basePrice * selectedVehicles.length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>Complete your payment to activate the service</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="flex items-center justify-between mb-2">
              <span>{product.title}</span>
              <span>{product.price}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Vehicles: {selectedVehicles.length}</span>
              <span className="text-muted-foreground">× {selectedVehicles.length}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between font-semibold">
              <span>Total:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`border rounded-lg p-3 cursor-pointer ${
                  paymentMethod === 'credit' ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setPaymentMethod('credit')}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">Credit Card</span>
                </div>
              </div>
              <div
                className={`border rounded-lg p-3 cursor-pointer ${
                  paymentMethod === 'invoice' ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setPaymentMethod('invoice')}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">Invoice</span>
                </div>
              </div>
            </div>
          </div>

          {/* Credit Card Form */}
          {paymentMethod === 'credit' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Card Number</Label>
                <Input
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Cardholder Name</Label>
                <Input
                  placeholder="John Smith"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CVC</Label>
                  <Input
                    placeholder="123"
                    value={cardDetails.cvc}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, cvc: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onComplete}>
              <CreditCard className="h-4 w-4 mr-2" />
              Complete Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
