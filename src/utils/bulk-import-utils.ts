
import { Json } from '@/integrations/supabase/types';

/**
 * Safely converts Supabase Json type to array for error_log
 */
export const parseErrorLog = (errorLog: Json | null): any[] => {
  if (!errorLog) return [];
  
  if (Array.isArray(errorLog)) {
    return errorLog;
  }
  
  if (typeof errorLog === 'string') {
    try {
      const parsed = JSON.parse(errorLog);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [errorLog];
    }
  }
  
  if (typeof errorLog === 'object') {
    return [errorLog];
  }
  
  return [errorLog];
};

/**
 * Safely converts Supabase Json type to object for import_data
 */
export const parseImportData = (importData: Json | null): any => {
  if (!importData) return {};
  
  if (typeof importData === 'string') {
    try {
      return JSON.parse(importData);
    } catch {
      return {};
    }
  }
  
  return importData;
};

/**
 * Type guard to validate bulk import job status
 */
export const isValidBulkImportStatus = (status: string): boolean => {
  const validStatuses = ['pending', 'running', 'paused', 'completed', 'completed_with_errors', 'failed'];
  return validStatuses.includes(status);
};

/**
 * Safely normalize status values from database
 */
export const normalizeBulkImportStatus = (status: any): 'pending' | 'running' | 'paused' | 'completed' | 'completed_with_errors' | 'failed' => {
  if (typeof status !== 'string') return 'pending';
  
  const normalizedStatus = status.toLowerCase().trim();
  
  // Handle common variations
  switch (normalizedStatus) {
    case 'pending':
    case 'waiting':
    case 'queued':
      return 'pending';
      
    case 'running':
    case 'processing':
    case 'active':
    case 'in_progress':
      return 'running';
      
    case 'paused':
    case 'suspended':
    case 'halted':
      return 'paused';
      
    case 'completed':
    case 'finished':
    case 'done':
    case 'success':
      return 'completed';
      
    case 'completed_with_errors':
    case 'finished_with_errors':
    case 'partial_success':
      return 'completed_with_errors';
      
    case 'failed':
    case 'error':
    case 'cancelled':
    case 'aborted':
      return 'failed';
      
    default:
      console.warn(`Unknown bulk import status: ${status}, defaulting to 'pending'`);
      return 'pending';
  }
};
