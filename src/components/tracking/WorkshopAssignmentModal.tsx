
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  MapPin, 
  Phone,
  Clock,
  Star,
  Wrench
} from 'lucide-react';

interface Workshop {
  id: string;
  name: string;
  location: string;
  phone: string;
  rating: number;
  specialties: string[];
  distance: number;
  isAvailable: boolean;
}

interface WorkshopAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (workshopId: string) => void;
}

const WorkshopAssignmentModal: React.FC<WorkshopAssignmentModalProps> = ({
  isOpen,
  onClose,
  onAssign
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock workshop data - in real implementation, this would come from API
  const workshops: Workshop[] = [
    {
      id: '1',
      name: 'AutoFix Pro Workshop',
      location: 'Downtown Business District',
      phone: '+1 (555) 123-4567',
      rating: 4.8,
      specialties: ['Engine Repair', 'Transmission', 'Brake Service'],
      distance: 2.5,
      isAvailable: true
    },
    {
      id: '2',
      name: 'QuickService Auto Center',
      location: 'Industrial Zone A',
      phone: '+1 (555) 234-5678',
      rating: 4.5,
      specialties: ['Oil Change', 'Tire Service', 'Battery Replacement'],
      distance: 4.2,
      isAvailable: true
    },
    {
      id: '3',
      name: 'Elite Vehicle Services',
      location: 'North Commercial Area',
      phone: '+1 (555) 345-6789',
      rating: 4.9,
      specialties: ['Advanced Diagnostics', 'Electronic Systems', 'GPS Tracking'],
      distance: 6.8,
      isAvailable: false
    },
    {
      id: '4',
      name: 'Fleet Maintenance Hub',
      location: 'South Industrial Park',
      phone: '+1 (555) 456-7890',
      rating: 4.6,
      specialties: ['Fleet Services', 'Bulk Maintenance', '24/7 Service'],
      distance: 8.1,
      isAvailable: true
    }
  ];

  const filteredWorkshops = workshops.filter(workshop =>
    workshop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workshop.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workshop.specialties.some(specialty => 
      specialty.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleAssign = (workshopId: string) => {
    onAssign(workshopId);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Assign Workshop
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search workshops by name, location, or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Workshop List */}
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {filteredWorkshops.map((workshop) => (
                <div 
                  key={workshop.id}
                  className={`p-4 border rounded-lg ${workshop.isAvailable ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'} transition-colors`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{workshop.name}</h3>
                        {!workshop.isAvailable && (
                          <Badge variant="secondary">Currently Unavailable</Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <span>{workshop.location}</span>
                          <span className="text-xs text-gray-500">({workshop.distance} km away)</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          <span>{workshop.phone}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {renderStarRating(workshop.rating)}
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          {workshop.specialties.map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAssign(workshop.id)}
                        disabled={!workshop.isAvailable}
                      >
                        {workshop.isAvailable ? 'Assign' : 'Unavailable'}
                      </Button>
                      
                      {workshop.isAvailable && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <Clock className="h-3 w-3" />
                          <span>Available now</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredWorkshops.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No workshops found</p>
                  {searchTerm && (
                    <p className="text-sm">Try adjusting your search terms</p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkshopAssignmentModal;
