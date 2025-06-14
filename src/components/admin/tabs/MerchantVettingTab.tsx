
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminMerchantApplications } from '@/hooks/useAdminMerchantApplications';
import { MerchantApplication, MerchantApplicationStatus } from '@/types/merchant-application';
import { Loader2, Eye, Download, CheckCircle, XCircle, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const ApplicationList = ({ applications, onSelect }: { applications: MerchantApplication[], onSelect: (app: MerchantApplication) => void }) => {
    if (!applications || applications.length === 0) {
        return <p className="text-center text-muted-foreground p-8">No applications in this category.</p>
    }
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {applications.map(app => (
                    <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.org_name}</TableCell>
                        <TableCell>{app.contact_email}</TableCell>
                        <TableCell>{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>{app.documents?.length || 0}</TableCell>
                        <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => onSelect(app)}><Eye className="mr-2 h-4 w-4" /> Review</Button></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const ApplicationDetailView = ({ application, isOpen, onClose }: { application: MerchantApplication, isOpen: boolean, onClose: () => void }) => {
    const { updateStatus, isUpdatingStatus } = useAdminMerchantApplications();
    const [feedback, setFeedback] = useState('');

    const handleUpdateStatus = async (status: MerchantApplicationStatus) => {
        if((status === 'rejected' || status === 'requires_more_info') && !feedback) {
            toast.error("Please provide feedback for the applicant.");
            return;
        }
        try {
            await updateStatus({ id: application.id, status, rejection_reason: feedback });
            toast.success(`Application status updated to "${status.replace('_', ' ')}".`);
            onClose();
        } catch (error: any) {
            toast.error(`Failed to update status: ${error.message}`);
        }
    }
    
    const handleDownload = async (filePath: string) => {
        try {
            const { data, error } = await supabase.storage.from('merchant-documents').download(filePath);
            if(error) throw error;
            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = filePath.split('/').pop() || 'document';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error: any) {
            toast.error(`Failed to download document: ${error.message}`);
        }
    }

    const canBeActioned = application.status === 'submitted' || application.status === 'in_review';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Review Application: {application.org_name}</DialogTitle>
                    <DialogDescription>
                        Status: <Badge variant={application.status === 'approved' ? 'default' : application.status === 'rejected' ? 'destructive' : 'secondary'}>{application.status.replace('_', ' ')}</Badge>
                        <span className="mx-2">|</span>
                        Submitted on {new Date(application.submitted_at!).toLocaleString()}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><Label className="text-xs">Organization</Label><p className="font-semibold">{application.org_name}</p></div>
                        <div><Label className="text-xs">Email</Label><p>{application.contact_email}</p></div>
                        <div><Label className="text-xs">Website</Label><p>{application.website_url || 'N/A'}</p></div>
                        <div><Label className="text-xs">Business Type</Label><p>{application.business_type || 'N/A'}</p></div>
                        <div><Label className="text-xs">Business Reg. ID</Label><p>{application.business_registration_id || 'N/A'}</p></div>
                        <div><Label className="text-xs">Tax ID</Label><p>{application.tax_id || 'N/A'}</p></div>
                        <div className="col-span-2"><Label className="text-xs">Address</Label><p>{application.business_address || 'N/A'}</p></div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Uploaded Documents</h4>
                        <div className="space-y-2">
                            {(application.documents || []).map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-2 border rounded-md">
                                    <span className="capitalize">{doc.document_type.replace('_', ' ')}</span>
                                    <Button size="sm" variant="ghost" onClick={() => handleDownload(doc.file_path)}><Download className="mr-2 h-4 w-4" />Download</Button>
                                </div>
                            ))}
                            {(application.documents || []).length === 0 && <p className="text-muted-foreground text-sm">No documents uploaded.</p>}
                        </div>
                    </div>
                    {canBeActioned && (
                        <div className="space-y-2">
                            <Label htmlFor="feedback">Feedback / Reason for Rejection</Label>
                            <Textarea id="feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Provide clear feedback for the applicant..."/>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    {canBeActioned && (
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => handleUpdateStatus('requires_more_info')} disabled={isUpdatingStatus || !feedback}>
                                {isUpdatingStatus ? <Loader2 className="animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Request Info
                            </Button>
                             <Button variant="destructive" onClick={() => handleUpdateStatus('rejected')} disabled={isUpdatingStatus || !feedback}>
                                {isUpdatingStatus ? <Loader2 className="animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />} Reject
                            </Button>
                            <Button onClick={() => handleUpdateStatus('approved')} disabled={isUpdatingStatus}>
                                {isUpdatingStatus ? <Loader2 className="animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />} Approve
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export const MerchantVettingTab: React.FC = () => {
    const [statusFilter, setStatusFilter] = useState<MerchantApplicationStatus | 'all'>('submitted');
    const { applications, isLoading } = useAdminMerchantApplications(statusFilter);
    const [selectedApplication, setSelectedApplication] = useState<MerchantApplication | null>(null);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Merchant Applications Vetting</CardTitle>
                <CardDescription>Review and manage merchant applications.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={statusFilter} onValueChange={(val) => setStatusFilter(val as MerchantApplicationStatus | 'all')}>
                    <TabsList>
                        <TabsTrigger value="submitted">Submitted</TabsTrigger>
                        <TabsTrigger value="in_review">In Review</TabsTrigger>
                        <TabsTrigger value="requires_more_info">Needs Info</TabsTrigger>
                        <TabsTrigger value="approved">Approved</TabsTrigger>
                        <TabsTrigger value="rejected">Rejected</TabsTrigger>
                        <TabsTrigger value="all">All</TabsTrigger>
                    </TabsList>
                    <TabsContent value={statusFilter} className="mt-4">
                        {isLoading ? (
                            <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : (
                            <ApplicationList applications={applications || []} onSelect={setSelectedApplication} />
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
            {selectedApplication && (
                <ApplicationDetailView 
                    application={selectedApplication} 
                    isOpen={!!selectedApplication} 
                    onClose={() => setSelectedApplication(null)}
                />
            )}
        </Card>
    );
};

export default MerchantVettingTab;
