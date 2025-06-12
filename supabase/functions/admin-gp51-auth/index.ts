
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MD5 hashing function
async function createMD5Hash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// GP51 Authentication function
async function authenticateWithGP51(username: string, password: string) {
  console.log(`🔐 Attempting GP51 authentication for user: ${username}`);
  
  try {
    const hashedPassword = await createMD5Hash(password);
    console.log(`🔒 Password hashed (length: ${hashedPassword.length})`);
    
    const authPayload = {
      action: 'login',
      username: username,
      password: hashedPassword,
      from: 'WEB',
      type: 'USER'
    };

    console.log('📡 Sending GP51 authentication request...');
    const response = await fetch('https://www.gps51.com/webapi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FleetIQ-Admin/1.0'
      },
      body: JSON.stringify(authPayload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📊 GP51 response status:', result.status);

    if (result.status === 0 && result.token) {
      console.log('✅ GP51 authentication successful');
      return {
        success: true,
        token: result.token,
        username: username
      };
    } else {
      console.error('❌ GP51 authentication failed:', result.cause || 'Unknown error');
      return {
        success: false,
        error: result.cause || 'GP51 authentication failed'
      };
    }
  } catch (error) {
    console.error('❌ GP51 authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Authentication required' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid authentication token' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, adminEmail } = await req.json();

    if (action === 'authenticate_admin') {
      // Verify this is the authorized admin
      if (user.email !== 'chudesyl@gmail.com' || adminEmail !== 'chudesyl@gmail.com') {
        console.error('❌ Unauthorized admin access attempt:', user.email);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Unauthorized: Admin access denied' 
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('🔐 Processing admin GP51 authentication request');

      // Get admin credentials from environment/secrets
      const gp51AdminUsername = Deno.env.get('GP51_ADMIN_USERNAME') || 'octopus';
      const gp51AdminPassword = Deno.env.get('GP51_ADMIN_PASSWORD') || '@Octopus360%';

      console.log(`🔑 Using GP51 credentials - Username: ${gp51AdminUsername}`);

      // Authenticate with GP51
      const authResult = await authenticateWithGP51(gp51AdminUsername, gp51AdminPassword);

      if (authResult.success) {
        // Store session in database for future use
        const { error: sessionError } = await supabase
          .from('gp51_sessions')
          .upsert({
            username: authResult.username,
            gp51_token: authResult.token,
            token_expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
            envio_user_id: user.id,
            updated_at: new Date().toISOString()
          });

        if (sessionError) {
          console.error('⚠️ Failed to store GP51 session:', sessionError);
        } else {
          console.log('✅ GP51 session stored successfully');
        }
      }

      return new Response(JSON.stringify(authResult), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Invalid action' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Admin GP51 auth function error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
