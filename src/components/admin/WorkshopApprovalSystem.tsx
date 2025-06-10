
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Eye, MapPin, Mail, Phone, Clock } from 'lucide-react';
import { Workshop } from '@/types/workshop';
import { useToast } from '@/hooks/use-toast';

interface WorkshopApprovalSystemProps {
  workshops: Workshop[];
  onApprove: (workshopId: string, notes?: string) => void;
  onReject: (workshopId: string, reason: string) => void;
  isLoading?: boolean;
}

const WorkshopApprovalSystem: React.FC<WorkshopApprovalSystemProps> = ({
  workshops,
  onApprove,
  onReject,
  isLoading = false
}) => {
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const { toast } = useToast();

  const pendingWorkshops = workshops.filter(w => !w.verified && w.is_active);
  const approvedWorkshops = workshops.filter(w => w.verified && w.is_active);
  const rejectedWorkshops = workshops.filter(w => !w.is_active);

  const handleApprove = () => {
    if (selectedWorkshop) {
      onApprove(selectedWorkshop.id, approvalNotes);
      setSelectedWorkshop(null);
      setShowDetailsModal(false);
      setApprovalNotes('');
      toast({
        title: "Workshop Approved",
        description: `${selectedWorkshop.name} has been approved and activated.`
      });
    }
  };

  const handleReject = () => {
    if (selectedWorkshop && rejectReason.trim()) {
      onReject(selectedWorkshop.id, rejectReason);
      setSelectedWorkshop(null);
      setShowRejectModal(false);
      setRejectReason('');
      toast({
        title: "Workshop Rejected",
        description: `${selectedWorkshop.name} has been rejected.`,
        variant: "destructive"
      });
    }
  };

  const WorkshopCard = ({ workshop }: { workshop: Workshop }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{workshop.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{workshop.representative_name}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={workshop.verified ? "default" : "secondary"}>
                {workshop.verified ? "Verified" : "Pending"}
              </Badge>
              <Badge variant="outline">
                {workshop.service_types.length} Services
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{workshop.city}, {workshop.country}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>{workshop.email}</span>
        </div>
        
        {workshop.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{workshop.phone}</span>
          </div>
        )}
        
        {workshop.operating_hours && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{workshop.operating_hours}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center pt-2">
          <div className="text-sm">
            <span className="font-medium">Fees:</span>
            <span className="ml-1">Connection: ${workshop.connection_fee}</span>
            <span className="ml-2">Activation: ${workshop.activation_fee}</span>
          </div>
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedWorkshop(workshop);
              setShowDetailsModal(true);
            }}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
          
          {!workshop.verified && workshop.is_active && (
            <>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedWorkshop(workshop);
                  handleApprove();
                }}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setSelectedWorkshop(workshop);
                  setShowRejectModal(true);
                }}
                disabled={isLoading}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Workshop Management</h2>
        <p className="text-muted-foreground">
          Review and approve workshop registrations
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Approval ({pendingWorkshops.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedWorkshops.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedWorkshops.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingWorkshops.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No workshops pending approval</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingWorkshops.map(workshop => (
                <WorkshopCard key={workshop.id} workshop={workshop} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedWorkshops.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No approved workshops</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedWorkshops.map(workshop => (
                <WorkshopCard key={workshop.id} workshop={workshop} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedWorkshops.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No rejected workshops</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rejectedWorkshops.map(workshop => (
                <WorkshopCard key={workshop.id} workshop={workshop} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Workshop Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Workshop Details</DialogTitle>
            <DialogDescription>
              Review workshop information before approval
            </DialogDescription>
          </DialogHeader>
          
          {selectedWorkshop && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Workshop Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedWorkshop.name}</p>
                </div>
                <div>
                  <Label className="font-medium">Representative</Label>
                  <p className="text-sm text-muted-foreground">{selectedWorkshop.representative_name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedWorkshop.email}</p>
                </div>
                <div>
                  <Label className="font-medium">Phone</Label>
                  <p className="text-sm text-muted-foreground">{selectedWorkshop.phone || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Location</Label>
                  <p className="text-sm text-muted-foreground">{selectedWorkshop.city}, {selectedWorkshop.country}</p>
                </div>
                <div>
                  <Label className="font-medium">Operating Hours</Label>
                  <p className="text-sm text-muted-foreground">{selectedWorkshop.operating_hours || 'Not specified'}</p>
                </div>
              </div>
              
              {selectedWorkshop.address && (
                <div>
                  <Label className="font-medium">Address</Label>
                  <p className="text-sm text-muted-foreground">{selectedWorkshop.address}</p>
                </div>
              )}
              
              <div>
                <Label className="font-medium">Service Types</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedWorkshop.service_types.map((service, index) => (
                    <Badge key={index} variant="outline">{service}</Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Connection Fee</Label>
                  <p className="text-sm text-muted-foreground">${selectedWorkshop.connection_fee}</p>
                </div>
                <div>
                  <Label className="font-medium">Activation Fee</Label>
                  <p className="text-sm text-muted-foreground">${selectedWorkshop.activation_fee}</p>
                </div>
              </div>
              
              {!selectedWorkshop.verified && selectedWorkshop.is_active && (
                <div>
                  <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
                  <Textarea
                    id="approval-notes"
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Add any notes for this approval..."
                    className="mt-1"
                  />
                </div>
              )}
              
              {!selectedWorkshop.verified && selectedWorkshop.is_active && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleApprove} className="flex-1 bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Workshop
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowRejectModal(true);
                    }}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Workshop
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Workshop Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Workshop</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this workshop registration.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Rejection Reason *</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this workshop is being rejected..."
                required
                className="mt-1"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1"
              >
                Reject Workshop
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkshopApprovalSystem;
