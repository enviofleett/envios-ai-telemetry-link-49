
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { authenticateWithGP51 } from '../settings-management/gp51-auth.ts'
import { corsHeaders } from '../settings-management/cors.ts'

const corsHeadersLocal = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeadersLocal })
  }

  try {
    console.log('🔐 GP51 Hybrid Auth: Processing request')
    
    const body = await req.json()
    const { username, password } = body

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        { status: 400, headers: { ...corsHeadersLocal, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client for user management
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const trimmedUsername = username.trim()
    console.log(`🔍 Processing GP51 login for username: ${trimmedUsername}`)

    // Step 1: Authenticate with GP51
    console.log('📡 Authenticating with GP51...')
    const gp51AuthResult = await authenticateWithGP51({
      username: trimmedUsername,
      password
    })

    if (!gp51AuthResult.success) {
      console.log('❌ GP51 authentication failed:', gp51AuthResult.error)
      return new Response(
        JSON.stringify({ 
          error: gp51AuthResult.error || 'GP51 authentication failed'
        }),
        { status: 401, headers: { ...corsHeadersLocal, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ GP51 authentication successful')

    // Step 2: Check for existing GP51 user mapping
    console.log('🔍 Checking for existing GP51 user mapping...')
    const { data: existingMapping } = await adminClient
      .from('gp51_user_mappings')
      .select(`
        *,
        envio_user:envio_users!inner(*)
      `)
      .eq('gp51_username', trimmedUsername)
      .eq('is_verified', true)
      .single()

    let envioUser;
    let isNewUser = false;

    if (existingMapping?.envio_user) {
      // User exists, get their info
      envioUser = existingMapping.envio_user
      console.log(`👤 Found existing Envio user: ${envioUser.email}`)
    } else {
      // Step 3: Create new Envio user with auto-generated email
      console.log('👤 Creating new Envio user for GP51 username...')
      
      const autoEmail = `${trimmedUsername.replace(/[^a-zA-Z0-9]/g, '_')}@gp51.local`
      const tempPassword = `gp51_${crypto.randomUUID()}`

      // Create auth user
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: autoEmail,
        password: tempPassword,
        email_confirm: true, // Auto-confirm since it's not a real email
        user_metadata: {
          gp51_username: trimmedUsername,
          created_via: 'gp51_direct_login'
        }
      })

      if (authError || !authData.user) {
        console.error('❌ Failed to create auth user:', authError)
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          { status: 500, headers: { ...corsHeadersLocal, 'Content-Type': 'application/json' } }
        )
      }

      // Create envio_users record
      const { data: envioUserData, error: envioError } = await adminClient
        .from('envio_users')
        .insert({
          id: authData.user.id,
          email: autoEmail,
          name: trimmedUsername,
          created_via: 'gp51_direct_login'
        })
        .select()
        .single()

      if (envioError || !envioUserData) {
        console.error('❌ Failed to create envio user:', envioError)
        // Clean up auth user if envio user creation fails
        await adminClient.auth.admin.deleteUser(authData.user.id)
        return new Response(
          JSON.stringify({ error: 'Failed to create user profile' }),
          { status: 500, headers: { ...corsHeadersLocal, 'Content-Type': 'application/json' } }
        )
      }

      envioUser = envioUserData
      isNewUser = true
      console.log(`✅ Created new Envio user: ${envioUser.email}`)

      // Step 4: Create GP51 user mapping
      console.log('🔗 Creating GP51 user mapping...')
      const { error: mappingError } = await adminClient
        .from('gp51_user_mappings')
        .insert({
          envio_user_id: envioUser.id,
          gp51_username: trimmedUsername,
          gp51_user_type: 3, // Default user type
          mapping_type: 'auto',
          is_verified: true
        })

      if (mappingError) {
        console.error('❌ Failed to create GP51 mapping:', mappingError)
        // Don't fail the login, but log the error
      } else {
        console.log('✅ GP51 user mapping created')
      }

      // Assign default user role
      const { error: roleError } = await adminClient
        .from('user_roles')
        .insert({
          user_id: envioUser.id,
          role: 'user'
        })

      if (roleError) {
        console.error('❌ Failed to assign user role:', roleError)
      }
    }

    // Step 5: Create session for the user
    console.log('🎫 Creating session for user...')
    const { data: sessionData, error: sessionError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: envioUser.email,
      options: {
        redirectTo: `${req.headers.get('origin') || 'http://localhost:3000'}/auth/callback`
      }
    })

    if (sessionError || !sessionData) {
      console.error('❌ Failed to create session:', sessionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeadersLocal, 'Content-Type': 'application/json' } }
      )
    }

    // Store GP51 credentials securely for this session
    console.log('💾 Storing GP51 session...')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    const { error: sessionStoreError } = await adminClient
      .from('gp51_sessions')
      .upsert({
        envio_user_id: envioUser.id,
        gp51_username: trimmedUsername,
        gp51_token: gp51AuthResult.token || 'validated',
        expires_at: expiresAt.toISOString(),
        is_active: true,
        created_via: 'hybrid_auth'
      })

    if (sessionStoreError) {
      console.error('❌ Failed to store GP51 session:', sessionStoreError)
    }

    console.log('✅ GP51 hybrid authentication completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        session: {
          access_token: sessionData.properties?.access_token,
          refresh_token: sessionData.properties?.refresh_token,
          user: envioUser
        },
        isNewUser,
        gp51Username: trimmedUsername,
        message: isNewUser 
          ? 'Welcome! Your GP51 account has been linked to a new FleetIQ account.'
          : 'Welcome back! Signed in with your linked GP51 account.'
      }),
      { 
        status: 200, 
        headers: { ...corsHeadersLocal, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ GP51 hybrid auth error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error during GP51 authentication' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeadersLocal, 'Content-Type': 'application/json' }
      }
    )
  }
})
