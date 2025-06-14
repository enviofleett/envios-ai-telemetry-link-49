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

    const { data: application, isLoading, isError, error, refetch } = useQuery({
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
        error,
        saveApplication,
        isSaving,
        uploadDoc,
        isUploading,
        submit,
        isSubmitting,
        refetch
    };
};
