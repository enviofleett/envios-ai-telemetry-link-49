
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useImportApproval = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const initiatePreviewMutation = useMutation({
    mutationFn: async ({ jobName, targetUsernames }: { jobName: string; targetUsernames: string[] }) => {
      const { data, error } = await supabase.functions.invoke('gp51-data-preview', {
        body: { jobName, targetUsernames, previewMode: true }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Data preview initiated successfully');
      queryClient.invalidateQueries({ queryKey: ['importPreviewData'] });
    },
    onError: (error) => {
      console.error('Preview initiation failed:', error);
      toast.error('Failed to initiate data preview');
    }
  });

  const approveImportMutation = useMutation({
    mutationFn: async (previewIds: string[]) => {
      const { error } = await supabase
        .from('gp51_import_previews')
        .update({ 
          review_status: 'approved',
          updated_at: new Date().toISOString()
        })
        .in('id', previewIds);

      if (error) throw error;

      // Trigger actual import for approved records
      const { data, error: importError } = await supabase.functions.invoke('passwordless-gp51-import', {
        body: { 
          jobName: `Approved Import - ${new Date().toISOString()}`,
          approvedPreviewIds: previewIds
        }
      });

      if (importError) throw importError;
      return data;
    },
    onSuccess: () => {
      toast.success('Import approved and initiated successfully');
      queryClient.invalidateQueries({ queryKey: ['importPreviewData'] });
    },
    onError: (error) => {
      console.error('Import approval failed:', error);
      toast.error('Failed to approve import');
    }
  });

  const rejectImportMutation = useMutation({
    mutationFn: async (previewIds: string[]) => {
      const { error } = await supabase
        .from('gp51_import_previews')
        .update({ 
          review_status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .in('id', previewIds);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Records rejected successfully');
      queryClient.invalidateQueries({ queryKey: ['importPreviewData'] });
    },
    onError: (error) => {
      console.error('Import rejection failed:', error);
      toast.error('Failed to reject records');
    }
  });

  const initiatePreview = async (params: { jobName: string; targetUsernames: string[] }) => {
    setIsProcessing(true);
    try {
      await initiatePreviewMutation.mutateAsync(params);
    } finally {
      setIsProcessing(false);
    }
  };

  const approveImport = async (previewIds: string[]) => {
    setIsProcessing(true);
    try {
      await approveImportMutation.mutateAsync(previewIds);
    } finally {
      setIsProcessing(false);
    }
  };

  const rejectImport = async (previewIds: string[]) => {
    setIsProcessing(true);
    try {
      await rejectImportMutation.mutateAsync(previewIds);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    initiatePreview,
    approveImport,
    rejectImport,
    isProcessing
  };
};
