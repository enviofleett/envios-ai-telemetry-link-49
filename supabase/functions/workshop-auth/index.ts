
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getSupabaseClient } from '../_shared/supabase_client.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = getSupabaseClient()

    const { action, email, password, workshop_id } = await req.json()

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

      // For production, you would verify the password here using bcrypt
      // For now, we'll create a session directly

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
