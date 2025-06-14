
import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMerchantApplication } from '@/hooks/useMerchantApplication';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import DocumentUploader from './DocumentUploader';
import { Separator } from '@/components/ui/separator';
import CategorySelector from './CategorySelector';
import { useMerchantOnboardingData } from '@/hooks/useMerchantOnboardingData';
import { applicationSchema, ApplicationFormValues } from './schema';
import InfoRequestAlert from './InfoRequestAlert';
import ApplicationFormFields from './ApplicationFormFields';
import ApplicationFormActions from './ApplicationFormActions';

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
    
    return (
        <Form {...form}>
            <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                <InfoRequestAlert application={application} />
                
                <ApplicationFormFields />

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

                <ApplicationFormActions
                    isSaving={isSaving}
                    isSubmitting={isSubmitting}
                    application={application}
                    onSave={form.handleSubmit(handleSaveDraft)}
                    onSubmit={form.handleSubmit(handleSubmitApplication)}
                />
            </form>
        </Form>
    );
};

export default MerchantApplicationForm;
