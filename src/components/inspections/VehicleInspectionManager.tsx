
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Plus, Calendar, User } from 'lucide-react';

interface VehicleInspectionManagerProps {
  workshopId: string;
}

const VehicleInspectionManager: React.FC<VehicleInspectionManagerProps> = ({
  workshopId
}) => {
  const [inspections, setInspections] = useState([]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Vehicle Inspections
              </CardTitle>
              <CardDescription>
                Manage and track vehicle inspections for workshop {workshopId}
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Inspection
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {inspections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No inspections scheduled. Create your first inspection to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {inspections.map((inspection: any) => (
                <div key={inspection.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-blue-100">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{inspection.vehicle_id}</div>
                      <div className="text-sm text-muted-foreground">
                        Scheduled: {new Date(inspection.scheduled_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{inspection.status}</Badge>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleInspectionManager;
