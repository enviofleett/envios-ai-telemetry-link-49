
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

    console.log("Attempting to fetch device list from GP51...");

    const potentialActions = ["getdevicelist", "getmonitor", "monitor"];
    let gp51Result: FetchGP51Response | undefined;
    let successfulAction: string | null = null;

    for (const action of potentialActions) {
      console.log(`[gp51-device-list] Trying action: '${action}'`);
      gp51Result = await fetchFromGP51({
        action: action,
        session: session!,
      });

      if (!gp51Result.error) {
        successfulAction = action;
        break;
      }
      
      const cause = (gp51Result.gp51_error?.cause || gp51Result.error || "").toLowerCase();
      if (!cause.includes("action not found") && !cause.includes("action invalid")) {
        console.error(`[gp51-device-list] Unrecoverable error with action '${action}':`, gp51Result.error);
        break; 
      }
      
      console.warn(`[gp51-device-list] Action '${action}' failed with 'action not found'. Trying next action.`);
    }

    if (!successfulAction || !gp51Result || gp51Result.error) {
      console.error("[gp51-device-list] All attempts to fetch device list from GP51 failed.", gp51Result);
      return errorResponse(
        `GP51 API error: ${gp51Result?.error || 'All potential actions failed'}`,
        gp51Result?.status || 400,
        gp51Result?.gp51_error || { triedActions: potentialActions }
      );
    }
    
    console.log(`[gp51-device-list] Successfully fetched data with action: '${successfulAction}'`);

    const resultData = gp51Result.data;
    const devices = resultData?.groups?.flatMap((g: any) => g.devices || []) || resultData?.devicelist || [];
    
    console.log(`[gp51-device-list] Successfully parsed ${devices.length} devices.`);
    
    return jsonResponse({ success: true, devices });

  } catch (error) {
    console.error("[gp51-device-list] Critical error in function:", error);
    return errorResponse(`Internal server error: ${error.message}`, 500, error.stack);
  }
});
