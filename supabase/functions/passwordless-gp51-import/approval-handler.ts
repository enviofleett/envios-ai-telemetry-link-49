
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getEnvironment } from './environment.ts';
import { JobContext } from './context-initializer.ts';

export interface ApprovalResult {
  success: boolean;
  processedUsernames: string[];
  error?: string;
}

export async function handleApprovedImport(
  approvedPreviewIds: string[], 
  context: JobContext
): Promise<ApprovalResult> {
  const env = getEnvironment();
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  console.log(`Processing ${approvedPreviewIds.length} approved previews`);
  
  try {
    // Fetch approved preview records
    const { data: previews, error: previewError } = await supabase
      .from('gp51_import_previews')
      .select('gp51_username, raw_user_data, raw_vehicle_data')
      .in('id', approvedPreviewIds)
      .eq('review_status', 'approved');

    if (previewError) {
      throw new Error(`Failed to fetch approved previews: ${previewError.message}`);
    }

    if (!previews || previews.length === 0) {
      throw new Error('No approved previews found');
    }

    const processedUsernames = previews.map(p => p.gp51_username);
    
    console.log(`Extracted ${processedUsernames.length} usernames from approved previews`);
    
    return {
      success: true,
      processedUsernames
    };

  } catch (error) {
    console.error('Failed to handle approved import:', error);
    return {
      success: false,
      processedUsernames: [],
      error: error.message
    };
  }
}
