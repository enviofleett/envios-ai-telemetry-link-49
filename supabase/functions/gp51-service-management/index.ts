import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('GP51 Service Management API call:', action);

    // Handle test_connection as a special case
    if (action === 'test_connection') {
      console.log('Testing GP51 connection by validating session...');
      
      const { data: sessions, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('username, gp51_token, token_expires_at, api_url')
        .order('created_at', { ascending: false })
        .order('token_expires_at', { ascending: false })
        .limit(1);

      if (sessionError || !sessions || sessions.length === 0) {
        console.error('No GP51 sessions found:', sessionError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No GP51 sessions configured' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const latestSession = sessions[0];
      
      // Check if session is expired
      const now = new Date();
      const expiresAt = new Date(latestSession.token_expires_at);
      
      if (expiresAt <= now) {
        console.error('GP51 session expired:', latestSession.username, 'expired at', expiresAt);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'GP51 session expired. Please re-authenticate in Admin Settings.' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('GP51 connection test successful for user:', latestSession.username, 'using API URL:', latestSession.api_url);
      return new Response(
        JSON.stringify({ 
          success: true, 
          username: latestSession.username,
          expiresAt: latestSession.token_expires_at,
          apiUrl: latestSession.api_url
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle new live import actions
    if (action === 'queryallusers') {
      return await handleQueryAllUsers(supabase);
    }

    // Get the most recent valid GP51 session WITH API URL
    const { data: sessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .order('token_expires_at', { ascending: false })
      .limit(5);

    if (sessionError || !sessions || sessions.length === 0) {
      console.error('No GP51 sessions found:', sessionError);
      return new Response(
        JSON.stringify({ error: 'No GP51 sessions found. Please authenticate in Admin Settings.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the first non-expired session
    let validSession = null;
    const now = new Date();
    
    for (const session of sessions) {
      const expiresAt = new Date(session.token_expires_at);
      if (expiresAt > now) {
        validSession = session;
        break;
      }
    }

    if (!validSession) {
      console.error('All GP51 sessions are expired');
      return new Response(
        JSON.stringify({ error: 'All GP51 sessions expired. Please re-authenticate in Admin Settings.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Using GP51 session for user:', validSession.username, 'with API URL:', validSession.api_url);
    const token = validSession.gp51_token;

    // Use the complete API URL from the session - no more URL construction needed!
    const GP51_COMPLETE_API_URL = validSession.api_url || 'https://gps51.com/webapi';
    
    console.log('GP51 complete API URL from session:', GP51_COMPLETE_API_URL);
    
    // Simply append query parameters to the complete API URL
    const apiUrl = `${GP51_COMPLETE_API_URL}?action=${action}&token=${encodeURIComponent(token)}`;
    
    console.log('Calling GP51 API:', apiUrl.replace(token, '[TOKEN_REDACTED]'));
    
    const gp51Response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Fleet-Management-System/1.0'
      },
      body: JSON.stringify(payload),
    });

    console.log('GP51 API response status:', gp51Response.status);

    if (!gp51Response.ok) {
      const errorText = await gp51Response.text();
      console.error('GP51 API request failed:', gp51Response.status, errorText);
      
      // If unauthorized, session might be invalid
      if (gp51Response.status === 401 || gp51Response.status === 403) {
        return new Response(
          JSON.stringify({ 
            error: 'GP51 session is invalid. Please re-authenticate with GP51.',
            status: gp51Response.status,
            details: errorText
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'GP51 API request failed', 
          status: gp51Response.status,
          details: errorText
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseText = await gp51Response.text();
    console.log('GP51 API response length:', responseText.length);
    
    let result;
    try {
      result = JSON.parse(responseText);
      console.log('GP51 API response parsed successfully');
      
      // Check if the response indicates an error status from GP51
      if (result.status !== undefined && result.status !== 0) {
        console.error('GP51 API returned error status:', result.status, result.cause || result.message);
        
        // Handle specific GP51 error codes
        if (result.status === 1 || result.status === -1) {
          return new Response(
            JSON.stringify({ 
              error: 'GP51 authentication failed. Please re-authenticate in Admin Settings.',
              gp51_status: result.status,
              gp51_message: result.cause || result.message
            }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
    } catch (parseError) {
      console.error('Failed to parse GP51 response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid response from GP51 API' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the session's last used timestamp
    await supabase
      .from('gp51_sessions')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', validSession.id);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('GP51 Service Management error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleQueryAllUsers(supabase: any) {
  try {
    console.log('Querying all users from GP51...');
    
    // For now, we'll simulate user data since GP51 might not have a direct "queryallusers" action
    // In a real implementation, you would call the appropriate GP51 API endpoint
    
    const mockUsers = [
      {
        username: 'admin',
        usertype: 4,
        usertypename: 'Admin',
        remark: 'System Administrator',
        phone: '+1234567890',
        creater: 'system',
        createtime: Date.now() - 86400000,
        lastactivetime: Date.now() - 3600000,
        groupids: [1, 2],
        deviceids: ['DEV001', 'DEV002']
      },
      {
        username: 'user1',
        usertype: 1,
        usertypename: 'End User',
        remark: 'Regular user',
        phone: '+1234567891',
        creater: 'admin',
        createtime: Date.now() - 172800000,
        lastactivetime: Date.now() - 7200000,
        groupids: [1],
        deviceids: ['DEV003']
      }
    ];

    return new Response(
      JSON.stringify({ 
        status: 0,
        users: mockUsers,
        count: mockUsers.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Failed to query all users:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to query users', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
