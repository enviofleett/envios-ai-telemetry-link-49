
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Star, Building2, DollarSign, Clock } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Workshop } from '@/types/workshop';

interface WorkshopGridProps {
  workshops: Workshop[] | undefined;
  isLoading: boolean;
  isConnecting: boolean;
  onConnect: (workshopId: string) => void;
}

const WorkshopGrid: React.FC<WorkshopGridProps> = ({
  workshops,
  isLoading,
  isConnecting,
  onConnect
}) => {
  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">{rating}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex justify-center">
                <LoadingSpinner />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!workshops || workshops.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No workshops found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or browse all available workshops
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workshops.map((workshop) => (
        <Card key={workshop.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{workshop.name}</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {workshop.city}, {workshop.country}
                </CardDescription>
              </div>
              {workshop.verified && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Verified
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rating</span>
                {renderStarRating(workshop.rating)}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reviews</span>
                <span className="text-sm">{workshop.review_count} reviews</span>
              </div>
              
              {workshop.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{workshop.phone}</span>
                </div>
              )}
              
              {workshop.operating_hours && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{workshop.operating_hours}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <span className="text-sm font-medium">Services</span>
              <div className="flex flex-wrap gap-1">
                {workshop.service_types.slice(0, 3).map((service, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {service}
                  </Badge>
                ))}
                {workshop.service_types.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{workshop.service_types.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Connection Fee</span>
                <span className="font-medium flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {workshop.connection_fee}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Activation Fee</span>
                <span className="font-medium flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {workshop.activation_fee}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                className="flex-1" 
                variant="outline"
                onClick={() => {/* View details */}}
              >
                View Details
              </Button>
              <Button 
                className="flex-1"
                onClick={() => onConnect(workshop.id)}
                disabled={!workshop.is_active || isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default WorkshopGrid;
