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
import { Label } from '@/components/ui/label';

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
                        Status: <Badge variant={application.status === 'approved' ? 'default' : application.status === 'rejected' ? 'destructive' : 'secondary'}>{application.status.replace(/_/g, ' ')}</Badge>
                        <span className="mx-2">|</span>
                        Submitted on {new Date(application.submitted_at!).toLocaleString()}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><Label className="text-xs font-normal text-muted-foreground">Organization</Label><p className="font-semibold">{application.org_name}</p></div>
                        <div><Label className="text-xs font-normal text-muted-foreground">Email</Label><p>{application.contact_email}</p></div>
                        <div><Label className="text-xs font-normal text-muted-foreground">Website</Label><p>{application.website_url || 'N/A'}</p></div>
                        <div><Label className="text-xs font-normal text-muted-foreground">Business Type</Label><p>{application.business_type || 'N/A'}</p></div>
                        <div><Label className="text-xs font-normal text-muted-foreground">Business Reg. ID</Label><p>{application.business_registration_id || 'N/A'}</p></div>
                        <div><Label className="text-xs font-normal text-muted-foreground">Tax ID</Label><p>{application.tax_id || 'N/A'}</p></div>
                        <div className="col-span-2"><Label className="text-xs font-normal text-muted-foreground">Address</Label><p>{application.business_address || 'N/A'}</p></div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Uploaded Documents</h4>
                        <div className="space-y-2">
                            {(application.documents || []).map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-2 border rounded-md">
                                    <span className="capitalize">{doc.document_type.replace(/_/g, ' ')}</span>
                                    <Button size="sm" variant="ghost" onClick={() => handleDownload(doc.file_path)}><Download className="mr-2 h-4 w-4" />Download</Button>
                                </div>
                            ))}
                            {(application.documents || []).length === 0 && <p className="text-muted-foreground text-sm">No documents uploaded.</p>}
                        </div>
                    </div>
                    {(application.status === 'requires_more_info' && application.rejection_reason) && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm font-semibold text-yellow-800">Previous Feedback:</p>
                            <p className="text-sm text-yellow-700">{application.rejection_reason}</p>
                        </div>
                    )}
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
```

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MerchantApplication } from '@/types/merchant-application';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type ApplicationData = Omit<MerchantApplication, 'id' | 'user_id' | 'status' | 'created_at' | 'updated_at' | 'submitted_at' | 'reviewed_by' | 'reviewed_at' | 'rejection_reason' | 'documents'>;

const fetchApplication = async (userId: string | undefined) => {
    if (!userId) return null;

    const { data, error } = await supabase
        .from('merchant_applications')
        .select(`*, merchant_application_documents(*)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
        throw error;
    }
    
    return data;
};

const upsertApplication = async ({ userId, applicationData, applicationId }: { userId: string; applicationData: Partial<ApplicationData>; applicationId?: string }) => {
    const { data, error } = await supabase
        .from('merchant_applications')
        .upsert({ ...applicationData, id: applicationId, user_id: userId } as any)
        .select(`*, merchant_application_documents(*)`)
        .single();
    if (error) throw error;
    return data;
};

const uploadDocument = async ({ application_id, document_type, file, userId }: { application_id: string; document_type: string; file: File; userId: string; }) => {
    const filePath = `${userId}/${application_id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
        .from('merchant-documents')
        .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: docData, error: dbError } = await supabase
        .from('merchant_application_documents')
        .insert({ application_id, document_type, file_path: filePath })
        .select()
        .single();
    if (dbError) throw dbError;

    return docData;
};

const submitApplication = async (applicationId: string) => {
    const { data, error } = await supabase
        .from('merchant_applications')
        .update({ status: 'submitted', submitted_at: new Date().toISOString() })
        .eq('id', applicationId)
        .select()
        .single();

    if (error) throw error;
    return data;
};


export const useMerchantApplication = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: application, isLoading, isError, refetch } = useQuery({
        queryKey: ['merchant-application', user?.id],
        queryFn: () => fetchApplication(user?.id),
        enabled: !!user,
    });

    const { mutateAsync: saveApplication, isPending: isSaving } = useMutation({
        mutationFn: (data: Partial<ApplicationData>) => {
            if (!user) throw new Error('User not authenticated');
            return upsertApplication({ userId: user.id, applicationData: data, applicationId: application?.id });
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['merchant-application', user?.id], data);
            toast.success("Draft saved!");
        },
        onError: (error: any) => {
            toast.error("Failed to save draft: " + error.message);
        }
    });

    const { mutateAsync: uploadDoc, isPending: isUploading } = useMutation({
        mutationFn: (vars: { document_type: string; file: File; }) => {
            if (!user || !application) throw new Error('User or application not available');
            return uploadDocument({ ...vars, application_id: application.id, userId: user.id });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['merchant-application', user?.id] });
            toast.success("Document uploaded successfully!");
        },
        onError: (error: any) => {
            toast.error(`Failed to upload document: ${error.message}`);
        }
    });

    const { mutateAsync: submit, isPending: isSubmitting } = useMutation({
        mutationFn: () => {
            if (!application) throw new Error('No application to submit');
            return submitApplication(application.id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['merchant-application', user?.id] });
        }
    });

    return {
        application: application as MerchantApplication | null,
        isLoading,
        isError,
        saveApplication,
        isSaving,
        uploadDoc,
        isUploading,
        submit,
        isSubmitting,
        refetch
    };
};
