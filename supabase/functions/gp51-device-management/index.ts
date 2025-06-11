
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GP51_API_URL = "https://api.gpstrackerxy.com/api";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action } = body;

    console.log(`🔧 GP51 Device Management: ${action}`);

    // Get current session
    const { data: session, error: sessionError } = await supabase
      .from("gp51_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({
        success: false,
        error: "No valid GP51 session found"
      }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const makeGP51Call = async (apiAction: string, params: Record<string, string>) => {
      const formData = new URLSearchParams({
        action: apiAction,
        json: "1",
        suser: session.username,
        stoken: session.gp51_token,
        ...params
      });

      const response = await fetch(GP51_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
          "User-Agent": "EnvioFleet/1.0"
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      console.log(`📊 GP51 ${apiAction} response:`, text.substring(0, 200));

      const json = JSON.parse(text);
      return json;
    };

    switch (action) {
      case 'chargedevices': {
        const { deviceids, chargeyears, devicetype } = body;
        
        const result = await makeGP51Call('chargedevices', {
          deviceids: Array.isArray(deviceids) ? deviceids.join(',') : deviceids,
          chargeyears: String(chargeyears),
          devicetype: String(devicetype || 1)
        });

        // Update local device management tracking
        if (result.result !== "false") {
          const deviceIdList = Array.isArray(deviceids) ? deviceids : [deviceids];
          
          for (const deviceId of deviceIdList) {
            const { data: vehicle } = await supabase
              .from('vehicles')
              .select('id')
              .eq('device_id', deviceId)
              .single();

            if (vehicle) {
              await supabase
                .from('gp51_device_management')
                .upsert({
                  vehicle_id: vehicle.id,
                  gp51_device_id: deviceId,
                  device_type: devicetype || 1,
                  activation_status: 'active',
                  charge_years: chargeyears,
                  service_end_date: new Date(Date.now() + (chargeyears * 365 * 24 * 60 * 60 * 1000)).toISOString(),
                  last_sync_at: new Date().toISOString()
                }, {
                  onConflict: 'vehicle_id,gp51_device_id'
                });

              // Update vehicle activation status
              await supabase
                .from('vehicles')
                .update({
                  activation_status: 'active',
                  updated_at: new Date().toISOString()
                })
                .eq('id', vehicle.id);
            }
          }
        }

        return new Response(JSON.stringify({
          success: result.result !== "false",
          data: result,
          status: result.status || 0
        }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      case 'setdeviceprop': {
        const { deviceid, propname, propvalue } = body;
        
        const result = await makeGP51Call('setdeviceprop', {
          deviceid,
          propname,
          propvalue
        });

        // Update local device properties tracking
        if (result.result !== "false") {
          const { data: vehicle } = await supabase
            .from('vehicles')
            .select('id')
            .eq('device_id', deviceid)
            .single();

          if (vehicle) {
            const { data: deviceMgmt } = await supabase
              .from('gp51_device_management')
              .select('device_properties')
              .eq('vehicle_id', vehicle.id)
              .single();

            const updatedProperties = {
              ...(deviceMgmt?.device_properties || {}),
              [propname]: propvalue
            };

            await supabase
              .from('gp51_device_management')
              .upsert({
                vehicle_id: vehicle.id,
                gp51_device_id: deviceid,
                device_properties: updatedProperties,
                last_sync_at: new Date().toISOString()
              }, {
                onConflict: 'vehicle_id,gp51_device_id'
              });
          }
        }

        return new Response(JSON.stringify({
          success: result.result !== "false",
          data: result,
          status: result.status || 0
        }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      case 'queryalldevices': {
        const result = await makeGP51Call('queryalldevices', {});

        return new Response(JSON.stringify({
          success: result.result !== "false",
          data: result,
          devices: result.devices || []
        }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      default:
        return new Response(JSON.stringify({
          success: false,
          error: "Unknown action"
        }), {
          status: 400,
          headers: corsHeaders,
        });
    }

  } catch (error) {
    console.error("❌ GP51 Device Management error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Internal error"
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
