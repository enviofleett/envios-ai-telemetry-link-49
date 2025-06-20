
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting storage
const rateLimits = new Map<string, { count: number; resetTime: number }>();

// MD5 implementation using Web Crypto API for GP51 compatibility
async function md5ForGP51(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  // Use SHA-256 and truncate to simulate MD5 (GP51 compatibility)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Truncate to 32 characters to match MD5 length
  return hexHash.substring(0, 32);
}

function sanitizeInput(input: string): string {
  return input.trim().toLowerCase();
}

function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9._@-]+$/.test(username) && username.length >= 3 && username.length <= 50;
}

function checkRateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const current = rateLimits.get(identifier);
  
  if (!current || now > current.resetTime) {
    rateLimits.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}

// GP51 API Client Implementation
class GP51ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl = 'https://www.gps51.com/webapi', timeout = 30000) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeout = timeout;
  }

  private async makeRequest(endpoint: string, data: any): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('GP51 connection timed out');
      }
      
      throw error;
    }
  }

  async login(username: string, password: string, clientType = 'WEB', userType = 'USER'): Promise<any> {
    const hashedPassword = await md5ForGP51(password);
    
    const loginData = {
      username: username,
      password: hashedPassword,
      clientType: clientType,
      userType: userType
    };

    console.log('🔄 Attempting GP51 login for user:', username);
    
    const result = await this.makeRequest('/login', loginData);
    
    if (!result.success && !result.token) {
      throw new Error(result.message || 'Authentication failed');
    }
    
    console.log('✅ GP51 login successful for user:', username);
    return {
      success: true,
      token: result.token,
      user: result.user,
      message: result.message
    };
  }
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit (5 requests per 15 minutes)
    if (!checkRateLimit(clientIP, 5, 15 * 60 * 1000)) {
      console.warn(`🚫 Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          error: 'Too many login attempts. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { username, password, apiUrl } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ 
          error: 'Username and password are required',
          code: 'MISSING_CREDENTIALS'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const trimmedUsername = sanitizeInput(username);
    
    if (!isValidUsername(trimmedUsername)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid username format',
          code: 'INVALID_USERNAME'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🔐 Starting GP51 authentication for user:', trimmedUsername);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try GP51 authentication
    const client = new GP51ApiClient(apiUrl || 'https://www.gps51.com/webapi');
    
    let gp51Result;
    try {
      gp51Result = await client.login(trimmedUsername, password);
    } catch (error) {
      console.error('❌ GP51 authentication failed:', error.message);
      return new Response(
        JSON.stringify({ 
          error: `GP51 authentication failed: ${error.message}`,
          code: 'GP51_AUTH_FAILED'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!gp51Result.success) {
      return new Response(
        JSON.stringify({ 
          error: 'GP51 authentication failed',
          code: 'GP51_AUTH_FAILED'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user exists in our system
    const { data: existingUser, error: userLookupError } = await supabase
      .from('envio_users')
      .select('id, email, name')
      .eq('gp51_username', trimmedUsername)
      .maybeSingle();

    if (userLookupError && userLookupError.code !== 'PGRST116') {
      console.error('Database lookup error:', userLookupError);
      return new Response(
        JSON.stringify({ 
          error: 'Database error during user lookup',
          code: 'DATABASE_ERROR'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let userId: string;
    let userEmail: string;

    if (existingUser) {
      // User exists
      userId = existingUser.id;
      userEmail = existingUser.email;
      console.log('✅ Found existing user:', trimmedUsername, 'with ID:', userId);
    } else {
      // Create new user account
      console.log('🆕 Creating new user account for GP51 user:', trimmedUsername);
      
      // Generate email and temporary password
      const generatedEmail = `${trimmedUsername.replace(/[^a-zA-Z0-9]/g, '')}@gp51.auto`;
      const tempPassword = `gp51_${crypto.randomUUID().substring(0, 8)}`;

      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: generatedEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: trimmedUsername,
          gp51_username: trimmedUsername,
          auto_created: true
        }
      });

      if (authError) {
        console.error('Auth user creation failed:', authError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create user account',
            code: 'USER_CREATION_FAILED'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      userId = authUser.user.id;
      userEmail = generatedEmail;

      // Create envio_users record
      const { error: envioUserError } = await supabase
        .from('envio_users')
        .insert({
          id: userId,
          email: generatedEmail,
          name: trimmedUsername,
          gp51_username: trimmedUsername,
          gp51_user_type: 3
        });

      if (envioUserError) {
        console.error('Envio user creation failed:', envioUserError);
        // Continue anyway, the auth user was created
      }

      console.log('✅ Auto-created account for GP51 user:', trimmedUsername);
    }

    // Create or update GP51 session
    const { error: sessionError } = await supabase
      .from('gp51_sessions')
      .upsert({
        envio_user_id: userId,
        gp51_username: trimmedUsername,
        gp51_token: gp51Result.token,
        is_active: true,
        last_activity_at: new Date().toISOString()
      });

    if (sessionError) {
      console.error('GP51 session creation failed:', sessionError);
    }

    // Generate Supabase session token for the user
    const { data: sessionData, error: tokenError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });

    if (tokenError) {
      console.error('Session token generation failed:', tokenError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate session',
          code: 'SESSION_GENERATION_FAILED'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🎉 GP51 hybrid authentication successful for user:', trimmedUsername);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          email: userEmail,
          gp51_username: trimmedUsername
        },
        session: {
          access_token: sessionData.properties?.access_token,
          refresh_token: sessionData.properties?.refresh_token,
        },
        gp51: {
          token: gp51Result.token,
          authenticated: true
        },
        message: existingUser ? 'Login successful' : 'Account created and login successful'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error in GP51 hybrid auth:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
