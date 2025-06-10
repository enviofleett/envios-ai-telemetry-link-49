
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Phone, Star, Plus, Unlink } from 'lucide-react';
import { useWorkshops } from '@/hooks/useWorkshops';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { WorkshopConnection } from '@/types/workshop';

const ConnectedWorkshopsList: React.FC = () => {
  const { connections, isLoading } = useWorkshops();
  const [workshopConnections, setWorkshopConnections] = useState<any[]>([]);

  useEffect(() => {
    if (connections) {
      setWorkshopConnections(connections);
    }
  }, [connections]);

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
      <Card>
        <CardHeader>
          <CardTitle>Connected Workshops</CardTitle>
          <CardDescription>Loading workshop connections...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Connected Workshops</CardTitle>
            <CardDescription>
              Manage your workshop connections and service relationships
            </CardDescription>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Connect Workshop
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {workshopConnections.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No workshops connected</h3>
            <p className="text-muted-foreground mb-4">
              Connect to workshops to access maintenance and inspection services
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Browse Workshops
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {workshopConnections.map((connection) => {
              const workshop = connection.workshops;
              return (
                <div key={connection.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{workshop?.name || 'Unknown Workshop'}</h3>
                        <Badge className={getConnectionStatusColor(connection.connection_status)}>
                          {connection.connection_status}
                        </Badge>
                        {connection.payment_status && (
                          <Badge className={getPaymentStatusColor(connection.payment_status)}>
                            Payment: {connection.payment_status}
                          </Badge>
                        )}
                      </div>
                      
                      {workshop && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{workshop.city}, {workshop.country}</span>
                          </div>
                          
                          {workshop.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{workshop.phone}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            {renderStarRating(workshop.rating)}
                            <span className="text-xs text-gray-500">({workshop.review_count} reviews)</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mt-2">
                            {workshop.service_types?.map((service: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-3 text-sm text-muted-foreground">
                        <span>Connected: {new Date(connection.created_at).toLocaleDateString()}</span>
                        {connection.connection_fee_paid > 0 && (
                          <span className="ml-4">Fee Paid: ${connection.connection_fee_paid}</span>
                        )}
                      </div>
                      
                      {connection.notes && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <span className="font-medium">Notes: </span>
                          {connection.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {connection.connection_status === 'connected' && (
                        <>
                          <Button size="sm" variant="outline">
                            Schedule Service
                          </Button>
                          <Button size="sm" variant="outline">
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      {connection.connection_status === 'pending' && (
                        <Badge variant="outline" className="text-yellow-600">
                          Awaiting Approval
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectedWorkshopsList;
