
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const { jobName, targetUsernames, previewMode = true } = await req.json();

    console.log(`=== GP51 Data Preview Started: ${jobName} ===`);

    // Get stored GP51 credentials
    const { data: credentials, error: credError } = await supabase
      .from('gp51_sessions')
      .select('gp51_token, username')
      .not('gp51_token', 'is', null)
      .gt('token_expires_at', new Date().toISOString())
      .single();

    if (credError || !credentials) {
      return new Response(JSON.stringify({ 
        error: 'No valid GP51 credentials found' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create preview job
    const { data: job, error: jobError } = await supabase
      .from('user_import_jobs')
      .insert({
        job_name: jobName,
        import_type: 'preview',
        total_usernames: targetUsernames.length,
        admin_gp51_username: credentials.username,
        imported_usernames: targetUsernames,
        status: 'processing',
        preview_mode: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Failed to create preview job: ${jobError.message}`);
    }

    console.log(`Created preview job ${job.id}`);

    // Process each username for preview
    const previewResults = [];
    
    for (const username of targetUsernames) {
      try {
        console.log(`Processing preview for user: ${username}`);
        
        // Fetch user's vehicles from GP51
        const vehiclesResponse = await fetch(`https://www.gps51.com/webapi?action=querymonitorlist&token=${credentials.gp51_token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username })
        });

        const vehiclesData = await vehiclesResponse.json();
        
        if (vehiclesData.status === 1) {
          console.warn(`Failed to fetch vehicles for ${username}: ${vehiclesData.cause}`);
          continue;
        }

        const vehicles = vehiclesData.records || [];
        console.log(`Found ${vehicles.length} vehicles for ${username}`);

        // Enhance vehicles with position data
        const enhancedVehicles = [];
        for (const vehicle of vehicles.slice(0, 10)) { // Limit for preview
          try {
            const positionResponse = await fetch(`https://www.gps51.com/webapi?action=lastposition&token=${credentials.gp51_token}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deviceid: vehicle.deviceid })
            });

            const positionData = await positionResponse.json();
            
            if (positionData.status === 0 && positionData.lastposition) {
              enhancedVehicles.push({
                ...vehicle,
                ...positionData.lastposition
              });
            } else {
              enhancedVehicles.push(vehicle);
            }
          } catch (error) {
            console.warn(`Failed to get position for device ${vehicle.deviceid}:`, error);
            enhancedVehicles.push(vehicle);
          }
        }

        // Detect conflicts
        const conflicts = [];
        
        // Check for existing user
        const { data: existingUser } = await supabase
          .from('envio_users')
          .select('id')
          .eq('gp51_username', username)
          .single();

        if (existingUser) {
          conflicts.push({
            type: 'duplicate_user',
            username: username,
            message: `User ${username} already exists in Envio system`
          });
        }

        // Check for existing vehicles
        for (const vehicle of enhancedVehicles) {
          const { data: existingVehicle } = await supabase
            .from('vehicles')
            .select('id')
            .eq('device_id', vehicle.deviceid)
            .single();

          if (existingVehicle) {
            conflicts.push({
              type: 'duplicate_vehicle',
              deviceid: vehicle.deviceid,
              message: `Vehicle ${vehicle.deviceid} already exists in Envio system`
            });
          }
        }

        // Create preview record
        const { data: preview, error: previewError } = await supabase
          .from('gp51_import_previews')
          .insert({
            job_id: job.id,
            gp51_username: username,
            raw_user_data: { username, vehicles_count: vehicles.length },
            raw_vehicle_data: enhancedVehicles,
            review_status: 'pending',
            import_eligibility: conflicts.length > 0 ? 'conflict' : 'eligible',
            conflict_flags: conflicts,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (previewError) {
          console.error(`Failed to create preview for ${username}:`, previewError);
          continue;
        }

        // Create conflict records
        for (const conflict of conflicts) {
          await supabase
            .from('gp51_data_conflicts')
            .insert({
              preview_id: preview.id,
              conflict_type: conflict.type,
              conflict_details: conflict,
              resolution_status: 'unresolved'
            });
        }

        previewResults.push({
          username,
          vehicles_count: enhancedVehicles.length,
          conflicts_count: conflicts.length,
          preview_id: preview.id
        });

      } catch (error) {
        console.error(`Error processing ${username}:`, error);
        previewResults.push({
          username,
          error: error.message,
          vehicles_count: 0,
          conflicts_count: 0
        });
      }
    }

    // Update job status
    await supabase
      .from('user_import_jobs')
      .update({
        status: 'completed',
        processed_usernames: previewResults.length,
        successful_imports: previewResults.filter(r => !r.error).length,
        failed_imports: previewResults.filter(r => r.error).length,
        conflicts_count: previewResults.reduce((sum, r) => sum + (r.conflicts_count || 0), 0),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);

    console.log(`=== GP51 Data Preview Completed: ${jobName} ===`);

    return new Response(JSON.stringify({
      success: true,
      jobId: job.id,
      previewResults,
      summary: {
        totalUsers: targetUsernames.length,
        processedUsers: previewResults.length,
        eligibleUsers: previewResults.filter(r => !r.error && (r.conflicts_count || 0) === 0).length,
        conflictUsers: previewResults.filter(r => (r.conflicts_count || 0) > 0).length,
        totalVehicles: previewResults.reduce((sum, r) => sum + (r.vehicles_count || 0), 0)
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('GP51 Data Preview error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
