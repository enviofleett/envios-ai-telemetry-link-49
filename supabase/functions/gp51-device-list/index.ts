
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getValidGp51Session } from "../_shared/gp51_session_utils.ts";
import { errorResponse } from "../_shared/response_utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { session, errorResponse: sessionError } = await getValidGp51Session();
    if (sessionError) {
      console.error("Session validation failed in gp51-device-list");
      return sessionError;
    }

    // FIX: Using 'getmonitorlist' which is the correct action for the GP51 API to get all devices.
    const action = "getmonitorlist";
    const GP51_API_BASE = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
    const apiUrl = `${GP51_API_BASE}/webapi`;

    const form = new URLSearchParams();
    form.append("action", action);
    form.append("username", session.username);
    // The password_hash from the DB is the MD5 hash of the password
    form.append("password", session.password_hash);
    form.append("from", "WEB");
    form.append("type", "USER");

    console.log(`Calling GP51 API at ${apiUrl} with action ${action}`);

    const gp51Response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    const responseText = await gp51Response.text();

    if (!gp51Response.ok) {
      console.error(`GP51 API request failed with status: ${gp51Response.status}`, responseText);
      return errorResponse(`GP51 API request failed`, 502, responseText);
    }
    
    const result = JSON.parse(responseText);

    if (result.status !== 0) {
      console.error("GP51 API returned an error:", result);
      return errorResponse(`GP51 API error: ${result.cause || 'Unknown error'}`, 400, result);
    }

    // The devices are nested inside groups, so we flatten them into a single array.
    const devices = result.groups?.flatMap(g => g.devices) || [];
    console.log(`Successfully fetched ${devices.length} devices from GP51.`);
    
    return new Response(JSON.stringify({ success: true, devices }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in gp51-device-list function:", error);
    return errorResponse(`Internal server error: ${error.message}`, 500);
  }
});
