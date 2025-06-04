
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useImportPreviewData = () => {
  const { data: previewData, isLoading, refetch } = useQuery({
    queryKey: ['importPreviewData'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gp51_import_previews')
        .select(`
          *,
          gp51_data_conflicts (
            id,
            conflict_type,
            conflict_details,
            resolution_status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching preview data:', error);
        throw error;
      }

      return data || [];
    }
  });

  const summary = previewData ? {
    totalRecords: previewData.length,
    totalUsers: new Set(previewData.map(r => r.gp51_username)).size,
    totalVehicles: previewData.reduce((sum, r) => {
      const vehicleData = Array.isArray(r.raw_vehicle_data) ? r.raw_vehicle_data : [];
      return sum + vehicleData.length;
    }, 0),
    eligible: previewData.filter(r => r.import_eligibility === 'eligible').length,
    conflicts: previewData.filter(r => r.import_eligibility === 'conflict').length,
    rejected: previewData.filter(r => r.review_status === 'rejected').length,
    reviewed: previewData.filter(r => r.review_status !== 'pending').length
  } : null;

  return {
    previewData,
    isLoading,
    summary,
    refetch
  };
};
