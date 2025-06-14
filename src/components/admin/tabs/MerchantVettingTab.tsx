
import React, { useState } from 'react';
import { useAdminMerchantApplications } from '@/hooks/useAdminMerchantApplications';
import { MerchantApplication, MerchantApplicationStatus } from '@/types/merchant-application';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, FileText, AlertTriangle, ThumbsUp, Send, UserX } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

const statusFilters: (MerchantApplicationStatus | 'all')[] = ['submitted', 'in_review', 'requires_more_info', 'approved', 'rejected', 'all'];

const MerchantVettingTab: React.FC = () => {
  const [activeStatus, setActiveStatus] = useState<MerchantApplicationStatus | 'all'>('submitted');
  const { applications, isLoading, isError, updateStatus, isUpdatingStatus } = useAdminMerchantApplications(activeStatus);
  const [selectedApplication, setSelectedApplication] = useState<MerchantApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const handleUpdateStatus = async (id: string, status: MerchantApplicationStatus, reason?: string) => {
    try {
      await updateStatus({ id, status, rejection_reason: reason });
      toast.success(`Application status updated to ${status}.`);
      if (selectedApplication?.id === id) {
        setSelectedApplication(null);
      }
      setIsRejecting(false);
      setRejectionReason('');
    } catch (error: any) {
      toast.error(`Failed to update status: ${error.message}`);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (isError) {
      return <div className="text-red-500 text-center p-8">Error loading applications.</div>;
    }

    if (!applications || applications.length === 0) {
      return <div className="text-muted-foreground text-center p-8">No applications with status '{activeStatus}'.</div>;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organization</TableHead>
            <TableHead>Contact Email</TableHead>
            <TableHead>Submitted At</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => (
            <TableRow key={app.id}>
              <TableCell>{app.org_name}</TableCell>
              <TableCell>{app.contact_email}</TableCell>
              <TableCell>{app.submitted_at ? new Date(app.submitted_at).toLocaleString() : 'N/A'}</TableCell>
              <TableCell><Badge variant="outline">{app.status.replace(/_/g, ' ')}</Badge></TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => setSelectedApplication(app)}>View Details</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };
  
  const handleRejectWithReason = () => {
      if (selectedApplication) {
          const status = isRejecting ? 'rejected' : 'requires_more_info';
          handleUpdateStatus(selectedApplication.id, status, rejectionReason);
      }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Merchant Vetting</CardTitle>
        <CardDescription>Review and manage merchant applications.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeStatus} onValueChange={(value) => setActiveStatus(value as MerchantApplicationStatus | 'all')}>
          <TabsList>
            {statusFilters.map(status => (
              <TabsTrigger key={status} value={status}>{status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={activeStatus}>
            {renderContent()}
          </TabsContent>
        </Tabs>
      </CardContent>

      {selectedApplication && (
        <Dialog open={!!selectedApplication} onOpenChange={() => {
            setSelectedApplication(null);
            setIsRejecting(false);
            setRejectionReason('');
        }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Application Details: {selectedApplication.org_name}</DialogTitle>
              <DialogDescription>Review documents and application data.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><Label className="font-semibold">Organization:</Label> {selectedApplication.org_name}</div>
                    <div><Label className="font-semibold">Contact Email:</Label> {selectedApplication.contact_email}</div>
                    <div><Label className="font-semibold">Business Address:</Label> {selectedApplication.business_address || 'N/A'}</div>
                    <div><Label className="font-semibold">Website:</Label> {selectedApplication.website_url || 'N/A'}</div>
                    <div><Label className="font-semibold">Business Type:</Label> {selectedApplication.business_type || 'N/A'}</div>
                    <div><Label className="font-semibold">Registration ID:</Label> {selectedApplication.business_registration_id || 'N/A'}</div>
                    <div><Label className="font-semibold">Tax ID:</Label> {selectedApplication.tax_id || 'N/A'}</div>
                </div>

                <div>
                    <h4 className="font-semibold text-lg mt-4 mb-2 border-b pb-1">Documents</h4>
                    {selectedApplication.documents && selectedApplication.documents.length > 0 ? (
                        <ul className="space-y-2">
                            {selectedApplication.documents.map(doc => (
                                <li key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <span className="text-sm">{doc.document_type.replace(/_/g, ' ')}</span>
                                    </div>
                                    <Button variant="link" size="sm" asChild>
                                        <a href={`/storage/v1/object/public/merchant-documents/${doc.file_path}`} target="_blank" rel="noreferrer">View Document</a>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">No documents uploaded.</p>
                    )}
                </div>

                {(isRejecting || selectedApplication.status === 'requires_more_info') && (
                    <div className="space-y-2 pt-4">
                        <Label htmlFor="rejection_reason">{isRejecting ? 'Rejection Reason' : 'Reason for Requiring More Info'}</Label>
                        <Textarea 
                            id="rejection_reason" 
                            value={rejectionReason} 
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder={isRejecting ? 'Provide a clear reason for rejection.' : 'Explain what information is missing or needs correction.'}
                        />
                         <Button onClick={handleRejectWithReason} disabled={isUpdatingStatus}>
                            {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            {isRejecting ? 'Confirm Rejection' : 'Request More Info'}
                        </Button>
                    </div>
                )}
            </div>
            <DialogFooter>
                {selectedApplication.status === 'submitted' || selectedApplication.status === 'in_review' ? (
                    <div className="flex flex-wrap gap-2">
                        <Button variant="destructive" onClick={() => setIsRejecting(true)} disabled={isUpdatingStatus}>
                           <UserX className="mr-2 h-4 w-4" /> Reject
                        </Button>
                         <Button variant="secondary" onClick={() => { setIsRejecting(false); setSelectedApplication({...selectedApplication, status: 'requires_more_info'})}} disabled={isUpdatingStatus}>
                           <AlertTriangle className="mr-2 h-4 w-4" /> More Info Needed
                        </Button>
                        <Button onClick={() => handleUpdateStatus(selectedApplication.id, 'approved')} disabled={isUpdatingStatus}>
                            <ThumbsUp className="mr-2 h-4 w-4" /> Approve
                        </Button>
                        <Button onClick={() => handleUpdateStatus(selectedApplication.id, 'in_review')} disabled={isUpdatingStatus}>
                           <Clock className="mr-2 h-4 w-4" /> Mark as In Review
                        </Button>
                    </div>
                ): null}
                <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default MerchantVettingTab;
