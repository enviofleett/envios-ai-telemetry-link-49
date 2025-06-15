
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { getValidGp51Session } from "../_shared/gp51_session_utils.ts";
import { jsonResponse, errorResponse } from "../_shared/response_utils.ts";
import { fetchFromGP51, FetchGP51Response } from "../_shared/gp51_api_client.ts";
import { handleCorsOptionsRequest } from "../_shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCorsOptionsRequest(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const { session, errorResponse: sessionError } = await getValidGp51Session();
    if (sessionError) {
      console.error("Session validation failed in gp51-device-list");
      return sessionError;
    }

    console.log("[gp51-device-list] Attempting to fetch device list from GP51 with 'querymonitorlist' action...");

    const gp51Result = await fetchFromGP51({
      action: "querymonitorlist",
      session: session!,
      // As per docs, username is a parameter for querymonitorlist in the body
      additionalParams: {
        username: session!.username,
      },
    });

    if (gp51Result.error) {
      console.error("[gp51-device-list] Failed to fetch device list from GP51.", gp51Result);
      return errorResponse(
        `GP51 API error: ${gp51Result.error}`,
        gp51Result.status || 400,
        gp51Result.gp51_error || { triedAction: "querymonitorlist" }
      );
    }
    
    console.log(`[gp51-device-list] Successfully fetched data with action: 'querymonitorlist'`);

    const resultData = gp51Result.data;
    const devices = resultData?.groups?.flatMap((g: any) => g.devices || []) || [];
    
    console.log(`[gp51-device-list] Successfully parsed ${devices.length} devices.`);
    
    return jsonResponse({ success: true, devices });

  } catch (error) {
    console.error("[gp51-device-list] Critical error in function:", error);
    return errorResponse(`Internal server error: ${error.message}`, 500, error.stack);
  }
});
