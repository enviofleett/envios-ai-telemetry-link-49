
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GP51_API_URL = "https://www.gps51.com/webapi";
const REQUEST_TIMEOUT = 5000;
const MAX_RETRIES = 2;

// MD5 hash function for password hashing
async function md5(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function callGP51WithRetry(
  formData: URLSearchParams, 
  attempt: number = 1
): Promise<{ success: boolean; response?: Response; error?: string; statusCode?: number }> {
  try {
    console.log(`GP51 API call attempt ${attempt}/${MAX_RETRIES + 1}`);
    console.log('Form data:', Object.fromEntries(formData.entries()));
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(GP51_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0'
      },
      body: formData.toString(),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log(`GP51 API response: status=${response.status}`);
    
    return { success: true, response, statusCode: response.status };
    
  } catch (error) {
    console.error(`GP51 API attempt ${attempt} failed:`, error);
    
    if (attempt <= MAX_RETRIES) {
      const delay = attempt * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGP51WithRetry(formData, attempt + 1);
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error',
      statusCode: 0
    };
  }
}

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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const makeGP51Call = async (apiAction: string, params: Record<string, string>) => {
      const hashedPassword = await md5(session.gp51_password);
      const formData = new URLSearchParams({
        action: apiAction,
        username: session.username,
        password: hashedPassword,
        from: 'WEB',
        type: 'USER',
        ...params
      });

      console.log(`📡 Making GP51 ${apiAction} call with params:`, Object.keys(params));

      const result = await callGP51WithRetry(formData);
      
      if (!result.success) {
        throw new Error(result.error || 'GP51 API call failed');
      }

      const response = result.response!;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      console.log(`📊 GP51 ${apiAction} response:`, text.substring(0, 200));

      const json = JSON.parse(text);
      
      // Check for GP51 specific errors
      if (json.status !== 0) {
        console.error(`🛑 GP51 ${apiAction} failed:`, json.cause || json.message);
        throw new Error(json.cause || json.message || `GP51 ${apiAction} failed`);
      }

      return json;
    };

    switch (action) {
      case 'chargedevices': {
        const { deviceids, chargeyears, devicetype } = body;
        
        if (!deviceids || !chargeyears) {
          return new Response(JSON.stringify({
            success: false,
            error: "Device IDs and charge years are required"
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const result = await makeGP51Call('chargedevices', {
          deviceids: Array.isArray(deviceids) ? deviceids.join(',') : deviceids,
          chargeyears: String(chargeyears),
          devicetype: String(devicetype || 1)
        });

        console.log(`📊 GP51 chargedevices result:`, result);

        // Update local device management tracking
        if (result.status === 0) {
          const deviceIdList = Array.isArray(deviceids) ? deviceids : [deviceids];
          
          for (const deviceId of deviceIdList) {
            try {
              const { data: vehicle } = await supabase
                .from('vehicles')
                .select('id')
                .eq('device_id', deviceId)
                .single();

              if (vehicle) {
                // Calculate service end date
                const serviceEndDate = new Date();
                serviceEndDate.setFullYear(serviceEndDate.getFullYear() + chargeyears);

                await supabase
                  .from('gp51_device_management')
                  .upsert({
                    vehicle_id: vehicle.id,
                    gp51_device_id: deviceId,
                    device_type: devicetype || 1,
                    activation_status: 'active',
                    charge_years: chargeyears,
                    service_end_date: serviceEndDate.toISOString(),
                    last_sync_at: new Date().toISOString(),
                    device_properties: result
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

                console.log(`✅ Updated activation status for device ${deviceId}`);
              } else {
                console.warn(`⚠️ No vehicle found for device ${deviceId}`);
              }
            } catch (trackingError) {
              console.error(`❌ Failed to update tracking for device ${deviceId}:`, trackingError);
            }
          }
        }

        return new Response(JSON.stringify({
          success: result.status === 0,
          data: result,
          status: result.status || 0,
          message: result.status === 0 ? 'Device charged successfully' : result.message
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        if (result.status === 0) {
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
          success: result.status === 0,
          data: result,
          status: result.status || 0
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'queryalldevices': {
        const result = await makeGP51Call('queryalldevices', {});

        return new Response(JSON.stringify({
          success: result.status === 0,
          data: result,
          devices: result.devices || []
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'checkactivation': {
        const { deviceid } = body;
        
        if (!deviceid) {
          return new Response(JSON.stringify({
            success: false,
            error: "Device ID is required"
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        try {
          // Query all devices to check activation status
          const result = await makeGP51Call('queryalldevices', {});
          
          if (result.status === 0 && result.devices) {
            const device = result.devices.find((d: any) => d.deviceid === deviceid);
            
            if (device) {
              const isActivated = device.isfree === 0; // isfree=0 means activated/paid
              
              return new Response(JSON.stringify({
                success: true,
                isActivated,
                deviceStatus: isActivated ? 'active' : 'inactive',
                deviceInfo: device
              }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            } else {
              return new Response(JSON.stringify({
                success: false,
                error: "Device not found in GP51",
                isActivated: false,
                deviceStatus: 'not_found'
              }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          } else {
            return new Response(JSON.stringify({
              success: false,
              error: result.message || "Failed to query devices",
              isActivated: false,
              deviceStatus: 'error'
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } catch (error) {
          console.error(`❌ Error checking activation for device ${deviceid}:`, error);
          return new Response(JSON.stringify({
            success: false,
            error: error.message,
            isActivated: false,
            deviceStatus: 'error'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown action: ${action}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error("❌ GP51 Device Management error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Internal error",
      details: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
