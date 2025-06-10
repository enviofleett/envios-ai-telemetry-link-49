
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VehicleInspection } from '@/types/vehicle-inspection';
import { Calendar, Clock, User, Car, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface InspectionListProps {
  inspections: VehicleInspection[];
  onInspectionSelect: (inspection: VehicleInspection) => void;
  getStatusBadge: (status: VehicleInspection['inspection_status']) => React.ReactNode;
}

const InspectionList: React.FC<InspectionListProps> = ({
  inspections,
  onInspectionSelect,
  getStatusBadge
}) => {
  if (inspections.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No inspections found</h3>
            <p>No inspections match the current filter criteria.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {inspections.map((inspection) => (
        <Card key={inspection.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Vehicle ID: {inspection.vehicle_id}</span>
                  </div>
                  {getStatusBadge(inspection.inspection_status)}
                </div>

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(inspection.scheduled_date), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{inspection.estimated_duration_hours}h estimated</span>
                  </div>

                  {inspection.inspector_id && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>Inspector assigned</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Type:</span>
                  <span className="text-sm capitalize">{inspection.inspection_type}</span>
                </div>

                {inspection.inspection_notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {inspection.inspection_notes}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onInspectionSelect(inspection)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                
                {inspection.inspection_status === 'scheduled' && (
                  <Button size="sm">
                    Start Inspection
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default InspectionList;
