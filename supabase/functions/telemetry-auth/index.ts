
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/dotenv@v3.2.2/load.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Import bcrypt for secure password hashing
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// Input validation schema
const AuthRequestSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(6).max(128),
  testConnection: z.boolean().optional()
});

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 10;

function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientIP);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return false;
  }
  
  entry.count++;
  return true;
}

async function secureHashPassword(password: string): Promise<string> {
  console.log('Securely hashing password for telemetry auth...');
  return await bcrypt.hash(password, 12);
}

async function testGP51Connection(apiUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Testing GP51 connection to: ${apiUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FleetIQ-Secure/1.0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('GP51 connection test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Connection test failed' 
    };
  }
}

async function authenticateWithGP51(username: string, password: string, apiUrl: string) {
  try {
    console.log(`Secure authentication attempt for user: ${username}`);
    
    // Use secure bcrypt hashing instead of MD5
    const hashedPassword = await secureHashPassword(password);
    console.log('Password securely hashed for telemetry auth.');
    
    // Try authentication methods with timeout protection
    const authMethods = [
      {
        name: 'POST_JSON_SECURE',
        url: apiUrl,
        options: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'FleetIQ-Secure/1.0',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({
            action: 'login',
            username: username,
            password: hashedPassword,
            timestamp: Date.now()
          })
        }
      },
      {
        name: 'POST_FORM_SECURE',
        url: apiUrl,
        options: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'FleetIQ-Secure/1.0'
          },
          body: new URLSearchParams({
            action: 'login',
            username: username,
            password: hashedPassword
          }).toString()
        }
      }
    ];

    for (const method of authMethods) {
      try {
        console.log(`Trying secure authentication method: ${method.name}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(method.url, {
          ...method.options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.log(`Method ${method.name} failed with status: ${response.status}`);
          continue;
        }
        
        const result = await response.json();
        console.log(`Method ${method.name} response received`);
        
        if (result.status === 0 && result.token) {
          console.log(`Secure authentication successful with method: ${method.name}`);
          return {
            success: true,
            token: result.token,
            sessionId: result.token,
            method: method.name,
            vehicles: result.devices || [],
            timestamp: Date.now()
          };
        }
      } catch (error) {
        console.error(`Method ${method.name} error:`, error);
        if (error.name === 'AbortError') {
          console.error('Request timed out');
        }
        continue;
      }
    }
    
    throw new Error('All secure authentication methods failed');
    
  } catch (error) {
    console.error('Secure GP51 authentication failed:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  try {
    // Rate limiting check
    if (!checkRateLimit(clientIP)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: RATE_LIMIT_WINDOW / 1000
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Method not allowed' 
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON payload'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate input using Zod schema
    const validation = AuthRequestSchema.safeParse(requestBody);
    if (!validation.success) {
      console.warn('Input validation failed:', validation.error.issues);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid input parameters',
        details: validation.error.issues.map(issue => issue.message)
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { username, password, testConnection } = validation.data;
    
    // Get GP51 API URL with fallback
    const apiUrl = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com/webapi';
    console.log(`Using GP51 API URL: ${apiUrl}`);

    // Handle connection test requests
    if (testConnection) {
      const connectionTest = await testGP51Connection(apiUrl);
      return new Response(JSON.stringify({
        success: connectionTest.success,
        apiUrl: apiUrl,
        error: connectionTest.error,
        timestamp: new Date().toISOString()
      }), {
        status: connectionTest.success ? 200 : 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Test connection before attempting authentication
    const connectionTest = await testGP51Connection(apiUrl);
    if (!connectionTest.success) {
      return new Response(JSON.stringify({
        success: false,
        error: `GP51 service unavailable: ${connectionTest.error}`,
        details: {
          apiUrl: apiUrl,
          connectionError: connectionTest.error,
          suggestion: 'Please check GP51 service status or contact support'
        }
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Attempt secure authentication
    const authResult = await authenticateWithGP51(username, password, apiUrl);
    
    return new Response(JSON.stringify(authResult), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Secure telemetry auth error:', error);
    
    const errorResponse = {
      success: false,
      error: 'Authentication failed',
      timestamp: new Date().toISOString(),
      details: {
        suggestion: 'Please verify your credentials and try again. If the problem persists, contact support.'
      }
    };

    // Don't expose internal error details in production
    const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';
    if (isDevelopment && error instanceof Error) {
      errorResponse.error = error.message;
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
