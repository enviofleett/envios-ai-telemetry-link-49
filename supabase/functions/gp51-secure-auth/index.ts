
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHash } from 'https://deno.land/std@0.177.0/node/crypto.ts'

// Configuration constants
const GP51_BASE_URL = 'https://gps51.com/webapi';
const TOKEN_EXPIRY_HOURS = 23; // GP51 tokens typically last 24 hours

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Types
interface GP51AuthRequest {
  username: string;
  password: string;
}

interface GP51AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  username?: string;
  apiUrl?: string;
  expiresAt?: string;
  error?: string;
  debug?: string;
  gp51_status?: number;
}

interface UserSession {
  user_id: string;
  gp51_token?: string;
  gp51_username?: string;
  gp51_token_expires?: string;
}

// Authentication service class
class GP51AuthService {
  private supabase: any;

  constructor(supabaseUrl: string, supabaseKey: string, authHeader: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });
  }

  async authenticateUser(): Promise<{ user: any; error?: string }> {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    
    if (error || !user) {
      return { user: null, error: 'User not authenticated' };
    }

    return { user, error: undefined };
  }

  async checkExistingToken(user: any): Promise<string | null> {
    const existingToken = user.user_metadata?.gp51_token;
    const tokenExpires = user.user_metadata?.gp51_token_expires;
    
    if (existingToken && tokenExpires) {
      const expiryDate = new Date(tokenExpires);
      if (expiryDate > new Date()) {
        console.log("✅ Using existing valid GP51 token");
        return existingToken;
      }
    }
    
    return null;
  }

  async updateUserToken(token: string, username: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

    await this.supabase.auth.updateUser({
      data: { 
        gp51_token: token,
        gp51_username: username,
        gp51_token_expires: expiresAt.toISOString(),
        gp51_login_time: new Date().toISOString()
      }
    });
  }
}

// GP51 API service class
class GP51ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = GP51_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  createMD5Hash(password: string): string {
    try {
      const hash = createHash('md5');
      hash.update(password, 'utf8');
      const result = hash.digest('hex').toLowerCase();
      console.log(`🔐 MD5 hash generated: length=${result.length}`);
      
      if (result.length !== 32) {
        throw new Error(`Invalid hash length: ${result.length}`);
      }
      
      return result;
    } catch (error) {
      console.error("❌ MD5 generation failed:", error);
      throw new Error('MD5 hash generation failed');
    }
  }

  async authenticate(username: string, password: string): Promise<any> {
    const passwordHash = this.createMD5Hash(password);
    const url = `${this.baseUrl}?action=login`;

    console.log(`🌐 Calling GP51 API: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Envios-Fleet/1.0',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username,
        password: passwordHash,
        from: 'WEB',
        type: 'USER'
      })
    });

    console.log(`📡 GP51 response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`GP51 API error: ${response.status}`);
    }

    const responseText = await response.text();
    console.log(`📄 GP51 response: ${responseText.substring(0, 200)}...`);

    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ JSON parse failed:", parseError);
      throw new Error('Invalid response from GP51');
    }
  }
}

// Response helper
class ResponseHelper {
  static success(data: Partial<GP51AuthResponse>): Response {
    return new Response(
      JSON.stringify({ success: true, ...data }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  static error(message: string, status: number = 500, extra?: any): Response {
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        ...extra
      }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  static cors(): Response {
    return new Response('ok', { headers: corsHeaders });
  }
}

// Main handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return ResponseHelper.cors();
  }

  console.log("🚀 GP51 Secure Auth - Refactored Implementation");

  try {
    // Validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return ResponseHelper.error('Authorization required', 401);
    }

    // Initialize services
    const authService = new GP51AuthService(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      authHeader
    );

    const gp51Service = new GP51ApiService();

    // Authenticate user
    const { user, error: authError } = await authService.authenticateUser();
    if (authError || !user) {
      return ResponseHelper.error(authError || 'User not authenticated', 401);
    }

    console.log("✅ User authenticated");

    // Parse and validate request
    const requestBody = await req.json() as GP51AuthRequest;
    const { username, password } = requestBody;

    if (!username || !password) {
      return ResponseHelper.error('Username and password required', 400);
    }

    console.log(`🔐 Processing GP51 authentication for user: ${username}`);

    // Check for existing valid session
    const existingToken = await authService.checkExistingToken(user);
    if (existingToken) {
      return ResponseHelper.success({
        message: 'Using existing GP51 session',
        token: existingToken,
        username: user.user_metadata?.gp51_username || username,
        apiUrl: GP51_BASE_URL,
        expiresAt: user.user_metadata?.gp51_token_expires
      });
    }

    // Authenticate with GP51
    const gp51Result = await gp51Service.authenticate(username, password);
    console.log(`📊 GP51 result status: ${gp51Result.status}`);

    if (gp51Result.status === 0 && gp51Result.token) {
      console.log("🎉 GP51 authentication successful!");
      
      // Store token in user metadata
      await authService.updateUserToken(gp51Result.token, username);

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

      return ResponseHelper.success({
        message: 'GP51 authentication successful',
        token: gp51Result.token,
        username: gp51Result.username || username,
        apiUrl: GP51_BASE_URL,
        expiresAt: expiresAt.toISOString()
      });
    } else {
      console.error(`❌ GP51 authentication failed: status=${gp51Result.status}, cause=${gp51Result.cause}`);
      
      let errorMessage = gp51Result.cause || 'GP51 authentication failed';
      if (gp51Result.status === 1 && !gp51Result.cause) {
        errorMessage = 'Invalid username or password';
      }
      
      return ResponseHelper.error(errorMessage, 401, {
        gp51_status: gp51Result.status,
        debug: `GP51 returned: ${JSON.stringify(gp51Result)}`
      });
    }

  } catch (error) {
    console.error("💥 GP51 Auth Error:", error);
    return ResponseHelper.error(
      'Internal server error',
      500,
      { debug: error.message }
    );
  }
});
