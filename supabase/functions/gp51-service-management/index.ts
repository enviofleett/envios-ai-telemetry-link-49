
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { initSupabaseClient } from "./supabase-helpers.ts";
import { optionsResponse, errorResponse } from "./response-helpers.ts";
import { handleTestConnection } from "./handlers/test-connection.ts";
import { handleTestGp51Api } from "./handlers/test-gp51-api.ts";

serve(async (req) => {
  console.log(`GP51 Service Management API call: ${req.method} ${req.url}`);
  const startTime = Date.now();

  if (req.method === 'OPTIONS') {
    return optionsResponse();
  }

  try {
    const supabase = initSupabaseClient();
    const body = await req.json();
    const action = body?.action;
    console.log(`GP51 Service Management API call: Action: ${action}`);

    if (!action) {
      return errorResponse("Action not specified in request body", 400);
    }

    switch (action) {
      case 'test_connection':
        return await handleTestConnection(supabase, startTime);
      case 'test_gp51_api':
        return await handleTestGp51Api(supabase, startTime);
      default:
        console.warn(`Unknown action received: ${action}`);
        return errorResponse(`Unknown action: ${action}`, 400);
    }
  } catch (error) {
    console.error('GP51 Service Management unhandled error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    // Check if it's a JSON parsing error from req.json()
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
        return errorResponse("Invalid JSON in request body", 400, { latency: Date.now() - startTime });
    }
    return errorResponse(errorMessage, 500, { latency: Date.now() - startTime });
  }
});
