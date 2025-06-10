
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { VehicleInspection } from '@/types/vehicle-inspection';
import { Calendar, Clock, User, FileText, Car } from 'lucide-react';
import { format } from 'date-fns';

interface InspectionDetailsModalProps {
  inspection: VehicleInspection;
  isOpen: boolean;
  onClose: () => void;
}

const InspectionDetailsModal: React.FC<InspectionDetailsModalProps> = ({
  inspection,
  isOpen,
  onClose
}) => {
  const getStatusColor = (status: VehicleInspection['inspection_status']) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getResultColor = (result?: string) => {
    if (!result) return '';
    const colors = {
      pass: 'bg-green-100 text-green-800',
      fail: 'bg-red-100 text-red-800',
      conditional: 'bg-yellow-100 text-yellow-800'
    };
    return colors[result as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicle Inspection Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-medium">Vehicle ID: {inspection.vehicle_id}</h3>
              <p className="text-sm text-muted-foreground">
                Inspection ID: {inspection.id}
              </p>
            </div>
            <div className="text-right space-y-2">
              <Badge className={getStatusColor(inspection.inspection_status)}>
                {inspection.inspection_status.replace('_', ' ').toUpperCase()}
              </Badge>
              {inspection.overall_result && (
                <Badge className={getResultColor(inspection.overall_result)}>
                  {inspection.overall_result.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>

          {/* Inspection Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Type:</span>
                <span className="capitalize">{inspection.inspection_type}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Scheduled:</span>
                <span>{format(new Date(inspection.scheduled_date), 'MMM dd, yyyy HH:mm')}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Duration:</span>
                <span>{inspection.estimated_duration_hours}h estimated</span>
              </div>
            </div>

            <div className="space-y-3">
              {inspection.started_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Started:</span>
                  <span>{format(new Date(inspection.started_at), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              )}

              {inspection.completed_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Completed:</span>
                  <span>{format(new Date(inspection.completed_at), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              )}

              {inspection.actual_duration_minutes && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Actual Duration:</span>
                  <span>{Math.round(inspection.actual_duration_minutes / 60)}h {inspection.actual_duration_minutes % 60}m</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          {inspection.inspection_notes && (
            <div className="space-y-2">
              <h4 className="font-medium">Inspection Notes</h4>
              <div className="p-3 bg-gray-50 rounded-md text-sm">
                {inspection.inspection_notes}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-2">
            <h4 className="font-medium">Timeline</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-muted-foreground">Created:</span>
                <span>{format(new Date(inspection.created_at), 'MMM dd, yyyy HH:mm')}</span>
              </div>
              
              {inspection.started_at && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                  <span className="text-muted-foreground">Started:</span>
                  <span>{format(new Date(inspection.started_at), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              )}
              
              {inspection.completed_at && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span className="text-muted-foreground">Completed:</span>
                  <span>{format(new Date(inspection.completed_at), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InspectionDetailsModal;
