
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MapPin, Phone, Clock, DollarSign, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Workshop } from '@/types/workshop';
import { useToast } from '@/hooks/use-toast';

interface WorkshopApprovalSystemProps {
  workshops: Workshop[];
  onApprove: (workshopId: string, notes?: string) => void;
  onReject: (workshopId: string, reason: string) => void;
  isLoading: boolean;
}

const WorkshopApprovalSystem: React.FC<WorkshopApprovalSystemProps> = ({
  workshops,
  onApprove,
  onReject,
  isLoading
}) => {
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

  const pendingWorkshops = workshops.filter(w => w.status === 'pending');

  const handleApprove = () => {
    if (selectedWorkshop) {
      onApprove(selectedWorkshop.id, approvalNotes);
      setSelectedWorkshop(null);
      setApprovalNotes('');
      toast({
        title: "Workshop Approved",
        description: "The workshop has been approved successfully.",
      });
    }
  };

  const handleReject = () => {
    if (selectedWorkshop && rejectionReason.trim()) {
      onReject(selectedWorkshop.id, rejectionReason);
      setSelectedWorkshop(null);
      setRejectionReason('');
      toast({
        title: "Workshop Rejected",
        description: "The workshop has been rejected.",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Review' },
      approved: { color: 'bg-green-100 text-green-800', text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  if (pendingWorkshops.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workshop Approval Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-600">No workshops pending approval at the moment.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workshop Approval Queue ({pendingWorkshops.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingWorkshops.map((workshop) => (
              <div key={workshop.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{workshop.name}</h3>
                    <p className="text-sm text-gray-600">
                      Representative: {workshop.representative_name}
                    </p>
                    {getStatusBadge(workshop.status)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{workshop.location}</span>
                    </div>
                    
                    {workshop.phone_number && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{workshop.phone_number}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Email:</span> {workshop.email}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Applied:</span> {new Date(workshop.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedWorkshop(workshop)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Workshop Details - {workshop.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Workshop Name</Label>
                            <p className="text-sm mt-1">{workshop.name}</p>
                          </div>
                          <div>
                            <Label>Representative</Label>
                            <p className="text-sm mt-1">{workshop.representative_name}</p>
                          </div>
                          <div>
                            <Label>Email</Label>
                            <p className="text-sm mt-1">{workshop.email}</p>
                          </div>
                          <div>
                            <Label>Phone</Label>
                            <p className="text-sm mt-1">{workshop.phone_number}</p>
                          </div>
                          <div>
                            <Label>Location</Label>
                            <p className="text-sm mt-1">{workshop.location}</p>
                          </div>
                          <div>
                            <Label>Status</Label>
                            <div className="mt-1">{getStatusBadge(workshop.status)}</div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button className="flex-1">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Approve Workshop</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p>Are you sure you want to approve {workshop.name}?</p>
                                <div>
                                  <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
                                  <Textarea
                                    id="approval-notes"
                                    value={approvalNotes}
                                    onChange={(e) => setApprovalNotes(e.target.value)}
                                    placeholder="Add any notes for the approval..."
                                    className="mt-1"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button onClick={handleApprove} disabled={isLoading}>
                                    Confirm Approval
                                  </Button>
                                  <DialogTrigger asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogTrigger>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive" className="flex-1">
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Workshop</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p>Please provide a reason for rejecting {workshop.name}:</p>
                                <div>
                                  <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                                  <Textarea
                                    id="rejection-reason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Explain why this workshop is being rejected..."
                                    className="mt-1"
                                    required
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="destructive"
                                    onClick={handleReject}
                                    disabled={!rejectionReason.trim() || isLoading}
                                  >
                                    Confirm Rejection
                                  </Button>
                                  <DialogTrigger asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogTrigger>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkshopApprovalSystem;
