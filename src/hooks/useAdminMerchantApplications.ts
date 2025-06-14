
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MerchantApplicationStatus } from '@/types/merchant-application';

const fetchApplications = async (status: MerchantApplicationStatus | 'all') => {
    let query = supabase
        .from('merchant_applications')
        .select(`*, merchant_application_documents(*)`);
    
    if (status !== 'all') {
        query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('submitted_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

const updateApplicationStatus = async ({ id, status, rejection_reason }: { id: string, status: MerchantApplicationStatus, rejection_reason?: string }) => {
    const { data, error } = await supabase
        .from('merchant_applications')
        .update({ status, rejection_reason: status === 'rejected' || status === 'requires_more_info' ? rejection_reason : null, reviewed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

export const useAdminMerchantApplications = (status: MerchantApplicationStatus | 'all' = 'submitted') => {
    const queryClient = useQueryClient();

    const { data: applications, isLoading, isError } = useQuery({
        queryKey: ['admin-merchant-applications', status],
        queryFn: () => fetchApplications(status),
    });

    const { mutateAsync: updateStatus, isPending: isUpdatingStatus } = useMutation({
        mutationFn: updateApplicationStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-merchant-applications'] });
        },
    });

    return { applications, isLoading, isError, updateStatus, isUpdatingStatus };
};
