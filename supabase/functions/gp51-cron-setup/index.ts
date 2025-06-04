
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

    // This function sets up or manages the cron job for GP51 polling
    const { action } = await req.json().catch(() => ({ action: 'status' }));

    switch (action) {
      case 'setup':
        // Setup cron job to call our polling function every 30 seconds
        const setupQuery = `
          SELECT cron.schedule(
            'gp51-realtime-polling',
            '*/30 * * * * *', -- every 30 seconds
            $$
            SELECT net.http_post(
              url := 'https://bjkqxmvjuewshomihjqm.supabase.co/functions/v1/gp51-realtime-polling',
              headers := '{"Content-Type": "application/json", "Authorization": "Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}"}'::jsonb,
              body := '{"trigger": "cron"}'::jsonb
            );
            $$
          );
        `;

        const { error: setupError } = await supabase.rpc('sql', { query: setupQuery });
        
        if (setupError) {
          console.error('Cron setup error:', setupError);
          throw new Error(`Failed to setup cron job: ${setupError.message}`);
        }

        return new Response(
          JSON.stringify({ message: 'Cron job setup successful' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'disable':
        const disableQuery = `SELECT cron.unschedule('gp51-realtime-polling');`;
        
        const { error: disableError } = await supabase.rpc('sql', { query: disableQuery });
        
        if (disableError) {
          console.error('Cron disable error:', disableError);
          throw new Error(`Failed to disable cron job: ${disableError.message}`);
        }

        return new Response(
          JSON.stringify({ message: 'Cron job disabled successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'status':
      default:
        // Get current cron job status
        const statusQuery = `SELECT * FROM cron.job WHERE jobname = 'gp51-realtime-polling';`;
        
        const { data: cronStatus, error: statusError } = await supabase.rpc('sql', { query: statusQuery });
        
        return new Response(
          JSON.stringify({ 
            cronJobExists: cronStatus && cronStatus.length > 0,
            cronJobs: cronStatus
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Cron management error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
