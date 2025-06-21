
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthRequest {
  action: string;
  username: string;
  password: string;
  apiUrl?: string;
}

// Inline MD5 implementation for GP51 compatibility
async function createMD5Hash(input: string): Promise<string> {
  console.log(`🔐 Creating MD5 hash for input of length: ${input.length}`);
  
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    
    // Initialize MD5 constants
    const h = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476];
    
    // Pre-processing: adding padding bits
    const msgLength = data.length;
    const paddedLength = Math.ceil((msgLength + 9) / 64) * 64;
    const padded = new Uint8Array(paddedLength);
    padded.set(data);
    padded[msgLength] = 0x80;
    
    // Append original length in bits as 64-bit little-endian
    const lengthInBits = msgLength * 8;
    const view = new DataView(padded.buffer);
    view.setUint32(paddedLength - 8, lengthInBits, true);
    view.setUint32(paddedLength - 4, Math.floor(lengthInBits / 0x100000000), true);
    
    // Process the message in 512-bit chunks
    for (let offset = 0; offset < paddedLength; offset += 64) {
      const chunk = new Uint32Array(padded.buffer, offset, 16);
      
      // Convert to little-endian
      for (let i = 0; i < 16; i++) {
        chunk[i] = ((chunk[i] & 0xFF) << 24) | 
                   (((chunk[i] >>> 8) & 0xFF) << 16) | 
                   (((chunk[i] >>> 16) & 0xFF) << 8) | 
                   ((chunk[i] >>> 24) & 0xFF);
      }
      
      // Initialize hash value for this chunk
      let [a, b, c, d] = h;
      
      // Main loop
      for (let i = 0; i < 64; i++) {
        let f, g;
        
        if (i < 16) {
          f = (b & c) | (~b & d);
          g = i;
        } else if (i < 32) {
          f = (d & b) | (~d & c);
          g = (5 * i + 1) % 16;
        } else if (i < 48) {
          f = b ^ c ^ d;
          g = (3 * i + 5) % 16;
        } else {
          f = c ^ (b | ~d);
          g = (7 * i) % 16;
        }
        
        const temp = d;
        d = c;
        c = b;
        
        const s = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][Math.floor(i / 4) % 16];
        const k = [
          0xD76AA478, 0xE8C7B756, 0x242070DB, 0xC1BDCEEE, 0xF57C0FAF, 0x4787C62A, 0xA8304613, 0xFD469501,
          0x698098D8, 0x8B44F7AF, 0xFFFF5BB1, 0x895CD7BE, 0x6B901122, 0xFD987193, 0xA679438E, 0x49B40821,
          0xF61E2562, 0xC040B340, 0x265E5A51, 0xE9B6C7AA, 0xD62F105D, 0x02441453, 0xD8A1E681, 0xE7D3FBC8,
          0x21E1CDE6, 0xC33707D6, 0xF4D50D87, 0x455A14ED, 0xA9E3E905, 0xFCEFA3F8, 0x676F02D9, 0x8D2A4C8A,
          0xFFFA3942, 0x8771F681, 0x6D9D6122, 0xFDE5380C, 0xA4BEEA44, 0x4BDECFA9, 0xF6BB4B60, 0xBEBFBC70,
          0x289B7EC6, 0xEAA127FA, 0xD4EF3085, 0x04881D05, 0xD9D4D039, 0xE6DB99E5, 0x1FA27CF8, 0xC4AC5665,
          0xF4292244, 0x432AFF97, 0xAB9423A7, 0xFC93A039, 0x655B59C3, 0x8F0CCC92, 0xFFEFF47D, 0x85845DD1,
          0x6FA87E4F, 0xFE2CE6E0, 0xA3014314, 0x4E0811A1, 0xF7537E82, 0xBD3AF235, 0x2AD7D2BB, 0xEB86D391
        ][i];
        
        a = (a + f + k + chunk[g]) >>> 0;
        a = ((a << s) | (a >>> (32 - s))) >>> 0;
        a = (a + b) >>> 0;
        
        [a, b, c, d] = [temp, a, b, c];
      }
      
      // Add this chunk's hash to result so far
      h[0] = (h[0] + a) >>> 0;
      h[1] = (h[1] + b) >>> 0;
      h[2] = (h[2] + c) >>> 0;
      h[3] = (h[3] + d) >>> 0;
    }
    
    // Convert hash to hex string (little-endian)
    const result = h.map(n => {
      return [
        (n & 0xFF).toString(16).padStart(2, '0'),
        ((n >>> 8) & 0xFF).toString(16).padStart(2, '0'),
        ((n >>> 16) & 0xFF).toString(16).padStart(2, '0'),
        ((n >>> 24) & 0xFF).toString(16).padStart(2, '0')
      ].join('');
    }).join('');
    
    console.log(`✅ MD5 hash generated successfully: ${result.substring(0, 8)}...`);
    return result;
    
  } catch (error) {
    console.error('❌ MD5 hashing failed:', error);
    throw new Error('MD5 hash generation failed');
  }
}

