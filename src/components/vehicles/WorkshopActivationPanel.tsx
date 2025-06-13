
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wrench, 
  Calendar, 
  DollarSign, 
  User, 
  Phone, 
  MapPin,
  Star,
  Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkshopActivationPanelProps {
  vehicleId: string;
}

interface Workshop {
  id: string;
  name: string;
  representative_name: string;
  email: string;
  phone?: string;
  city?: string;
  address?: string;
  rating: number;
  review_count: number;
  activation_fee: number;
  connection_fee: number;
  service_types: string[];
  verified: boolean;
}

interface Activation {
  id: string;
  workshop_id: string;
  activation_date: string;
  expiration_date?: string;
  activation_status: string;
  service_type?: string;
  activation_fee: number;
  workshops: {
    name: string;
    representative_name: string;
    email: string;
    phone?: string;
    city?: string;
    rating: number;
    review_count: number;
    service_types: string[];
    verified: boolean;
  };
}

export const WorkshopActivationPanel: React.FC<WorkshopActivationPanelProps> = ({
  vehicleId
}) => {
  const [activations, setActivations] = useState<Activation[]>([]);
  const [availableWorkshops, setAvailableWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWorkshops, setShowWorkshops] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchActivations();
    fetchAvailableWorkshops();
  }, [vehicleId]);

  const fetchActivations = async () => {
    try {
      const { data, error } = await supabase
        .from('workshop_vehicle_activations')
        .select(`
          *,
          workshops (
            name,
            representative_name,
            email,
            phone,
            city,
            rating,
            review_count,
            service_types,
            verified
          )
        `)
        .eq('vehicle_id', vehicleId)
        .order('activation_date', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our types
      const transformedData = (data || []).map(item => ({
        ...item,
        workshops: {
          ...item.workshops,
          service_types: Array.isArray(item.workshops.service_types) 
            ? item.workshops.service_types 
            : []
        }
      })) as Activation[];
      
      setActivations(transformedData);
    } catch (error) {
      console.error('Error fetching activations:', error);
      toast({
        title: 'Error loading activations',
        description: 'Failed to load workshop activations',
        variant: 'destructive'
      });
    }
  };

  const fetchAvailableWorkshops = async () => {
    try {
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our types
      const transformedData = (data || []).map(workshop => ({
        ...workshop,
        service_types: Array.isArray(workshop.service_types) 
          ? workshop.service_types 
          : []
      })) as Workshop[];
      
      setAvailableWorkshops(transformedData);
    } catch (error) {
      console.error('Error fetching workshops:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateWorkshop = async (workshopId: string, serviceType: string = 'general') => {
    try {
      const workshop = availableWorkshops.find(w => w.id === workshopId);
      if (!workshop) return;

      const { error } = await supabase
        .from('workshop_vehicle_activations')
        .insert({
          vehicle_id: vehicleId,
          workshop_id: workshopId,
          service_type: serviceType,
          activation_fee: workshop.activation_fee,
          expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          activated_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: 'Workshop activated successfully',
        description: `Vehicle has been activated with ${workshop.name}`
      });

      fetchActivations();
      setShowWorkshops(false);
    } catch (error) {
      console.error('Error activating workshop:', error);
      toast({
        title: 'Activation failed',
        description: 'Failed to activate workshop. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Activations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Workshop Activations
            </div>
            <Button
              onClick={() => setShowWorkshops(!showWorkshops)}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Activate Workshop
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activations.length > 0 ? (
            <div className="space-y-4">
              {activations.map((activation) => (
                <div
                  key={activation.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{activation.workshops.name}</h4>
                      <p className="text-sm text-gray-600">
                        {activation.workshops.representative_name}
                      </p>
                      {activation.workshops.verified && (
                        <Badge variant="outline" className="mt-1">
                          ✓ Verified
                        </Badge>
                      )}
                    </div>
                    {getStatusBadge(activation.activation_status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Activated</p>
                        <p>{new Date(activation.activation_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {activation.expiration_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-gray-600">Expires</p>
                          <p>{new Date(activation.expiration_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Fee</p>
                        <p>${activation.activation_fee}</p>
                      </div>
                    </div>
                  </div>

                  {activation.service_type && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{activation.service_type}</Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No workshop activations yet</p>
              <p className="text-sm">Activate workshops to access their services</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Workshops */}
      {showWorkshops && (
        <Card>
          <CardHeader>
            <CardTitle>Available Workshops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availableWorkshops.map((workshop) => (
                <div
                  key={workshop.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{workshop.name}</h4>
                        {workshop.verified && (
                          <Badge variant="outline" className="text-green-600">
                            ✓ Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{workshop.representative_name}</p>
                      
                      <div className="flex items-center gap-4 mt-2">
                        {workshop.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm">{workshop.rating.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">({workshop.review_count} reviews)</span>
                          </div>
                        )}
                        
                        {workshop.city && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{workshop.city}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleActivateWorkshop(workshop.id)}
                      size="sm"
                    >
                      Activate
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span>Activation: ${workshop.activation_fee}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span>Connection: ${workshop.connection_fee}</span>
                    </div>
                  </div>

                  {workshop.service_types && workshop.service_types.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {workshop.service_types.map((service, index) => (
                        <Badge key={index} variant="outline">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
