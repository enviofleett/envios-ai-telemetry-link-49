
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Secure hash function to replace MD5
async function secureHash(input: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const encoder = new TextEncoder();
  const data = encoder.encode(input + saltHex);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

// Input validation function
function validateInput(input: any, type: string): { isValid: boolean; error?: string } {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: `${type} is required and must be a string` };
  }

  // SQL injection protection
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|\#|\/\*|\*\/)/,
    /(\bOR\b.*=.*\bOR\b)/i,
    /(\bAND\b.*=.*\bAND\b)/i,
    /(\'|\";?|(\b(UNION|JOIN)\b))/i
  ];

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(input)) {
      return { isValid: false, error: 'Invalid characters detected' };
    }
  }

  return { isValid: true };
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const existing = rateLimitMap.get(identifier);

  if (!existing) {
    rateLimitMap.set(identifier, { count: 1, firstAttempt: now });
    return true;
  }

  if (now - existing.firstAttempt > WINDOW_MS) {
    rateLimitMap.set(identifier, { count: 1, firstAttempt: now });
    return true;
  }

  if (existing.count >= MAX_ATTEMPTS) {
    return false;
  }

  existing.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { action, ...payload } = await req.json();
    
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('GP51 User Management API call:', action);

    // Input validation for critical parameters
    if ((action === 'adduser' || action === 'edituser') && payload.username) {
      const usernameValidation = validateInput(payload.username, 'username');
      if (!usernameValidation.isValid) {
        return new Response(
          JSON.stringify({ error: `Invalid username: ${usernameValidation.error}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get admin credentials for GP51 API calls with better error handling
    const { data: adminSession, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .eq('username', 'admin')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error('Session query error:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Database error occurred' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!adminSession) {
      return new Response(
        JSON.stringify({ error: 'Admin GP51 session not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if admin token is still valid
    if (new Date(adminSession.token_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Admin GP51 session expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = adminSession.gp51_token;
    let apiPayload = { ...payload };

    // Handle password encryption for user creation/editing with secure hashing
    if ((action === 'adduser' || action === 'edituser') && payload.password) {
      // Validate password strength
      if (payload.password.length < 8) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 8 characters long' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      apiPayload.password = await secureHash(payload.password);
    }

    console.log('Calling GP51 API with action:', action);

    // Enhanced CORS and security headers for GP51 API call
    const GP51_API_BASE = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
    const gp51Response = await fetch(`${GP51_API_BASE}/webapi?action=${encodeURIComponent(action)}&token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'SecureFleetManagement/1.0'
      },
      body: JSON.stringify(apiPayload),
    });

    if (!gp51Response.ok) {
      console.error('GP51 API request failed:', gp51Response.status);
      return new Response(
        JSON.stringify({ error: 'GP51 API request failed', status: gp51Response.status }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await gp51Response.json();
    console.log('GP51 API response status:', result.status);

    // Update session timestamp for active session tracking
    await supabase
      .from('gp51_sessions')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', adminSession.id);

    // Enhanced response with security headers
    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        } 
      }
    );

  } catch (error) {
    console.error('GP51 User Management error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
