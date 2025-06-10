
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardList, 
  Plus, 
  Calendar,
  User,
  Car,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Edit
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface VehicleInspection {
  id: string;
  vehicle_id: string;
  workshop_id: string;
  inspector_id?: string;
  inspection_type: string;
  inspection_status: string;
  scheduled_date: string;
  started_at?: string;
  completed_at?: string;
  overall_result?: string;
  inspection_notes?: string;
  estimated_duration_hours: number;
  actual_duration_minutes?: number;
  created_at: string;
}

interface WorkshopUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface VehicleInspectionManagerProps {
  workshopId: string;
}

const VehicleInspectionManager: React.FC<VehicleInspectionManagerProps> = ({
  workshopId
}) => {
  const { toast } = useToast();
  const [inspections, setInspections] = useState<VehicleInspection[]>([]);
  const [inspectors, setInspectors] = useState<WorkshopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newInspection, setNewInspection] = useState({
    vehicle_id: '',
    inspection_type: 'routine',
    scheduled_date: '',
    inspector_id: '',
    inspection_notes: '',
    estimated_duration_hours: 2
  });

  useEffect(() => {
    loadInspections();
    loadInspectors();
  }, [workshopId]);

  const loadInspections = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_inspections')
        .select('*')
        .eq('workshop_id', workshopId)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      setInspections(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load inspections",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadInspectors = async () => {
    try {
      const { data, error } = await supabase
        .from('workshop_users')
        .select('id, name, email, role')
        .eq('workshop_id', workshopId)
        .eq('is_active', true)
        .in('role', ['inspector', 'technician', 'manager']);

      if (error) throw error;
      setInspectors(data || []);
    } catch (error: any) {
      console.error('Error loading inspectors:', error);
    }
  };

  const createInspection = async () => {
    if (!newInspection.vehicle_id || !newInspection.scheduled_date) {
      toast({
        title: "Validation Error",
        description: "Vehicle ID and scheduled date are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('vehicle_inspections')
        .insert({
          workshop_id: workshopId,
          vehicle_id: newInspection.vehicle_id,
          inspection_type: newInspection.inspection_type,
          scheduled_date: newInspection.scheduled_date,
          inspector_id: newInspection.inspector_id || null,
          inspection_notes: newInspection.inspection_notes,
          estimated_duration_hours: newInspection.estimated_duration_hours
        })
        .select()
        .single();

      if (error) throw error;

      setInspections([data, ...inspections]);
      setNewInspection({
        vehicle_id: '',
        inspection_type: 'routine',
        scheduled_date: '',
        inspector_id: '',
        inspection_notes: '',
        estimated_duration_hours: 2
      });
      setIsCreating(false);

      toast({
        title: "Inspection Created",
        description: "New inspection has been scheduled"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to create inspection: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const updateInspectionStatus = async (inspectionId: string, status: string) => {
    try {
      const updateData: any = { inspection_status: status };
      
      if (status === 'in_progress') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('vehicle_inspections')
        .update(updateData)
        .eq('id', inspectionId);

      if (error) throw error;

      setInspections(inspections.map(inspection => 
        inspection.id === inspectionId 
          ? { ...inspection, ...updateData }
          : inspection
      ));

      toast({
        title: "Status Updated",
        description: `Inspection status changed to ${status}`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update inspection status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800"><Calendar className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      routine: 'bg-blue-100 text-blue-800',
      annual: 'bg-purple-100 text-purple-800',
      pre_purchase: 'bg-orange-100 text-orange-800',
      diagnostic: 'bg-yellow-100 text-yellow-800',
      safety: 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{type}</Badge>;
  };

  const pendingInspections = inspections.filter(i => ['scheduled', 'in_progress'].includes(i.inspection_status));
  const completedInspections = inspections.filter(i => ['completed', 'cancelled', 'failed'].includes(i.inspection_status));

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Vehicle Inspections</h2>
          <p className="text-muted-foreground">
            Manage and track vehicle inspections
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Inspection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Inspection</DialogTitle>
              <DialogDescription>
                Create a new vehicle inspection
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="vehicle_id">Vehicle ID</Label>
                <Input
                  id="vehicle_id"
                  value={newInspection.vehicle_id}
                  onChange={(e) => setNewInspection({ ...newInspection, vehicle_id: e.target.value })}
                  placeholder="Enter vehicle ID or plate number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="inspection_type">Inspection Type</Label>
                  <Select 
                    value={newInspection.inspection_type} 
                    onValueChange={(value) => setNewInspection({ ...newInspection, inspection_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="pre_purchase">Pre-Purchase</SelectItem>
                      <SelectItem value="diagnostic">Diagnostic</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="estimated_duration">Duration (hours)</Label>
                  <Input
                    id="estimated_duration"
                    type="number"
                    value={newInspection.estimated_duration_hours}
                    onChange={(e) => setNewInspection({ ...newInspection, estimated_duration_hours: parseFloat(e.target.value) })}
                    min="0.5"
                    step="0.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduled_date">Scheduled Date</Label>
                  <Input
                    id="scheduled_date"
                    type="datetime-local"
                    value={newInspection.scheduled_date}
                    onChange={(e) => setNewInspection({ ...newInspection, scheduled_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="inspector">Assign Inspector</Label>
                  <Select 
                    value={newInspection.inspector_id} 
                    onValueChange={(value) => setNewInspection({ ...newInspection, inspector_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select inspector" />
                    </SelectTrigger>
                    <SelectContent>
                      {inspectors.map((inspector) => (
                        <SelectItem key={inspector.id} value={inspector.id}>
                          {inspector.name} ({inspector.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newInspection.inspection_notes}
                  onChange={(e) => setNewInspection({ ...newInspection, inspection_notes: e.target.value })}
                  placeholder="Any special instructions or notes"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button onClick={createInspection}>
                  Schedule Inspection
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingInspections.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedInspections.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingInspections.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Pending Inspections</h3>
                <p className="text-muted-foreground">
                  Schedule your first inspection to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingInspections.map((inspection) => (
                <Card key={inspection.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{inspection.vehicle_id}</h3>
                          {getTypeBadge(inspection.inspection_type)}
                          {getStatusBadge(inspection.inspection_status)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>
                            <Calendar className="h-4 w-4 inline mr-1" />
                            {format(new Date(inspection.scheduled_date), 'PPp')}
                          </div>
                          <div>
                            <Clock className="h-4 w-4 inline mr-1" />
                            {inspection.estimated_duration_hours}h estimated
                          </div>
                        </div>

                        {inspection.inspector_id && (
                          <div className="mt-2 text-sm">
                            <User className="h-4 w-4 inline mr-1" />
                            Inspector assigned
                          </div>
                        )}

                        {inspection.inspection_notes && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {inspection.inspection_notes}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        {inspection.inspection_status === 'scheduled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateInspectionStatus(inspection.id, 'in_progress')}
                          >
                            Start Inspection
                          </Button>
                        )}
                        {inspection.inspection_status === 'in_progress' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateInspectionStatus(inspection.id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedInspections.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Completed Inspections</h3>
                <p className="text-muted-foreground">
                  Completed inspections will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {completedInspections.map((inspection) => (
                <Card key={inspection.id} className="opacity-75">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{inspection.vehicle_id}</h3>
                          {getTypeBadge(inspection.inspection_type)}
                          {getStatusBadge(inspection.inspection_status)}
                          {inspection.overall_result && (
                            <Badge className={
                              inspection.overall_result === 'pass' ? 'bg-green-100 text-green-800' :
                              inspection.overall_result === 'fail' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {inspection.overall_result}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>
                            <Calendar className="h-4 w-4 inline mr-1" />
                            {format(new Date(inspection.scheduled_date), 'PPp')}
                          </div>
                          {inspection.completed_at && (
                            <div>
                              <CheckCircle className="h-4 w-4 inline mr-1" />
                              {format(new Date(inspection.completed_at), 'PPp')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VehicleInspectionManager;
