

export async function cleanupStuckJobs(supabase: any): Promise<void> {
  try {
    console.log('Cleaning up stuck job records...');
    
    // Update any jobs stuck in 'processing' status to 'failed'
    const { error } = await supabase
      .from('user_import_jobs')
      .update({ 
        status: 'failed',
        error_log: [{ 
          error: 'Job was stuck in processing status - cleaned up', 
          timestamp: new Date().toISOString() 
        }],
        updated_at: new Date().toISOString()
      })
      .eq('status', 'processing')
      .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // 10 minutes ago

    if (error) {
      console.error('Failed to cleanup stuck jobs:', error);
    } else {
      console.log('Successfully cleaned up stuck jobs');
    }
  } catch (error) {
    console.error('Error during job cleanup:', error);
  }
}

