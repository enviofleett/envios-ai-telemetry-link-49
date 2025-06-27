
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("🧪 GP51 Debug function started");
    
    const { username, password } = await req.json();
    
    // Simple hash
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      hash = ((hash << 5) - hash) + password.charCodeAt(i);
      hash = hash & hash;
    }
    const hashedPassword = Math.abs(hash).toString(16).padStart(32, '0');

    console.log("🧪 Testing GP51 endpoints...");

    const endpoints = [
      'https://www.gps51.com/webapi?action=login',
      'https://api.gps51.com/webapi?action=login',
      'https://gps51.com/webapi?action=login'
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Testing: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Debug/1.0',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            username,
            password: hashedPassword,
            from: 'WEB',
            type: 'USER'
          }),
          signal: AbortSignal.timeout(10000)
        });

        const responseText = await response.text();
        
        results.push({
          endpoint,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          responseLength: responseText.length,
          responsePreview: responseText.substring(0, 500),
          fullResponse: responseText.length < 1000 ? responseText : responseText.substring(0, 1000) + '...',
          isJSON: responseText.trim().startsWith('{') || responseText.trim().startsWith('['),
          contentType: response.headers.get('content-type'),
          isEmpty: !responseText.trim(),
          startsWithHtml: responseText.trim().toLowerCase().startsWith('<!doctype') || responseText.trim().toLowerCase().startsWith('<html')
        });

        console.log(`✅ ${endpoint}: ${response.status} - ${responseText.length} chars`);

      } catch (error) {
        console.error(`❌ ${endpoint}: ${error.message}`);
        results.push({
          endpoint,
          error: error.message,
          errorType: error.name
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        username: username,
        hashedPassword: hashedPassword.substring(0, 8) + '...',
        results,
        summary: {
          totalEndpoints: endpoints.length,
          successfulRequests: results.filter(r => !r.error).length,
          jsonResponses: results.filter(r => r.isJSON).length,
          htmlResponses: results.filter(r => r.startsWithHtml).length,
          emptyResponses: results.filter(r => r.isEmpty).length
        },
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("💥 Debug function error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
