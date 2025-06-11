
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "../settings-management/crypto.ts";

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

    console.log(`🔧 GP51 User Management: ${action}`);

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
      case 'adduser': {
        const { username, password, showname, email, usertype, multilogin } = body;
        
        // Hash password if provided
        let hashedPassword = password;
        if (password) {
          hashedPassword = await createHash(password);
        }

        const result = await makeGP51Call('adduser', {
          username,
          password: hashedPassword,
          showname,
          email: email || '',
          usertype: String(usertype || 3),
          multilogin: String(multilogin || 1)
        });

        return new Response(JSON.stringify({
          success: result.result !== "false",
          data: result,
          status: result.status || 0
        }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      case 'edituser': {
        const { username, showname, email, usertype } = body;
        
        const params: Record<string, string> = { username };
        if (showname) params.showname = showname;
        if (email) params.email = email;
        if (usertype) params.usertype = String(usertype);

        const result = await makeGP51Call('edituser', params);

        return new Response(JSON.stringify({
          success: result.result !== "false",
          data: result,
          status: result.status || 0
        }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      case 'deleteuser': {
        const { usernames } = body;
        
        const result = await makeGP51Call('deleteuser', {
          usernames: Array.isArray(usernames) ? usernames.join(',') : usernames
        });

        return new Response(JSON.stringify({
          success: result.result !== "false",
          data: result,
          status: result.status || 0
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
    console.error("❌ GP51 User Management error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Internal error"
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
