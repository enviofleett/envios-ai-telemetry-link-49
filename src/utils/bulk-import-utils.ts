
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
