
import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMerchantApplication } from '@/hooks/useMerchantApplication';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Send, Save, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import DocumentUploader from './DocumentUploader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import CategorySelector from './CategorySelector';
import { useMerchantOnboardingData } from '@/hooks/useMerchantOnboardingData';

const applicationSchema = z.object({
  org_name: z.string().min(2, { message: "Organization name is required." }),
  contact_email: z.string().email({ message: "A valid contact email is required." }),
  business_address: z.string().optional(),
  website_url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  business_type: z.string().optional(),
  business_registration_id: z.string().optional(),
  tax_id: z.string().optional(),
  selected_category_ids: z.array(z.string()).min(1, { message: "Please select at least one business category." }).default([]),
  total_fee: z.number().optional(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

const MerchantApplicationForm: React.FC = () => {
    const { user } = useAuth();
    const { 
        application, 
        saveApplication, 
        submit, 
        isSaving, 
        isSubmitting,
    } = useMerchantApplication();
    const { settings } = useMerchantOnboardingData();

    const form = useForm<ApplicationFormValues>({
        resolver: zodResolver(applicationSchema),
        defaultValues: {
            org_name: '',
            contact_email: user?.email || '',
            business_address: '',
            website_url: '',
            business_type: '',
            business_registration_id: '',
            tax_id: '',
            selected_category_ids: [],
            total_fee: 0,
        },
    });

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
                selected_category_ids: application.selected_category_ids || [],
                total_fee: application.total_fee || 0,
            });
        }
    }, [application, form, user]);

    const calculateTotalFee = (selectedCategoryIds: string[]): number => {
        if (!settings) {
            return application?.total_fee || 0;
        }
        const { 
            free_categories_included = 2, 
            additional_category_fee = 0, 
            registration_fee = 0, 
        } = settings;
        const selectedCount = selectedCategoryIds.length;
        const additionalCategories = Math.max(0, selectedCount - free_categories_included);
        const additionalFee = additionalCategories * additional_category_fee;
        const totalFee = (registration_fee || 0) + additionalFee;
        return totalFee;
    }

    const handleSaveDraft: SubmitHandler<ApplicationFormValues> = async (data) => {
        const dataWithFee = { ...data, total_fee: calculateTotalFee(data.selected_category_ids) };
        await saveApplication(dataWithFee);
    };

    const handleSubmitApplication: SubmitHandler<ApplicationFormValues> = async (data) => {
        const dataWithFee = { ...data, total_fee: calculateTotalFee(data.selected_category_ids) };
        await saveApplication(dataWithFee);
        await submit();
    };
    
    const renderInfoRequest = () => {
        if (application?.status === 'requires_more_info' && application.rejection_reason) {
            return (
                <Alert variant="default" className="mb-6 bg-yellow-100 border-yellow-200 text-yellow-800 [&>svg]:text-yellow-500">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Action Required</AlertTitle>
                    <AlertDescription>
                        <p className="font-semibold">Our team has requested more information:</p>
                        <p className="mt-2 text-sm">{application.rejection_reason}</p>
                    </AlertDescription>
                </Alert>
            );
        }
        return null;
    }

    return (
        <Form {...form}>
            <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                {renderInfoRequest()}
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="org_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Organization Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Your Company LLC" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="contact_email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contact Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="contact@yourcompany.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="business_address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Business Address</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="123 Main St, Anytown, USA 12345" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="website_url"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Website URL</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://yourcompany.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="business_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Business Type</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Corporation, LLC" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="business_registration_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Business Registration ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your business registration number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="tax_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tax ID (e.g., EIN)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Your Tax ID" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Separator />
                
                <CategorySelector />
                <FormField
                  control={form.control}
                  name="selected_category_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                         <input type="hidden" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {application && <DocumentUploader />}

                <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-4">
                        <Button type="button" variant="outline" onClick={form.handleSubmit(handleSaveDraft)} disabled={isSaving || isSubmitting}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Draft
                        </Button>
                        {application && (
                             <Button type="button" onClick={form.handleSubmit(handleSubmitApplication)} disabled={isSaving || isSubmitting || !application.documents || application.documents.length === 0}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Submit Application
                            </Button>
                        )}
                    </div>
                    {(!application || !application.documents || application.documents.length === 0) && (
                        <p className="text-sm text-muted-foreground">
                            You must save a draft and upload at least one document to submit.
                        </p>
                    )}
                </div>
            </form>
        </Form>
    );
};

export default MerchantApplicationForm;
