
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './cors-handler.ts';
import { initializeJobContext } from './context-initializer.ts';
import { validateGP51Connection } from './gp51-validator.ts';

export async function handlePasswordlessImportRequest(
  requestBody: any,
  supabase: any
): Promise<Response> {
  console.log('=== Passwordless Import Request Started at', new Date().toISOString(), '===');
  
  try {
    // Validate GP51 connection first
    console.log('Validating GP51 connection...');
    const gp51Validation = await validateGP51Connection();
    if (!gp51Validation.isValid) {
      console.error('GP51 validation failed:', gp51Validation.errors);
      return new Response(JSON.stringify({
        success: false,
        error: 'GP51 connection validation failed',
        details: gp51Validation.errors.join(', '),
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    console.log('GP51 connection validated successfully');

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    let targetUsernames: string[] = [];
    
    if (requestBody.approvedPreviewIds && Array.isArray(requestBody.approvedPreviewIds)) {
      console.log('Processing approved import request with', requestBody.approvedPreviewIds.length, 'previews');
      
      const { handleApprovedImport } = await import('./approval-handler.ts');
      const context = await initializeJobContext(requestBody.jobName || 'Approved Import', []);
      
      const approvalResult = await handleApprovedImport(requestBody.approvedPreviewIds, context);
      if (!approvalResult.success) {
        console.error('Approval handling failed:', approvalResult.error);
        throw new Error(approvalResult.error || 'Failed to process approved previews');
      }
      
      targetUsernames = approvalResult.processedUsernames;
      console.log(`Extracted ${targetUsernames.length} usernames from approved previews`);
      
    } else if (requestBody.targetUsernames && Array.isArray(requestBody.targetUsernames)) {
      targetUsernames = requestBody.targetUsernames;
      console.log('Processing direct username import for', targetUsernames.length, 'users');
      
    } else {
      console.error('Invalid targetUsernames or approvedPreviewIds:', {
        targetUsernames: requestBody.targetUsernames,
        approvedPreviewIds: requestBody.approvedPreviewIds
      });
      throw new Error('Invalid request: targetUsernames must be a non-empty array or approvedPreviewIds must be provided');
    }

    if (targetUsernames.length === 0) {
      console.error('No valid usernames found for import');
      throw new Error('No valid usernames found for import');
    }

    const jobName = requestBody.jobName;
    if (!jobName || typeof jobName !== 'string' || jobName.trim().length === 0) {
      console.error('Invalid job name:', jobName);
      throw new Error('Invalid job name provided');
    }

    console.log('Initializing job context for', targetUsernames.length, 'users');
    const context = await initializeJobContext(jobName, targetUsernames);
    
    console.log('Starting enhanced import job...');
    const { startEnhancedImportJob } = await import('./enhanced-job-manager.ts');
    const result = await startEnhancedImportJob(targetUsernames, context);

    console.log('=== Import Request Completed Successfully ===');
    return new Response(JSON.stringify({
      success: true,
      jobId: result.jobId,
      message: `Import job initiated for ${targetUsernames.length} users`,
      targetUsernames,
      estimatedCompletion: result.estimatedCompletion,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Import request failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
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
