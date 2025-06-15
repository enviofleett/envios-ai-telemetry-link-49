
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DeliveryOrder } from '@/types/vehicle';
import { Clock, MapPin, Package, Phone } from 'lucide-react';

interface DeliveryOrderCardProps {
  order: DeliveryOrder;
}

const DeliveryOrderCard: React.FC<DeliveryOrderCardProps> = ({ order }) => {
  const getStatusVariant = (status: DeliveryOrder['status']): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'in_transit': return 'default';
      case 'pending': return 'secondary';
      case 'delivered': return 'secondary'; // Should be green, maybe need to customize Badge
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{order.customerName}</CardTitle>
            <p className="text-sm text-gray-500">Order ID: {order.id}</p>
          </div>
          <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status.replace('_', ' ')}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center text-gray-700">
          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
          <span>{order.customerAddress}</span>
        </div>
        <div className="flex items-center text-gray-700">
          <Phone className="w-4 h-4 mr-2 text-gray-400" />
          <span>{order.customerPhone}</span>
        </div>
        <div className="flex items-center text-gray-700">
          <Clock className="w-4 h-4 mr-2 text-gray-400" />
          <span>Est. Delivery: {new Date(order.estimatedDeliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex items-center pt-2 text-gray-700">
          <Package className="w-4 h-4 mr-2 text-gray-400" />
          <span>{order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryOrderCard;
