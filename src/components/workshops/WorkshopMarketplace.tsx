
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin, Clock, Phone, Mail, Search, Plus } from 'lucide-react';
import { useWorkshops } from '@/hooks/useWorkshops';
import { Workshop } from '@/types/workshop';
import { WorkshopRegistration } from '@/components/admin/WorkshopRegistration';
import { WorkshopConnection } from '@/components/admin/WorkshopConnection';

interface WorkshopCardProps {
  workshop: Workshop;
  onConnect: (workshopId: string) => void;
  isConnecting: boolean;
}

const WorkshopCard: React.FC<WorkshopCardProps> = ({ workshop, onConnect, isConnecting }) => {
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">
          {rating.toFixed(1)} ({workshop.review_count})
        </span>
      </div>
    );
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/placeholder.svg" alt={workshop.name} />
                <AvatarFallback>
                  {workshop.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {workshop.name}
                  {workshop.verified && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Verified
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {workshop.city}, {workshop.country}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Activation Fee</div>
              <div className="text-xl font-bold">${workshop.activation_fee}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>{renderStars(workshop.rating)}</div>
          
          <div className="flex flex-wrap gap-1">
            {Array.isArray(workshop.service_types) && workshop.service_types.map((service, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {service}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{workshop.operating_hours || 'Contact for hours'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{workshop.phone || 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{workshop.email}</span>
          </div>

          <div className="pt-2">
            <Button 
              onClick={() => setShowConnectionModal(true)}
              disabled={isConnecting}
              className="w-full"
            >
              Connect to Workshop
            </Button>
          </div>
        </CardContent>
      </Card>

      <WorkshopConnection
        workshop={workshop}
        userVehicles={[]} // This would come from a vehicles hook
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        onConnect={(connectionData) => {
          onConnect(workshop.id);
          setShowConnectionModal(false);
        }}
      />
    </>
  );
};

const WorkshopMarketplace: React.FC = () => {
  const [searchCity, setSearchCity] = useState('');
  const [searchCountry, setSearchCountry] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);
  const { workshops, connectToWorkshop, searchWorkshops, isConnecting, isLoading } = useWorkshops();

  const handleSearch = () => {
    searchWorkshops(searchCity, searchCountry);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Workshop Marketplace</h1>
          <p className="text-muted-foreground">
            Find and connect with vehicle maintenance workshops
          </p>
        </div>
        <Button onClick={() => setShowRegistration(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Register Workshop
        </Button>
      </div>

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Workshops</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by city..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Search by country..."
                value={searchCountry}
                onChange={(e) => setSearchCountry(e.target.value)}
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workshops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workshops?.map((workshop) => (
          <WorkshopCard
            key={workshop.id}
            workshop={workshop}
            onConnect={connectToWorkshop}
            isConnecting={isConnecting}
          />
        ))}
      </div>

      {workshops?.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            No workshops found. Try adjusting your search criteria.
          </div>
        </div>
      )}

      <WorkshopRegistration
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
        onSubmit={(data) => {
          console.log('Workshop registration data:', data);
          setShowRegistration(false);
        }}
        userRole="user"
      />
    </div>
  );
};

export default WorkshopMarketplace;
