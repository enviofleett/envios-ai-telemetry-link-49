
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase_client.ts';
import { CORS_HEADERS } from '../_shared/cors.ts';
import { md5_for_gp51_only, checkRateLimit, sanitizeInput, isValidEmail } from '../_shared/crypto_utils.ts';
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const GP51_API_URL = 'https://www.gps51.com/webapi';

async function getGP51AdminToken(supabase: SupabaseClient): Promise<string> {
    const username = Deno.env.get('GP51_ADMIN_USERNAME');
    const password = Deno.env.get('GP51_ADMIN_PASSWORD');
    if (!username || !password) throw new Error("GP51 admin credentials not configured.");
    
    // Use GP51-compatible hash only for API calls
    const hashedPassword = md5_for_gp51_only(password);
    const getUrl = `${GP51_API_URL}?action=login&username=${encodeURIComponent(username)}&password=${hashedPassword}`;
    
    const response = await fetch(getUrl, {
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error('Failed to authenticate GP51 admin user.');

    const result = await response.json();
    if (result.status !== 0 || !result.token) {
        throw new Error(result.cause || 'GP51 admin authentication failed.');
    }
    
    return result.token;
}

async function createGP51User(adminToken: string, userDetails: any, userType: string) {
    const gp51UserTypeMap = { 'end_user': 0, 'sub_admin': 1 };
    const gp51UserType = gp51UserTypeMap[userType] ?? 0;

    const body = {
        action: 'createuser',
        token: adminToken,
        username: sanitizeInput(userDetails.email),
        password: md5_for_gp51_only(userDetails.password), // Only for GP51 compatibility
        email: userDetails.email,
        phone: userDetails.phone_number,
        usertype: gp51UserType,
        showname: userDetails.name,
        multilogin: 0
    };
    
    console.log('[user-registration-service] Creating GP51 user with payload:', { ...body, password: '***', token: '***' });
    const response = await fetch(GP51_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) throw new Error(`GP51 API error: ${response.statusText}`);
    const result = await response.json();

    if (result.status !== 0) {
        throw new Error(`Failed to create GP51 user: ${result.cause || result.message}`);
    }
    
    console.log('[user-registration-service] GP51 user created successfully.');
    return result;
}

serve(async (req) => {
  console.log(`[user-registration-service] Received request: ${req.method} ${req.url}`);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  // Rate limiting
  if (!checkRateLimit(clientIP, 5, 15 * 60 * 1000)) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Too many registration attempts. Please try again later.' 
    }), {
      status: 429, 
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabase = getSupabaseClient();
    const body = await req.json().catch(() => null);
    
    if (!body) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid JSON in request body' 
      }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const { email, password, name, phone_number, package_id } = body;

    // Input validation
    if (!email || !password || !name || !package_id) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Email, password, name, and package_id are required." 
        }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
    }

    if (!isValidEmail(email)) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Invalid email format." 
        }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
    }

    if (password.length < 6) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Password must be at least 6 characters long." 
        }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
    }

    // Fetch package and determine user_type
    const { data: pkg, error: pkgError } = await supabase
        .from('packages')
        .select('associated_user_type')
        .eq('id', package_id)
        .single();
    if (pkgError || !pkg) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Invalid package selected." 
        }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
    }
    const user_type = pkg.associated_user_type;

    // Get GP51 Admin Token
    const adminToken = await getGP51AdminToken(supabase);

    // Create user in GP51 FIRST using the new service
    console.log(`[user-registration-service] Creating GP51 user for: ${email}`);
    const gp51User = await createGP51User(adminToken, { ...body, name }, user_type);
    const gp51_username = gp51User.username || email;

    // Create user in Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
                package_id,
                user_type,
            }
        }
    });
    if (authError) throw authError;
    if (!user) throw new Error("Supabase auth user creation failed.");

    // Create corresponding record in public.envio_users
    const { error: envioUserError } = await supabase
        .from('envio_users')
        .insert({
            id: user.id,
            email: user.email,
            name: sanitizeInput(name),
            phone_number: sanitizeInput(phone_number || ''),
            gp51_username,
            user_type,
            package_id,
            registration_status: 'completed',
        });
    if (envioUserError) throw envioUserError;

    // Store GP51 user mapping
    const { error: mappingError } = await supabase
        .from('gp51_user_mappings')
        .insert({
            envio_user_id: user.id,
            gp51_username,
            gp51_user_type: user_type === 'end_user' ? 3 : 1,
            sync_status: 'completed',
            created_at: new Date().toISOString()
        });
    
    if (mappingError) {
        console.warn(`[user-registration-service] Failed to store GP51 mapping:`, mappingError);
        // Don't fail the entire registration for mapping errors
    }

    console.log(`[user-registration-service] Successfully registered user ${email} with GP51 integration`);
    return new Response(JSON.stringify({ 
      success: true, 
      user,
      gp51_username,
      message: 'User registered successfully with GP51 integration'
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`[user-registration-service] Registration error: ${error.message}`);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      details: 'User registration failed during GP51 integration'
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
