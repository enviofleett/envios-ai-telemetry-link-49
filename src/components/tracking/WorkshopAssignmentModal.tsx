
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
import { useWorkshops } from '@/hooks/useWorkshops';
import { LoadingSpinner } from '@/components/LoadingSpinner';

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
  const { workshops, isLoading, connectToWorkshop, isConnecting } = useWorkshops();

  const filteredWorkshops = workshops?.filter(workshop =>
    workshop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workshop.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workshop.service_types.some(service => 
      service.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const handleAssign = async (workshopId: string) => {
    try {
      await connectToWorkshop(workshopId);
      onAssign(workshopId);
    } catch (error) {
      console.error('Failed to assign workshop:', error);
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
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {filteredWorkshops.map((workshop) => (
                  <div 
                    key={workshop.id}
                    className={`p-4 border rounded-lg ${workshop.is_active ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'} transition-colors`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{workshop.name}</h3>
                          {!workshop.is_active && (
                            <Badge variant="secondary">Currently Unavailable</Badge>
                          )}
                          {workshop.verified && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Verified
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-3 w-3" />
                            <span>{workshop.city}, {workshop.country}</span>
                          </div>
                          
                          {workshop.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              <span>{workshop.phone}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            {renderStarRating(workshop.rating)}
                            <span className="text-xs text-gray-500">({workshop.review_count} reviews)</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mt-2">
                            {workshop.service_types.map((service, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>

                          {workshop.operating_hours && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{workshop.operating_hours}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAssign(workshop.id)}
                          disabled={!workshop.is_active || isConnecting}
                        >
                          {isConnecting ? 'Connecting...' : workshop.is_active ? 'Assign' : 'Unavailable'}
                        </Button>
                        
                        {workshop.is_active && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <Clock className="h-3 w-3" />
                            <span>Available now</span>
                          </div>
                        )}

                        {workshop.connection_fee > 0 && (
                          <div className="text-xs text-gray-500">
                            Connection: ${workshop.connection_fee}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredWorkshops.length === 0 && !isLoading && (
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkshopAssignmentModal;