// Inline GP51 authentication function
async function authenticateWithGP51(credentials: { username: string; password: string; apiUrl?: string }) {
  console.log('🔐 [GP51-AUTH] Starting authentication process');
  
  const { username, password, apiUrl = 'https://www.gps51.com/webapi' } = credentials;
  const globalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
  
  if (!globalToken) {
    console.error('❌ [GP51-AUTH] GP51_GLOBAL_API_TOKEN not configured');
    return {
      success: false,
      error: 'GP51 Global API Token not configured'
    };
  }

  console.log('🔄 [GP51-AUTH] Step 1: Environment validation complete');
  console.log('🔑 [GP51-AUTH] Global API token found (length:', globalToken.length, ')');
  console.log('🌐 [GP51-AUTH] Using API URL:', apiUrl);

  try {
    // Step 1: Generate MD5 hash
    console.log('🔄 [GP51-AUTH] Step 2: Generating MD5 hash');
    const hashedPassword = await createMD5Hash(password);
    console.log('✅ [GP51-AUTH] MD5 hash generated successfully');

    // Step 2: Prepare login request
    console.log('🔄 [GP51-AUTH] Step 3: Preparing login request');
    
    const loginUrl = `${apiUrl}?action=login`;
    const loginPayload = {
      username: username.trim(),
      password: hashedPassword,
      from: 'WEB',
      type: 'USER',
      token: globalToken
    };

    console.log('📊 [GP51-AUTH] Login request details:');
    console.log('  - URL:', loginUrl);
    console.log('  - Username:', username.trim());
    console.log('  - Password hash:', hashedPassword.substring(0, 8) + '...');
    console.log('  - From: WEB');
    console.log('  - Type: USER');
    console.log('  - Token (first 10 chars):', globalToken.substring(0, 10) + '...');

    // Step 3: Make login request
    console.log('🔄 [GP51-AUTH] Step 4: Making login request to GP51');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet-Hybrid-Auth/1.0'
      },
      body: JSON.stringify(loginPayload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('📈 [GP51-AUTH] GP51 API Response Status:', response.status);
    console.log('📈 [GP51-AUTH] Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('❌ [GP51-AUTH] HTTP Error:', response.status, response.statusText);
      return {
        success: false,
        error: `GP51 API returned ${response.status}: ${response.statusText}`
      };
    }

    // Step 4: Parse response
    const responseText = await response.text();
    console.log('📄 [GP51-AUTH] Raw response length:', responseText.length);
    console.log('📄 [GP51-AUTH] Raw response preview:', responseText.substring(0, 200));

    if (!responseText || responseText.trim() === '') {
      console.error('❌ [GP51-AUTH] Empty response from GP51 API');
      
      // Generate curl command for manual testing
      const curlCommand = `curl -X POST "${loginUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -H "User-Agent: EnvioFleet-Hybrid-Auth/1.0" \\
  -d '${JSON.stringify(loginPayload, null, 2)}'`;
      
      console.log('🔧 [GP51-AUTH] Test this manually with curl:');
      console.log(curlCommand);
      
      return {
        success: false,
        error: 'Empty response from GP51 API. Check credentials and API endpoint.',
        debug: {
          url: loginUrl,
          payload: loginPayload,
          curlCommand
        }
      };
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('📊 [GP51-AUTH] Parsed response data:', responseData);
    } catch (parseError) {
      console.error('❌ [GP51-AUTH] JSON parsing failed:', parseError);
      console.log('📄 [GP51-AUTH] Response was not valid JSON:', responseText);
      return {
        success: false,
        error: 'Invalid JSON response from GP51 API',
        debug: { responseText }
      };
    }

    // Step 5: Validate response
    if (responseData.status !== 0) {
      const errorMsg = responseData.cause || responseData.message || 'Authentication failed';
      console.error('❌ [GP51-AUTH] GP51 authentication failed:', errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    }

    if (!responseData.token) {
      console.error('❌ [GP51-AUTH] No token in successful response');
      return {
        success: false,
        error: 'No authentication token received from GP51'
      };
    }

    console.log('✅ [GP51-AUTH] Authentication successful');
    console.log('🎟️ [GP51-AUTH] Token received (first 10 chars):', responseData.token.substring(0, 10) + '...');

    return {
      success: true,
      token: responseData.token,
      username: username.trim(),
      apiUrl,
      method: 'hybrid-auth'
    };

  } catch (error) {
    console.error('❌ [GP51-AUTH] Exception during authentication:', error);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'GP51 authentication request timed out'
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown authentication error'
    };
  }
}

