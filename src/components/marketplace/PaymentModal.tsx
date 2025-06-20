
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Smartphone, AlertTriangle, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { orderManagementService } from '@/services/marketplace/OrderManagementService';
import { securityAuditService } from '@/services/marketplace/SecurityAuditService';
import { toast } from '@/hooks/use-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    price: number;
    merchant_id: string;
    description?: string;
  };
  selectedVehicles: string[];
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  product,
  selectedVehicles
}) => {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'card'>('paystack');
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postalCode: ''
  });

  const totalAmount = product.price * selectedVehicles.length;

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to complete your purchase.",
        variant: "destructive"
      });
      return;
    }

    if (selectedVehicles.length === 0) {
      toast({
        title: "No Vehicles Selected",
        description: "Please select at least one vehicle.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Log security event for payment attempt
      await securityAuditService.logSecurityEvent({
        type: 'payment_attempt',
        severity: 'low',
        description: `Payment attempt for product ${product.id}`,
        user_id: user.id,
        additional_data: {
          product_id: product.id,
          vehicle_count: selectedVehicles.length,
          total_amount: totalAmount,
          payment_method: paymentMethod
        }
      });

      // Check for fraudulent activity
      const isFraudulent = await securityAuditService.detectFraudulentActivity(user.id, {
        amount: totalAmount,
        product_id: product.id,
        vehicle_count: selectedVehicles.length
      });

      if (isFraudulent) {
        toast({
          title: "Payment Blocked",
          description: "This payment has been flagged for review. Please contact support.",
          variant: "destructive"
        });
        return;
      }

      // Create order
      const order = await orderManagementService.createOrder({
        buyer_id: user.id,
        items: [{
          product_id: product.id,
          quantity: selectedVehicles.length,
          price: product.price,
          merchant_id: product.merchant_id
        }],
        shipping_address: shippingAddress,
        payment_method: paymentMethod
      });

      // Process payment based on method
      if (paymentMethod === 'paystack') {
        await processPaystackPayment(order.id);
      } else {
        await processCardPayment(order.id);
      }

      toast({
        title: "Payment Initiated",
        description: "You will be redirected to complete your payment.",
      });

      onClose();

    } catch (error) {
      console.error('Payment error:', error);
      
      // Log failed payment attempt
      await securityAuditService.logSecurityEvent({
        type: 'failed_payment',
        severity: 'medium',
        description: `Payment failed for product ${product.id}`,
        user_id: user.id,
        additional_data: {
          error: error instanceof Error ? error.message : 'Unknown error',
          product_id: product.id,
          total_amount: totalAmount
        }
      });

      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processPaystackPayment = async (orderId: string) => {
    try {
      const response = await fetch('/api/initiate-paystack-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify({
          order_id: orderId,
          merchant_id: product.merchant_id,
          amount: totalAmount,
          email: user?.email
        })
      });

      const data = await response.json();
      
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error(data.error || 'Failed to initialize payment');
      }
    } catch (error) {
      throw new Error('Paystack payment initialization failed');
    }
  };

  const processCardPayment = async (orderId: string) => {
    // Implement direct card payment processing
    // This would integrate with your card processing service
    throw new Error('Card payment not yet implemented');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Complete Your Purchase
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Product:</span>
                <span>{product.title}</span>
              </div>
              <div className="flex justify-between">
                <span>Price per vehicle:</span>
                <span>{formatCurrency(product.price)}</span>
              </div>
              <div className="flex justify-between">
                <span>Vehicles selected:</span>
                <span>{selectedVehicles.length}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Total:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <Label className="text-base font-medium mb-3 block">Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="paystack" id="paystack" />
                <Label htmlFor="paystack" className="flex items-center gap-2 cursor-pointer">
                  <Smartphone className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Paystack</div>
                    <div className="text-xs text-gray-500">Bank transfer, card, USSD</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg opacity-50">
                <RadioGroupItem value="card" id="card" disabled />
                <Label htmlFor="card" className="flex items-center gap-2 cursor-not-allowed">
                  <CreditCard className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Direct Card Payment</div>
                    <div className="text-xs text-gray-500">Coming soon</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Shipping Address */}
          <div>
            <Label className="text-base font-medium mb-3 block">Shipping Address</Label>
            <div className="space-y-3">
              <div>
                <Label htmlFor="street" className="text-sm">Street Address</Label>
                <Textarea
                  id="street"
                  value={shippingAddress.street}
                  onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                  placeholder="Enter your street address"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="city" className="text-sm">City</Label>
                  <Input
                    id="city"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-sm">State</Label>
                  <Input
                    id="state"
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                    placeholder="State"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-900 mb-1">Secure Payment</div>
                <div className="text-blue-700">
                  Your payment is protected by advanced fraud detection and secure encryption.
                  All transactions are monitored for your safety.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handlePayment}
              disabled={isProcessing || !shippingAddress.street || !shippingAddress.city}
              className="flex-1"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                `Pay ${formatCurrency(totalAmount)}`
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
