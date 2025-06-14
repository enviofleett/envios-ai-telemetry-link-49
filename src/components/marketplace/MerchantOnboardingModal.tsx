
import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useMerchantApplication } from '@/hooks/useMerchantApplication';
import { toast } from 'sonner';
import { Loader2, UploadCloud, File as FileIcon, Trash2, BadgeCheck, AlertCircle } from 'lucide-react';
import { MerchantApplicationDocument } from '@/types/merchant-application';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface MerchantOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const applicationSchema = z.object({
  org_name: z.string().min(2, "Organization name is required"),
  contact_email: z.string().email("Invalid email address"),
  business_address: z.string().optional(),
  website_url: z.string().url("Invalid URL").optional().or(z.literal('')),
  business_type: z.string().optional(),
  business_registration_id: z.string().optional(),
  tax_id: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const DocumentUploader = ({ title, documentType, onFileChange, isUploading, document }: { title: string, documentType: string, onFileChange: (e: React.ChangeEvent<HTMLInputElement>, dt: string) => void, isUploading: boolean, document?: MerchantApplicationDocument }) => {
  return (
      <div className="space-y-2 p-4 border rounded-lg">
          <Label className="font-medium">{title}</Label>
          {document ? (
              <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                      <FileIcon className="h-5 w-5 text-primary" />
                      <span className="text-sm truncate max-w-xs">{document.file_path.split('/').pop()}</span>
                      {document.verified && <BadgeCheck className="h-4 w-4 text-green-500" />}
                  </div>
              </div>
          ) : (
              <div className="relative">
                  <Input id={documentType} type="file" onChange={(e) => onFileChange(e, documentType)} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors">
                      {isUploading ? (
                           <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Uploading...</>
                      ) : (
                           <><UploadCloud className="mr-2 h-4 w-4"/> Click or drag to upload</>
                      )}
                  </div>
              </div>
          )}
      </div>
  )
}

export const MerchantOnboardingModal: React.FC<MerchantOnboardingModalProps> = ({
  isOpen, onClose, onSubmit
}) => {
  const { user } = useAuth();
  const { application, isLoading, saveApplication, isSaving, uploadDoc, isUploading, submit, isSubmitting, refetch } = useMerchantApplication();
  
  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  });

  useEffect(() => {
    if (isOpen && user) {
        refetch();
    }
  }, [isOpen, user, refetch]);

  useEffect(() => {
    if (application) {
      form.reset({
        org_name: application.org_name || '',
        contact_email: application.contact_email || user?.email || '',
        business_address: application.business_address || '',
        website_url: application.website_url || '',
        business_type: application.business_type || '',
        business_registration_id: application.business_registration_id || '',
        tax_id: application.tax_id || '',
      });
    } else if (user) {
        form.reset({
            contact_email: user.email,
        })
    }
  }, [application, user, form]);

  const handleSaveDraft = async (values: ApplicationFormData) => {
    await saveApplication(values);
  };

  const handleSubmitApplication = async () => {
    if (form.formState.isDirty) {
        const isValid = await form.trigger();
        if(!isValid) {
            toast.error("Please fix the errors before submitting.");
            return;
        }
        await saveApplication(form.getValues());
    }

    try {
        const submittedApp = await submit();
        toast.success("Application submitted successfully!");
        onSubmit(submittedApp);
        onClose();
    } catch (error: any) {
        toast.error("Failed to submit application: " + error.message);
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Save a draft first if it's a new application
    let currentApplication = application;
    if (!currentApplication) {
        const isValid = await form.trigger();
        if(!isValid) {
            toast.error("Please fill required fields before uploading documents.");
            return;
        }
        currentApplication = await saveApplication(form.getValues());
    }

    await uploadDoc({ document_type: documentType, file });
    e.target.value = '';
  };
  
  const isSubmittable = useMemo(() => {
    if (!application || (application.documents || []).length === 0) return false;
    return true;
  }, [application]);
  
  const isSubmittedOrInReview = useMemo(() => 
    application?.status && application.status !== 'draft' && application.status !== 'requires_more_info'
  , [application?.status]);


  if (isLoading) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent><div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div></DialogContent>
        </Dialog>
    );
  }

  if (isSubmittedOrInReview) {
      return (
          <Dialog open={isOpen} onOpenChange={onClose}>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Application Status</DialogTitle>
                  </DialogHeader>
                  <div className="p-4 space-y-4">
                    <p>Your application is currently being processed. We will notify you of any updates.</p>
                    <p>Status: <Badge>{application?.status?.replace('_', ' ')}</Badge></p>
                  </div>
                  <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter>
              </DialogContent>
          </Dialog>
      )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Merchant Application</DialogTitle>
          <DialogDescription>
            {application?.status === 'requires_more_info' ? 'Your application requires more information. Please review and resubmit.' : 'Complete the form to apply to become a merchant.'}
          </DialogDescription>
        </DialogHeader>

        {application?.status === 'requires_more_info' && (
            <div className="p-3 my-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5"/>
                <div>
                    <h4 className="font-semibold">Action Required</h4>
                    <p className="text-sm">Our team has reviewed your application and requires more information. Please check for comments and update your application.</p>
                    {application.rejection_reason && <p className="mt-2 text-sm"><strong>Admin Feedback:</strong> {application.rejection_reason}</p>}
                </div>
            </div>
        )}

        <form onSubmit={form.handleSubmit(handleSaveDraft)} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="org_name">Organization Name</Label>
                        <Input id="org_name" {...form.register("org_name")} />
                        {form.formState.errors.org_name && <p className="text-destructive text-sm">{form.formState.errors.org_name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contact_email">Contact Email</Label>
                        <Input id="contact_email" type="email" {...form.register("contact_email")} />
                        {form.formState.errors.contact_email && <p className="text-destructive text-sm">{form.formState.errors.contact_email.message}</p>}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="business_address">Business Address</Label>
                    <Input id="business_address" {...form.register("business_address")} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="website_url">Website URL</Label>
                        <Input id="website_url" {...form.register("website_url")} />
                        {form.formState.errors.website_url && <p className="text-destructive text-sm">{form.formState.errors.website_url.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="business_type">Type of Business</Label>
                        <Input id="business_type" {...form.register("business_type")} placeholder="e.g., Electronics, Fashion" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="business_registration_id">Business Registration ID</Label>
                        <Input id="business_registration_id" {...form.register("business_registration_id")} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="tax_id">Tax ID / VAT Number</Label>
                        <Input id="tax_id" {...form.register("tax_id")} />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                 <h3 className="font-semibold text-lg border-b pb-2">Required Documents</h3>
                 <p className="text-sm text-muted-foreground">Please upload documents for verification. At least one is required to submit.</p>
                <DocumentUploader
                    title="Business License"
                    documentType="business_license"
                    onFileChange={handleFileChange}
                    isUploading={isUploading || !application}
                    document={application?.documents?.find(d => d.document_type === 'business_license')}
                />
                 <DocumentUploader
                    title="Tax Identification Document"
                    documentType="tax_document"
                    onFileChange={handleFileChange}
                    isUploading={isUploading || !application}
                    document={application?.documents?.find(d => d.document_type === 'tax_document')}
                />
            </div>

          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : 'Save Draft'}
            </Button>
            <Button type="button" onClick={handleSubmitApplication} disabled={isSubmitting || !isSubmittable}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Submitting...</> : 'Submit Application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
