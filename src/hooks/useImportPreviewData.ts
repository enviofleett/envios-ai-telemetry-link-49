
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

// Standardized interfaces with proper Json type handling
interface ImportPreviewSummary {
  totalRecords: number;
  totalUsers: number;
  totalVehicles: number;
  eligible: number;
  conflicts: number;
  rejected: number;
  reviewed: number;
}

interface ImportPreviewRecord {
  id: string;
  gp51_username: string;
  raw_vehicle_data: Json; // Changed from any[] to Json to match Supabase type
  import_eligibility: string;
  review_status: string;
  conflict_flags: Json; // Changed from any[] to Json
  created_at: string;
  gp51_data_conflicts?: Array<{
    id: string;
    conflict_type: string;
    conflict_details: any;
    resolution_status: string;
  }>;
}

// Helper function to safely convert Json to array
function jsonToArray(jsonData: Json): any[] {
  if (Array.isArray(jsonData)) {
    return jsonData;
  }
  if (typeof jsonData === 'string') {
    try {
      const parsed = JSON.parse(jsonData);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export const useImportPreviewData = () => {
  const { data: previewData, isLoading, error, refetch } = useQuery({
    queryKey: ['importPreviewData'],
    queryFn: async (): Promise<ImportPreviewRecord[]> => {
      try {
        console.log('🔍 Fetching import preview data...');
        
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
          console.error('❌ Error fetching preview data:', error);
          throw error;
        }

        console.log(`✅ Successfully fetched ${data?.length || 0} preview records`);
        return data || [];
      } catch (err) {
        console.error('❌ Failed to fetch import preview data:', err);
        throw err;
      }
    },
    retry: 3,
    retryDelay: 1000
  });

  // Calculate summary with safe data handling
  const summary: ImportPreviewSummary | null = previewData ? {
    totalRecords: previewData.length,
    totalUsers: new Set(previewData.map(r => r.gp51_username)).size,
    totalVehicles: previewData.reduce((sum, r) => {
      try {
        const vehicleData = jsonToArray(r.raw_vehicle_data);
        return sum + vehicleData.length;
      } catch (err) {
        console.warn('⚠️ Error processing vehicle data for record:', r.id, err);
        return sum;
      }
    }, 0),
    eligible: previewData.filter(r => r.import_eligibility === 'eligible').length,
    conflicts: previewData.filter(r => r.import_eligibility === 'conflict').length,
    rejected: previewData.filter(r => r.review_status === 'rejected').length,
    reviewed: previewData.filter(r => r.review_status !== 'pending').length
  } : null;

  return {
    previewData: previewData || [],
    isLoading,
    error,
    summary,
    refetch
  };
};