serve(async (req) => {
  console.log('📥 [REQUEST]', req.method, req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Enhanced environment variable validation
    console.log('🔍 [ENV DEBUG] Environment variables check:');
    const gp51ApiBaseUrl = Deno.env.get('GP51_API_BASE_URL');
    const gp51BaseUrl = Deno.env.get('GP51_BASE_URL');
    const gp51GlobalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('  - GP51_API_BASE_URL:', gp51ApiBaseUrl ? 'SET' : 'NOT SET');
    console.log('  - GP51_BASE_URL:', gp51BaseUrl ? 'SET' : 'NOT SET');
    console.log('  - GP51_GLOBAL_API_TOKEN:', gp51GlobalToken ? 'SET' : 'NOT SET');
    console.log('  - SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET');

    const body: AuthRequest = await req.json();
    const { action, username, password, apiUrl } = body;

    // Enhanced client IP logging
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    req.headers.get('cf-connecting-ip') || 
                    'unknown';
    console.log('🌍 [CLIENT] IP:', clientIP);
    
    // Sanitize username for logging (show first 3 chars + ***)
    const sanitizedUsername = username ? username.substring(0, 3) + '***' : 'undefined';
    console.log('📋 [REQUEST] Action:', action, ', Username:', sanitizedUsername);

    if (action === 'authenticate') {
      console.log('🔐 [AUTH] Starting GP51 authentication for user:', sanitizedUsername);
      
      // Environment validation
      console.log('🔄 [AUTH] Step 1: Validating environment variables');
      if (!gp51GlobalToken) {
        console.error('❌ [AUTH] GP51_GLOBAL_API_TOKEN not configured');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'GP51 Global API Token not configured',
            code: 'MISSING_API_TOKEN'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Determine base URL with fallback logic
      const baseUrl = apiUrl || gp51ApiBaseUrl || 'https://www.gps51.com/webapi';
      console.log('🌐 [GP51] Using base URL:', baseUrl);
      console.log('🔑 [GP51] Global API token found (length:', gp51GlobalToken.length, ')');

      // Step 2: Call inline authentication function
      console.log('🔄 [AUTH] Step 2: Calling GP51 authentication');
      const authResult = await authenticateWithGP51({ 
        username: username.trim(),
        password,
        apiUrl: baseUrl
      });

      if (authResult.success) {
        console.log('✅ [AUTH] GP51 authentication successful for user:', sanitizedUsername);
        return new Response(
          JSON.stringify(authResult),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else {
        console.error('❌ [AUTH] GP51 authentication failed for user:', sanitizedUsername, 'Error:', authResult.error);
        return new Response(
          JSON.stringify(authResult),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ [ERROR] GP51 Hybrid Auth error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
