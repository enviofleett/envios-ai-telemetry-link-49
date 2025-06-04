
import { Json } from '@/integrations/supabase/types';
import { ParsedErrorLog } from '@/types/import-job';

export const parseErrorLog = (errorLog: Json | null): ParsedErrorLog[] => {
  if (!errorLog) return [];
  if (Array.isArray(errorLog)) return errorLog;
  if (typeof errorLog === 'string') {
    try {
      const parsed = JSON.parse(errorLog);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const getCurrentStep = (jobData: any): string => {
  if (jobData.status === 'completed') return 'Import Complete';
  if (jobData.status === 'failed') return 'Import Failed';
  if (jobData.status === 'processing') {
    if (jobData.processed_usernames === 0) return 'Initializing...';
    if (jobData.processed_usernames < jobData.total_usernames) return 'Processing Users';
    return 'Finalizing Import';
  }
  return 'Pending';
};

export const getStepDetails = (jobData: any): string => {
  if (jobData.status === 'processing') {
    return `Processing user ${jobData.processed_usernames + 1} of ${jobData.total_usernames}`;
  }
  if (jobData.status === 'completed') {
    return `Successfully imported ${jobData.successful_imports} users with ${jobData.total_vehicles_imported} vehicles`;
  }
  if (jobData.status === 'failed') {
    return 'Import process encountered errors';
  }
  return '';
};
