
import { JobProcessingContext } from './enhanced-types.ts';

export interface ApprovalResult {
  success: boolean;
  processedUsernames: string[];
  error?: string;
}

export async function handleApprovedImport(
  approvedPreviewIds: string[],
  context: JobProcessingContext
): Promise<ApprovalResult> {
  console.log(`Processing approved import for ${approvedPreviewIds.length} preview records`);
  
  try {
    // Fetch approved preview records to get usernames and data
    const { data: previewRecords, error: fetchError } = await context.supabase
      .from('gp51_import_previews')
      .select('*')
      .in('id', approvedPreviewIds)
      .eq('review_status', 'approved');

    if (fetchError) {
      console.error('Failed to fetch approved preview records:', fetchError);
      throw new Error(`Failed to fetch preview records: ${fetchError.message}`);
    }

    if (!previewRecords || previewRecords.length === 0) {
      throw new Error('No approved preview records found');
    }

    // Extract usernames from preview records
    const targetUsernames = previewRecords.map(record => record.gp51_username);
    console.log(`Extracted usernames from approved previews: ${targetUsernames.join(', ')}`);

    // Validate that all records are actually approved
    const unapprovedRecords = previewRecords.filter(record => record.review_status !== 'approved');
    if (unapprovedRecords.length > 0) {
      throw new Error(`Found unapproved records in selection: ${unapprovedRecords.map(r => r.gp51_username).join(', ')}`);
    }

    return {
      success: true,
      processedUsernames: targetUsernames
    };

  } catch (error) {
    console.error('Error handling approved import:', error);
    return {
      success: false,
      processedUsernames: [],
      error: error.message
    };
  }
}
