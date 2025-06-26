
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { handleImprovedGP51Authentication } from './improved-gp51-operations.ts'
import { handleEnhancedGetGP51Status, handleSmartGP51SessionRefresh, handleGP51HealthCheck } from './enhanced-session-management.ts'
import { handleGetGP51Status, handleClearGP51Sessions, handleSessionHealthCheck } from './session-management.ts'
import { createErrorResponse } from './response-utils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify(createErrorResponse('Authorization required', 'Missing auth header', 401)), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await adminSupabase.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(JSON.stringify(createErrorResponse('Authentication failed', 'Invalid token', 401)), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get envio user ID
    const { data: envioUser, error: envioUserError } = await adminSupabase
      .from('envio_users')
      .select('id')
      .eq('email', user.email)
      .single()

    if (envioUserError || !envioUser) {
      return new Response(JSON.stringify(createErrorResponse('User profile not found', 'Please contact support', 404)), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = envioUser.id
    const body = await req.json()
    const { action } = body

    let response

    switch (action) {
      case 'authenticate-gp51':
        response = await handleImprovedGP51Authentication(
          adminSupabase,
          userId,
          body.username,
          body.password,
          body.apiUrl
        )
        break

      case 'enhanced-gp51-status':
        response = await handleEnhancedGetGP51Status(adminSupabase, userId)
        break

      case 'get-gp51-status':
        response = await handleGetGP51Status(adminSupabase, userId)
        break

      case 'smart-session-refresh':
        response = await handleSmartGP51SessionRefresh(adminSupabase, userId)
        break

      case 'clear-gp51-sessions':
        response = await handleClearGP51Sessions(adminSupabase, userId)
        break

      case 'session-health-check':
        response = await handleSessionHealthCheck(adminSupabase, userId)
        break

      case 'comprehensive-health-check':
        response = await handleGP51HealthCheck(adminSupabase, userId)
        break

      default:
        response = createErrorResponse('Invalid action', `Action '${action}' not supported`, 400)
        break
    }

    return new Response(JSON.stringify(response), {
      status: response.status || 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Settings management error:', error)
    const errorResponse = createErrorResponse(
      'Internal server error',
      error instanceof Error ? error.message : 'Unknown error',
      500
    )
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
