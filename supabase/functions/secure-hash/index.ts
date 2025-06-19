
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/dotenv@v3.2.2/load.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Import bcrypt for secure password hashing
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

interface HashRequest {
  action: 'hash' | 'verify';
  password: string;
  hash?: string;
}

const SALT_ROUNDS = 12; // Recommended for production

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, password, hash }: HashRequest = await req.json();

    // Input validation
    if (!action || !password) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return new Response(JSON.stringify({ 
        error: 'Password must be at least 8 characters long' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'hash') {
      console.log('Hashing password...');
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      
      return new Response(JSON.stringify({
        success: true,
        hash: hashedPassword
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'verify') {
      if (!hash) {
        return new Response(JSON.stringify({ 
          error: 'Hash is required for verification' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('Verifying password...');
      const isValid = await bcrypt.compare(password, hash);
      
      return new Response(JSON.stringify({
        success: true,
        valid: isValid
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Invalid action' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Secure hash error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
