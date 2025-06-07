
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { jobId, previewData } = await req.json();

    if (!jobId || !previewData) {
      return new Response(
        JSON.stringify({ error: 'Missing jobId or previewData' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting CSV import for job: ${jobId}`);

    // Update job status to processing
    await supabase
      .from('csv_import_jobs')
      .update({
        status: 'processing',
        progress_percentage: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    const validRows = previewData.valid_rows;
    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      
      try {
        // Get user ID if email is provided
        let assignedUserId = null;
        if (row.assigned_user_email) {
          const { data: user } = await supabase
            .from('envio_users')
            .select('id')
            .eq('email', row.assigned_user_email)
            .single();
          
          if (user) {
            assignedUserId = user.id;
          }
        }

        // Insert vehicle record
        const { error: vehicleError } = await supabase
          .from('vehicles')
          .insert({
            device_id: row.device_id,
            device_name: row.device_name,
            device_type: row.device_type || null,
            sim_number: row.sim_number || null,
            status: row.status || 'active',
            notes: row.notes || null,
            assigned_user_id: assignedUserId,
            is_active: row.is_active !== undefined ? row.is_active : true,
            import_source: 'csv_import',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (vehicleError) {
          throw vehicleError;
        }

        successCount++;
      } catch (error) {
        console.error(`Error importing row ${i + 1}:`, error);
        failureCount++;
        errors.push({
          row_number: i + 1,
          field_name: 'general',
          error_message: error.message || 'Unknown error during import',
          raw_data: row
        });
      }

      // Update progress
      const progress = Math.round(((i + 1) / validRows.length) * 100);
      await supabase
        .from('csv_import_jobs')
        .update({
          processed_rows: i + 1,
          successful_imports: successCount,
          failed_imports: failureCount,
          progress_percentage: progress,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
    }

    // Final job update
    const finalStatus = failureCount === 0 ? 'completed' : 'completed';
    await supabase
      .from('csv_import_jobs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        error_log: errors,
        import_results: {
          total_processed: validRows.length,
          successful: successCount,
          failed: failureCount,
          completion_time: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    // Log validation errors if any
    if (errors.length > 0) {
      const validationLogs = errors.map(error => ({
        import_job_id: jobId,
        row_number: error.row_number,
        validation_type: 'import_error',
        field_name: error.field_name,
        error_message: error.error_message,
        raw_data: error.raw_data,
        created_at: new Date().toISOString()
      }));

      await supabase
        .from('csv_validation_logs')
        .insert(validationLogs);
    }

    console.log(`CSV import completed for job: ${jobId}. Success: ${successCount}, Failed: ${failureCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        results: {
          total_processed: validRows.length,
          successful: successCount,
          failed: failureCount,
          errors: errors
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('CSV import error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
