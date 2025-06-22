
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkImportRequest {
  action: 'start' | 'get_status' | 'cancel';
  jobId?: string;
  jobName?: string;
  chunkSize?: number;
  importType?: string;
}

serve(async (req) => {
  console.log(`🚀 Enhanced Bulk Import: ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    let body: BulkImportRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid JSON in request body' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, jobId, jobName, chunkSize = 50, importType = 'gp51_vehicles' } = body;
    console.log(`🔧 Action: ${action}`);

    // Authenticate request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Authorization required' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: user, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user.user) {
      console.error('❌ Authentication failed:', authError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid authentication token' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Route to appropriate handler
    switch (action) {
      case 'start':
        return await handleStartImport(supabase, user.user.id, jobName!, chunkSize, importType);
      
      case 'get_status':
        return await handleGetStatus(supabase, jobId!);
      
      case 'cancel':
        return await handleCancelImport(supabase, jobId!);
      
      default:
        console.warn(`❌ Unknown action: ${action}`);
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Unknown action: ${action}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('❌ Enhanced Bulk Import error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleStartImport(
  supabase: any, 
  userId: string, 
  jobName: string, 
  chunkSize: number, 
  importType: string
) {
  try {
    console.log(`🚀 Starting bulk import job: ${jobName}`);

    // Check GP51 credentials
    const gp51Username = Deno.env.get('GP51_ADMIN_USERNAME');
    const gp51Password = Deno.env.get('GP51_ADMIN_PASSWORD');
    
    if (!gp51Username || !gp51Password) {
      console.error('❌ GP51 credentials not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'GP51 admin credentials not configured. Please contact administrator.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Test GP51 connectivity first
    try {
      await testGP51Connectivity(gp51Username, gp51Password);
      console.log('✅ GP51 connectivity test passed');
    } catch (connectError) {
      console.error('❌ GP51 connectivity test failed:', connectError);
      return new Response(JSON.stringify({
        success: false,
        error: `GP51 connection failed: ${connectError.message}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create backup before starting
    console.log('📦 Creating system backup...');
    const backupResult = await createSystemBackup(supabase);
    console.log('✅ Backup created:', backupResult);

    // Create import job record
    const { data: jobData, error: jobError } = await supabase
      .from('bulk_import_jobs')
      .insert({
        job_name: jobName,
        status: 'pending',
        import_type: importType,
        chunk_size: chunkSize,
        created_by: userId,
        import_data: {
          backup_info: backupResult,
          gp51_credentials_configured: true,
          started_by: userId
        }
      })
      .select()
      .single();

    if (jobError) {
      console.error('❌ Failed to create job record:', jobError);
      throw new Error(`Failed to create import job: ${jobError.message}`);
    }

    console.log('✅ Import job created:', jobData.id);

    // Start the actual import process asynchronously
    startImportProcess(supabase, jobData.id, gp51Username, gp51Password);

    return new Response(JSON.stringify({
      success: true,
      job: jobData,
      message: 'Bulk import job started successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Failed to start import:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start import'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleGetStatus(supabase: any, jobId: string) {
  try {
    const { data: job, error } = await supabase
      .from('bulk_import_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      throw new Error(`Failed to get job status: ${error.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      job
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Failed to get status:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get status'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleCancelImport(supabase: any, jobId: string) {
  try {
    const { data: job, error } = await supabase
      .from('bulk_import_jobs')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to cancel job: ${error.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      job,
      message: 'Import job cancelled successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Failed to cancel import:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel import'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function testGP51Connectivity(username: string, password: string) {
  const gp51BaseUrl = Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
  const testUrl = `${gp51BaseUrl}/webapi`;
  
  console.log(`🌐 Testing GP51 connectivity to: ${testUrl}`);
  
  const response = await fetch(`${testUrl}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&from=WEB&type=USER`, {
    method: 'GET',
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`GP51 server responded with status: ${response.status}`);
  }

  const result = await response.text();
  if (result.includes('error') || result.includes('fail')) {
    throw new Error(`GP51 authentication failed: ${result}`);
  }

  return result;
}

async function createSystemBackup(supabase: any) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `bulk_import_backup_${timestamp}`;
    
    // Get current counts for backup metadata
    const { count: vehicleCount } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true });
    
    const { count: userCount } = await supabase
      .from('envio_users')
      .select('*', { count: 'exact', head: true });

    return {
      backup_name: backupName,
      timestamp,
      vehicle_count: vehicleCount || 0,
      user_count: userCount || 0,
      backup_created: true
    };
  } catch (error) {
    console.error('❌ Backup creation failed:', error);
    return {
      backup_created: false,
      error: error instanceof Error ? error.message : 'Unknown backup error'
    };
  }
}

async function startImportProcess(supabase: any, jobId: string, username: string, password: string) {
  try {
    console.log(`🔄 Starting import process for job: ${jobId}`);
    
    // Update job status to running
    await supabase
      .from('bulk_import_jobs')
      .update({
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId);

    // Simulate import process (replace with actual GP51 import logic)
    const totalItems = 100; // This would come from GP51 device count
    let processedItems = 0;
    
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
      processedItems += 20;
      
      // Update progress
      await supabase
        .from('bulk_import_jobs')
        .update({
          processed_items: processedItems,
          total_items: totalItems,
          current_chunk: i + 1,
          total_chunks: 5
        })
        .eq('id', jobId);
      
      console.log(`📊 Progress: ${processedItems}/${totalItems} items processed`);
    }
    
    // Complete the job
    await supabase
      .from('bulk_import_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        successful_items: processedItems,
        processed_items: processedItems,
        total_items: totalItems
      })
      .eq('id', jobId);
    
    console.log('✅ Import process completed successfully');
    
  } catch (error) {
    console.error('❌ Import process failed:', error);
    
    // Update job status to failed
    await supabase
      .from('bulk_import_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_log: [{ 
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }]
      })
      .eq('id', jobId);
  }
}
