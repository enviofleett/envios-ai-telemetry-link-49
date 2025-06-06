
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './cors-handler.ts';
import { initializeJobContext } from './context-initializer.ts';

export async function handlePasswordlessImportRequest(
  requestBody: any,
  supabase: any
): Promise<Response> {
  console.log('=== Passwordless Import Request Started at', new Date().toISOString(), '===');
  
  try {
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    let targetUsernames: string[] = [];
    
    if (requestBody.approvedPreviewIds && Array.isArray(requestBody.approvedPreviewIds)) {
      console.log('Processing approved import request');
      
      const { handleApprovedImport } = await import('./approval-handler.ts');
      const context = await initializeJobContext(requestBody.jobName || 'Approved Import', []);
      
      const approvalResult = await handleApprovedImport(requestBody.approvedPreviewIds, context);
      if (!approvalResult.success) {
        throw new Error(approvalResult.error || 'Failed to process approved previews');
      }
      
      targetUsernames = approvalResult.processedUsernames;
      console.log(`Extracted ${targetUsernames.length} usernames from approved previews`);
      
    } else if (requestBody.targetUsernames && Array.isArray(requestBody.targetUsernames)) {
      targetUsernames = requestBody.targetUsernames;
      console.log('Processing direct username import');
      
    } else {
      console.error('Invalid targetUsernames:', requestBody.targetUsernames);
      throw new Error('Invalid request: targetUsernames must be a non-empty array or approvedPreviewIds must be provided');
    }

    if (targetUsernames.length === 0) {
      throw new Error('No valid usernames found for import');
    }

    const jobName = requestBody.jobName;
    if (!jobName || typeof jobName !== 'string' || jobName.trim().length === 0) {
      throw new Error('Invalid job name provided');
    }

    const context = await initializeJobContext(jobName, targetUsernames);
    
    const { startEnhancedImportJob } = await import('./enhanced-job-manager.ts');
    const result = await startEnhancedImportJob(targetUsernames, context);

    console.log('=== Import Request Completed Successfully ===');
    return new Response(JSON.stringify({
      success: true,
      jobId: result.jobId,
      message: `Import job initiated for ${targetUsernames.length} users`,
      targetUsernames,
      estimatedCompletion: result.estimatedCompletion
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Import request failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
