
import { getSupabaseClient } from "./supabase_client.ts";
import { errorResponse } from "./response_utils.ts";

export interface GP51Session {
  username: string;
  password_hash: string;
  gp51_token: string;
  token_expires_at?: string;
  envio_user_id: string; // Add the user ID to the interface
  // Add any other relevant fields from your gp51_sessions table
}

export async function getValidGp51Session(): Promise<{ session?: GP51Session; errorResponse?: Response }> {
  const supabase = getSupabaseClient();
  const { data: sessionData, error: sessionError } = await supabase
    .from("gp51_sessions")
    .select("*, envio_user_id") // Include envio_user_id in the selection
    .order("created_at", { ascending: false }) // Assuming most recent is desired
    .limit(1)
    .maybeSingle();

  if (sessionError) {
    console.error("❌ Database error fetching session:", sessionError);
    return { 
      errorResponse: errorResponse(
        "Database error accessing GP51 sessions", 
        500, 
        sessionError.message,
        "DATABASE_ERROR"
      ) 
    };
  }

  if (!sessionData) {
    console.log("❌ No GP51 sessions found - GP51 not configured");
    return { 
      errorResponse: errorResponse(
        "GP51 integration not configured", 
        400, 
        "Please configure GP51 credentials in the admin settings.",
        "NO_GP51_CONFIG"
      ) 
    };
  }
  
  const session = sessionData as GP51Session;

  if (!session.gp51_token) {
    console.error("❌ GP51 session in database is missing a token.");
    return {
      errorResponse: errorResponse(
        "GP51 session is invalid (missing token)",
        401,
        "Session is invalid, please re-authenticate in admin settings.",
        "INVALID_SESSION"
      )
    };
  }

  // Validate that we have a user ID
  if (!session.envio_user_id) {
    console.error("❌ GP51 session is missing envio_user_id.");
    return {
      errorResponse: errorResponse(
        "GP51 session is invalid (missing user ID)",
        401,
        "Session is missing user association, please re-authenticate in admin settings.",
        "INVALID_SESSION"
      )
    };
  }

  if (session.token_expires_at) {
      const expiresAt = new Date(session.token_expires_at);
      const now = new Date();
      if (expiresAt <= now) {
          console.error('❌ GP51 session expired:', { expiresAt, now });
          return { 
            errorResponse: errorResponse(
              'GP51 session expired', 
              401, 
              'Session expired, please refresh credentials',
              'SESSION_EXPIRED'
            ) 
          };
      }
  }

  return { session };
}
