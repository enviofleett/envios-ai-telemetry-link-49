
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getSupabaseClient } from '../_shared/supabase_client.ts'
import { secureHash, verifySecureHash, checkRateLimit } from '../_shared/crypto_utils.ts'
import { validateRequest, workshopLoginSchema } from '../_shared/validation_schemas.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  // Rate limiting
  if (!checkRateLimit(clientIP, 5, 15 * 60 * 1000)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseClient = getSupabaseClient()

    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const validation = validateRequest(workshopLoginSchema, body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, email, password, workshop_id } = validation.data;

    if (action === 'login') {
      // Find workshop user
      const { data: user, error: userError } = await supabaseClient
        .from('workshop_users')
        .select('*')
        .eq('email', email)
        .eq('workshop_id', workshop_id)
        .eq('is_active', true)
        .single()

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Verify password using secure hash (assuming user.password_hash exists)
      if (user.password_hash) {
        const isValidPassword = await verifySecureHash(password, user.password_hash);
        if (!isValidPassword) {
          return new Response(
            JSON.stringify({ error: 'Invalid credentials' }),
            { 
              status: 401, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
      }

      // Create session
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 8) // 8 hour session

      const { data: session, error: sessionError } = await supabaseClient
        .from('workshop_sessions')
        .insert({
          workshop_user_id: user.id,
          workshop_id: user.workshop_id,
          expires_at: expiresAt.toISOString(),
          is_active: true
        })
        .select()
        .single()

      if (sessionError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create session' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ user, session }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Workshop auth error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
