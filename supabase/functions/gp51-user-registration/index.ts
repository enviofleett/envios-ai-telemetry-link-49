
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleCorsOptionsRequest, corsHeaders } from "../_shared/cors.ts";
import { md5_for_gp51_only, checkRateLimit, sanitizeInput, isValidEmail } from '../_shared/crypto_utils.ts';

const GP51_API_URL = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com/webapi';

serve(async (req) => {
  const corsResponse = handleCorsOptionsRequest(req);
  if (corsResponse) {
    return corsResponse;
  }

  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  // Rate limiting: 10 requests per 15 minutes per IP
  if (!checkRateLimit(clientIP, 10, 15 * 60 * 1000)) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Too many user registration attempts. Please try again later.',
        errorCode: 'RATE_LIMIT_EXCEEDED'
      }),
      { 
        status: 429, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body',
          errorCode: 'INVALID_REQUEST'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { action } = body;
    console.log(`🔄 [gp51-user-registration] Processing action: ${action}`);

    switch (action) {
      case 'create_user':
        return await handleCreateUser(body, supabase);
      
      case 'check_username':
        return await handleCheckUsername(body, supabase);
      
      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Unknown action: ${action}`,
            errorCode: 'UNKNOWN_ACTION'
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error) {
    console.error("❌ [gp51-user-registration] Critical error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorCode: 'INTERNAL_ERROR'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleCreateUser(body: any, supabase: any) {
  const { username, password, usertype = 3, showname, email, multilogin = 0, groupid } = body;

  console.log(`👤 [gp51-user-registration] Creating user: ${username}, type: ${usertype}`);

  // Validate required fields
  if (!username || !password) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Username and password are required',
        errorCode: 'MISSING_REQUIRED_FIELDS'
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Validate input data
  const sanitizedUsername = sanitizeInput(username);
  if (sanitizedUsername !== username) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Username contains invalid characters',
        errorCode: 'INVALID_USERNAME'
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  if (email && !isValidEmail(email)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid email format',
        errorCode: 'INVALID_EMAIL'
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Get admin credentials for GP51 API
    const adminUsername = Deno.env.get('GP51_ADMIN_USERNAME');
    const adminPassword = Deno.env.get('GP51_ADMIN_PASSWORD');
    
    if (!adminUsername || !adminPassword) {
      throw new Error('GP51 admin credentials not configured');
    }

    // First, authenticate as admin to get token
    const adminAuthResult = await authenticateAdmin(adminUsername, adminPassword);
    if (!adminAuthResult.success) {
      throw new Error(`Admin authentication failed: ${adminAuthResult.error}`);
    }

    // Hash password for GP51 API
    const hashedPassword = md5_for_gp51_only(password);

    // Prepare user creation parameters
    const userCreationParams = {
      action: 'createuser',
      token: adminAuthResult.token,
      username: sanitizedUsername,
      password: hashedPassword,
      usertype: usertype,
      showname: showname || sanitizedUsername,
      email: email || '',
      multilogin: multilogin
    };

    // Add groupid if provided
    if (groupid) {
      userCreationParams.groupid = groupid;
    }

    console.log(`📤 [gp51-user-registration] Creating user with GP51 API...`);

    // Make the user creation request to GP51
    const createUserResponse = await fetch(`${GP51_API_URL}?action=createuser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(userCreationParams),
      signal: AbortSignal.timeout(15000)
    });

    if (!createUserResponse.ok) {
      throw new Error(`GP51 API error: ${createUserResponse.status} ${createUserResponse.statusText}`);
    }

    const createUserResult = await createUserResponse.json();
    console.log(`📊 [gp51-user-registration] GP51 create user response:`, createUserResult);

    // Check if user creation was successful
    if (createUserResult.status !== 0) {
      const errorMessage = createUserResult.cause || createUserResult.message || 'Unknown GP51 error';
      console.error(`❌ [gp51-user-registration] GP51 user creation failed:`, errorMessage);
      
      // Map common GP51 error codes
      let errorCode = 'GP51_API_ERROR';
      if (errorMessage.toLowerCase().includes('duplicate') || errorMessage.toLowerCase().includes('exists')) {
        errorCode = 'USERNAME_EXISTS';
      } else if (errorMessage.toLowerCase().includes('invalid')) {
        errorCode = 'INVALID_PARAMETERS';
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          errorCode: errorCode
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Store the GP51 user mapping
    const { error: dbError } = await supabase
      .from('gp51_user_mappings')
      .insert({
        envio_user_id: null, // Will be linked later during full registration
        gp51_username: sanitizedUsername,
        gp51_user_type: usertype,
        created_at: new Date().toISOString(),
        sync_status: 'completed'
      });

    if (dbError) {
      console.warn(`⚠️ [gp51-user-registration] Failed to store user mapping:`, dbError);
      // Don't fail the request if mapping storage fails
    }

    console.log(`✅ [gp51-user-registration] User created successfully: ${sanitizedUsername}`);

    return new Response(
      JSON.stringify({
        success: true,
        gp51UserId: createUserResult.userid || sanitizedUsername,
        username: sanitizedUsername,
        message: 'GP51 user created successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error(`❌ [gp51-user-registration] User creation error:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create GP51 user',
        errorCode: 'USER_CREATION_FAILED'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function handleCheckUsername(body: any, supabase: any) {
  const { username } = body;

  if (!username) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Username is required',
        errorCode: 'MISSING_USERNAME'
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Check if username exists in our database first
    const { data: existingMapping } = await supabase
      .from('gp51_user_mappings')
      .select('gp51_username')
      .eq('gp51_username', username.trim())
      .single();

    if (existingMapping) {
      return new Response(
        JSON.stringify({
          success: true,
          available: false,
          reason: 'Username already exists in system'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // If not in our database, assume available for now
    // In a full implementation, you might want to check GP51 directly
    return new Response(
      JSON.stringify({
        success: true,
        available: true
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error(`❌ [gp51-user-registration] Username check error:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to check username availability',
        errorCode: 'USERNAME_CHECK_FAILED'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function authenticateAdmin(username: string, password: string) {
  try {
    const hashedPassword = md5_for_gp51_only(password);
    
    const authResponse = await fetch(`${GP51_API_URL}?action=login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password: hashedPassword
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!authResponse.ok) {
      throw new Error(`Authentication failed: ${authResponse.status}`);
    }

    const authResult = await authResponse.json();
    
    if (authResult.status !== 0 || !authResult.token) {
      throw new Error(authResult.cause || 'Authentication failed');
    }

    return {
      success: true,
      token: authResult.token
    };

  } catch (error) {
    console.error(`❌ [gp51-user-registration] Admin authentication error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
}
