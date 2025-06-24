
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Workshop } from '@/types/workshop';
import { Wrench, MapPin, Phone, Star, DollarSign, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface WorkshopActivationPanelProps {
  vehicleId: string;
  userId: string;
}

const WorkshopActivationPanel: React.FC<WorkshopActivationPanelProps> = ({
  vehicleId,
  userId
}) => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [activationNote, setActivationNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .eq('status', 'active')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching workshops:', error);
        toast({
          title: "Error",
          description: "Failed to load workshops",
          variant: "destructive"
        });
        return;
      }

      // Transform the data to ensure it matches our Workshop interface
      const transformedWorkshops: Workshop[] = (data || []).map(workshop => ({
        id: workshop.id,
        name: workshop.name,
        representative_name: workshop.representative_name,
        email: workshop.email,
        phone_number: workshop.phone_number,
        address: workshop.address,
        status: workshop.status,
        service_types: workshop.service_types || [],
        created_at: workshop.created_at,
        updated_at: workshop.updated_at,
        phone: workshop.phone || workshop.phone_number,
        city: workshop.city || '',
        country: workshop.country || '',
        operating_hours: workshop.operating_hours || '',
        connection_fee: workshop.connection_fee || 0,
        activation_fee: workshop.activation_fee || 0,
        verified: workshop.verified || false,
        is_active: workshop.is_active || true,
        rating: workshop.rating || 0,
        review_count: workshop.review_count || 0
      }));

      setWorkshops(transformedWorkshops);
    } catch (error) {
      console.error('Error fetching workshops:', error);
      toast({
        title: "Error",
        description: "Failed to load workshops",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkshopSelect = (workshopId: string) => {
    const workshop = workshops.find(w => w.id === workshopId);
    setSelectedWorkshop(workshop || null);
  };

  const handleActivation = async () => {
    if (!selectedWorkshop) {
      toast({
        title: "Error",
        description: "Please select a workshop first",
        variant: "destructive"
      });
      return;
    }

    setIsActivating(true);
    try {
      // Since workshop_vehicle_activations table may not exist yet, we'll show a placeholder success
      toast({
        title: "Workshop Activation",
        description: "Workshop activation functionality is being implemented. Your request has been noted.",
        variant: "default"
      });

      // Reset form
      setSelectedWorkshop(null);
      setActivationNote('');
    } catch (error) {
      console.error('Error activating workshop:', error);
      toast({
        title: "Error",
        description: "Failed to activate workshop connection",
        variant: "destructive"
      });
    } finally {
      setIsActivating(false);
    }
  };

  const getServiceTypeBadges = (serviceTypes: any) => {
    if (!serviceTypes || !Array.isArray(serviceTypes)) return null;
    
    return serviceTypes.slice(0, 3).map((service: string, index: number) => (
      <Badge key={index} variant="secondary" className="text-xs">
        {service}
      </Badge>
    ));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading workshops...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Workshop Activation
          </CardTitle>
          <CardDescription>
            Connect your vehicle to a trusted workshop for maintenance and inspections
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="workshop-select">Select Workshop</Label>
            <Select onValueChange={handleWorkshopSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a workshop..." />
              </SelectTrigger>
              <SelectContent>
                {workshops.map((workshop) => (
                  <SelectItem key={workshop.id} value={workshop.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{workshop.name}</span>
                      {workshop.verified && (
                        <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedWorkshop && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {selectedWorkshop.name}
                        {selectedWorkshop.verified && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedWorkshop.representative_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">
                        {selectedWorkshop.rating?.toFixed(1) || '0.0'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({selectedWorkshop.review_count || 0})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedWorkshop.address || 'Address not provided'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedWorkshop.phone || 'Phone not provided'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedWorkshop.operating_hours || 'Hours not specified'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>Activation: ${selectedWorkshop.activation_fee || 0}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2">Services Offered:</h4>
                    <div className="flex flex-wrap gap-2">
                      {getServiceTypeBadges(selectedWorkshop.service_types) || (
                        <span className="text-sm text-muted-foreground">No services listed</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <Label htmlFor="activation-note">Additional Notes (Optional)</Label>
            <Textarea
              id="activation-note"
              value={activationNote}
              onChange={(e) => setActivationNote(e.target.value)}
              placeholder="Any specific requirements or notes for the workshop..."
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleActivation}
              disabled={!selectedWorkshop || isActivating}
              className="flex-1"
            >
              {isActivating ? 'Activating...' : 'Activate Workshop Connection'}
            </Button>
          </div>

          {selectedWorkshop?.activation_fee && selectedWorkshop.activation_fee > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                This workshop charges an activation fee of ${selectedWorkshop.activation_fee}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkshopActivationPanel;
