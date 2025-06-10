
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Phone, Mail, Clock, DollarSign } from 'lucide-react';
import { Workshop } from '@/types/workshop';

interface WorkshopCardProps {
  workshop: Workshop;
  onConnect?: (workshopId: string) => void;
  onViewDetails?: (workshop: Workshop) => void;
  isConnected?: boolean;
  connectionStatus?: 'pending' | 'connected' | 'rejected';
}

const WorkshopCard: React.FC<WorkshopCardProps> = ({
  workshop,
  onConnect,
  onViewDetails,
  isConnected = false,
  connectionStatus
}) => {
  const getConnectionStatusBadge = () => {
    if (!connectionStatus) return null;
    
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      connected: { color: 'bg-green-100 text-green-800', text: 'Connected' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' }
    };

    const config = statusConfig[connectionStatus];
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{workshop.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                {renderStars(workshop.rating)}
                <span className="text-sm text-gray-600 ml-1">
                  ({workshop.review_count} reviews)
                </span>
              </div>
              {workshop.verified && (
                <Badge className="bg-blue-100 text-blue-800">Verified</Badge>
              )}
            </div>
          </div>
          {getConnectionStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{workshop.city}, {workshop.country}</span>
        </div>

        {/* Contact Info */}
        <div className="space-y-2">
          {workshop.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{workshop.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4" />
            <span>{workshop.email}</span>
          </div>
        </div>

        {/* Operating Hours */}
        {workshop.operating_hours && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{workshop.operating_hours}</span>
          </div>
        )}

        {/* Service Types */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Services:</p>
          <div className="flex flex-wrap gap-1">
            {workshop.service_types.slice(0, 3).map((service, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {service}
              </Badge>
            ))}
            {workshop.service_types.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{workshop.service_types.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <DollarSign className="h-4 w-4" />
            <span>Connection: ${workshop.connection_fee}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <DollarSign className="h-4 w-4" />
            <span>Activation: ${workshop.activation_fee}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(workshop)}
              className="flex-1"
            >
              View Details
            </Button>
          )}
          
          {onConnect && !isConnected && connectionStatus !== 'pending' && (
            <Button
              size="sm"
              onClick={() => onConnect(workshop.id)}
              className="flex-1"
            >
              Connect
            </Button>
          )}
          
          {connectionStatus === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              disabled
              className="flex-1"
            >
              Request Pending
            </Button>
          )}
          
          {isConnected && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
            >
              Connected
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkshopCard;
