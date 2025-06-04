
import { cors } from './cors.ts';
import { initializeJobContext } from './context-initializer.ts';

const corsHandler = cors({
  allowOrigin: '*',
  allowHeaders: '*',
  allowMethods: ['POST', 'OPTIONS'],
});

export async function handlePasswordlessImportRequest(req: Request): Promise<Response> {
  console.log('=== Passwordless Import Request Started at', new Date().toISOString(), '===');
  
  try {
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    let targetUsernames: string[] = [];
    
    if (body.approvedPreviewIds && Array.isArray(body.approvedPreviewIds)) {
      console.log('Processing approved import request');
      
      const { handleApprovedImport } = await import('./approval-handler.ts');
      const context = await initializeJobContext(body.jobName || 'Approved Import', []);
      
      const approvalResult = await handleApprovedImport(body.approvedPreviewIds, context);
      if (!approvalResult.success) {
        throw new Error(approvalResult.error || 'Failed to process approved previews');
      }
      
      targetUsernames = approvalResult.processedUsernames;
      console.log(`Extracted ${targetUsernames.length} usernames from approved previews`);
      
    } else if (body.targetUsernames && Array.isArray(body.targetUsernames)) {
      targetUsernames = body.targetUsernames;
      console.log('Processing direct username import');
      
    } else {
      console.error('Invalid targetUsernames:', body.targetUsernames);
      throw new Error('Invalid request: targetUsernames must be a non-empty array or approvedPreviewIds must be provided');
    }

    if (targetUsernames.length === 0) {
      throw new Error('No valid usernames found for import');
    }

    const jobName = body.jobName;
    if (!jobName || typeof jobName !== 'string' || jobName.trim().length === 0) {
      throw new Error('Invalid job name provided');
    }

    const context = await initializeJobContext(jobName, targetUsernames);
    
    const { startEnhancedImportJob } = await import('./enhanced-job-manager.ts');
    const result = await startEnhancedImportJob(targetUsernames, context);

    console.log('=== Import Request Completed Successfully ===');
    return corsHandler.addCorsHeaders(new Response(JSON.stringify({
      success: true,
      jobId: result.jobId,
      message: `Import job initiated for ${targetUsernames.length} users`,
      targetUsernames,
      estimatedCompletion: result.estimatedCompletion
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));

  } catch (error) {
    console.error('Import request failed:', error);
    
    return corsHandler.addCorsHeaders(new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    }));
  }
}
