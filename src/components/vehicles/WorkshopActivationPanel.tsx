
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkshops } from '@/hooks/useWorkshops';
import { Workshop } from '@/types/workshop';
import { MapPin, Phone, Clock, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

interface WorkshopActivationPanelProps {
  vehicleId: string;
}

const WorkshopActivationPanel: React.FC<WorkshopActivationPanelProps> = ({ vehicleId }) => {
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const { workshops, isLoading, connectToWorkshop, isConnecting } = useWorkshops();

  const handleActivateWorkshop = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    connectToWorkshop(workshop.id);
  };

  const getWorkshopStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workshop Activation</CardTitle>
          <CardDescription>Loading available workshops...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-500" />
          Workshop Activation
        </CardTitle>
        <CardDescription>
          Connect your vehicle to authorized workshops for maintenance and inspections
        </CardDescription>
      </CardHeader>
      <CardContent>
        {workshops.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <MapPin className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium mb-2">No workshops available</h3>
            <p className="text-gray-500">
              No workshops are currently available for activation in your area.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {workshops.map((workshop) => (
              <div key={workshop.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{workshop.name}</h3>
                      <Badge className={getWorkshopStatusColor(workshop.status)}>
                        {workshop.status || 'unknown'}
                      </Badge>
                      {workshop.verified && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{workshop.phone_number || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{workshop.address || 'Address not available'}</span>
                      </div>
                      {workshop.operating_hours && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{workshop.operating_hours}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 flex gap-4 text-sm">
                      {workshop.connection_fee > 0 && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <DollarSign className="h-4 w-4" />
                          <span>Connection: ${workshop.connection_fee}</span>
                        </div>
                      )}
                      {workshop.activation_fee > 0 && (
                        <div className="flex items-center gap-1 text-green-600">
                          <DollarSign className="h-4 w-4" />
                          <span>Activation: ${workshop.activation_fee}</span>
                        </div>
                      )}
                    </div>
                    
                    {workshop.service_types && Array.isArray(workshop.service_types) && workshop.service_types.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1">
                          {workshop.service_types.map((service: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <Button
                      onClick={() => handleActivateWorkshop(workshop)}
                      disabled={isConnecting || workshop.status !== 'active'}
                      className="min-w-[100px]"
                    >
                      {isConnecting && selectedWorkshop?.id === workshop.id 
                        ? 'Connecting...' 
                        : 'Activate'
                      }
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkshopActivationPanel;
