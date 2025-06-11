
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "./crypto.ts";

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

      console.log(`📡 Making GP51 ${apiAction} call with params:`, Object.keys(params));

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
      
      // Check for GP51 specific errors
      if (json.result === "false" || json.result === false) {
        console.error(`🛑 GP51 ${apiAction} failed:`, json.message || json.cause);
        throw new Error(json.message || json.cause || `GP51 ${apiAction} failed`);
      }

      return json;
    };

    switch (action) {
      case 'adduser': {
        const { username, password, showname, email, usertype, multilogin } = body;
        
        if (!username || !password) {
          return new Response(JSON.stringify({
            success: false,
            error: "Username and password are required"
          }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        // Hash password using MD5 as required by GP51
        let hashedPassword;
        try {
          hashedPassword = await createHash(password);
        } catch (hashError) {
          console.error('Password hashing failed:', hashError);
          return new Response(JSON.stringify({
            success: false,
            error: "Password hashing failed"
          }), {
            status: 500,
            headers: corsHeaders,
          });
        }

        const result = await makeGP51Call('adduser', {
          username,
          password: hashedPassword,
          showname: showname || username,
          email: email || '',
          usertype: String(usertype || 3), // Default to end user
          multilogin: String(multilogin || 1)
        });

        // Track the user creation in our management table
        if (result.status === 0) {
          try {
            await supabase
              .from('gp51_user_management')
              .insert({
                gp51_username: username,
                gp51_user_type: usertype || 3,
                activation_status: 'active',
                activation_date: new Date().toISOString(),
                last_sync_at: new Date().toISOString()
              });
          } catch (trackingError) {
            console.warn('Failed to track user in gp51_user_management:', trackingError);
          }
        }

        return new Response(JSON.stringify({
          success: result.status === 0,
          data: result,
          status: result.status || 0,
          gp51_username: username
        }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      case 'edituser': {
        const { username, showname, email, usertype } = body;
        
        if (!username) {
          return new Response(JSON.stringify({
            success: false,
            error: "Username is required"
          }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        const params: Record<string, string> = { username };
        if (showname) params.showname = showname;
        if (email) params.email = email;
        if (usertype) params.usertype = String(usertype);

        const result = await makeGP51Call('edituser', params);

        // Update tracking table
        if (result.status === 0) {
          try {
            await supabase
              .from('gp51_user_management')
              .update({
                last_sync_at: new Date().toISOString()
              })
              .eq('gp51_username', username);
          } catch (trackingError) {
            console.warn('Failed to update user tracking:', trackingError);
          }
        }

        return new Response(JSON.stringify({
          success: result.status === 0,
          data: result,
          status: result.status || 0
        }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      case 'deleteuser': {
        const { usernames } = body;
        
        if (!usernames) {
          return new Response(JSON.stringify({
            success: false,
            error: "Usernames parameter is required"
          }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        const result = await makeGP51Call('deleteuser', {
          usernames: Array.isArray(usernames) ? usernames.join(',') : usernames
        });

        // Update tracking table
        if (result.status === 0) {
          try {
            const usernameList = Array.isArray(usernames) ? usernames : [usernames];
            for (const username of usernameList) {
              await supabase
                .from('gp51_user_management')
                .update({
                  activation_status: 'deleted',
                  last_sync_at: new Date().toISOString()
                })
                .eq('gp51_username', username);
            }
          } catch (trackingError) {
            console.warn('Failed to update user tracking after deletion:', trackingError);
          }
        }

        return new Response(JSON.stringify({
          success: result.status === 0,
          data: result,
          status: result.status || 0
        }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      case 'test_user_creation': {
        // Test endpoint to verify GP51 user management is working
        const { username } = body;
        
        try {
          const result = await makeGP51Call('queryallusers', {});
          const users = result.users || [];
          const userExists = users.some((user: any) => user.username === username);
          
          return new Response(JSON.stringify({
            success: true,
            userExists,
            totalUsers: users.length,
            data: result
          }), {
            status: 200,
            headers: corsHeaders,
          });
        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            error: error.message
          }), {
            status: 500,
            headers: corsHeaders,
          });
        }
      }

      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown action: ${action}`
        }), {
          status: 400,
          headers: corsHeaders,
        });
    }

  } catch (error) {
    console.error("❌ GP51 User Management error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Internal error",
      details: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
