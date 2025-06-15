
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase_client.ts';
import { CORS_HEADERS } from '../_shared/cors.ts';
import { md5_sync } from '../_shared/crypto_utils.ts';
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const GP51_API_URL = 'https://www.gps51.com/webapi';

// Simplified function to log in as GP51 admin and get a token
async function getGP51AdminToken(supabase: SupabaseClient): Promise<string> {
    const username = Deno.env.get('GP51_ADMIN_USERNAME');
    const password = Deno.env.get('GP51_ADMIN_PASSWORD');
    if (!username || !password) throw new Error("GP51 admin credentials not configured.");
    
    const hashedPassword = md5_sync(password);
    const getUrl = `${GP51_API_URL}?action=login&username=${encodeURIComponent(username)}&password=${hashedPassword}`;
    
    const response = await fetch(getUrl);
    if (!response.ok) throw new Error('Failed to authenticate GP51 admin user.');

    const result = await response.json();
    if (result.status !== 0 || !result.token) {
        throw new Error(result.cause || 'GP51 admin authentication failed.');
    }
    
    // NOTE: In a production scenario, you would cache this token in the 'gp51_admin_sessions' table.
    // This simplified version fetches it every time for reliability.
    return result.token;
}

// Hypothetical function to create a user in GP51
async function createGP51User(adminToken: string, userDetails: any, userType: string) {
    const gp51UserTypeMap = { 'end_user': 0, 'sub_admin': 1 };
    const gp51UserType = gp51UserTypeMap[userType] ?? 0;

    const body = {
        action: 'create_user', // This is a hypothetical action based on our plan
        token: adminToken,
        username: userDetails.email, // Using email as username
        password: md5_sync(userDetails.password),
        email: userDetails.email,
        phone: userDetails.phone_number,
        usertype: gp51UserType,
    };
    
    console.log('[user-registration-service] Creating GP51 user with payload:', { ...body, password: '***', token: '***' });
    const response = await fetch(GP51_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error(`GP51 API error: ${response.statusText}`);
    const result = await response.json();

    if (result.status !== 0) {
        throw new Error(`Failed to create GP51 user: ${result.cause || result.message}`);
    }
    
    console.log('[user-registration-service] GP51 user created successfully.');
    return result; // Assuming GP51 returns some user data
}


serve(async (req) => {
  console.log(`[user-registration-service] Received request: ${req.method} ${req.url}`);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const supabase = getSupabaseClient();
    const body = await req.json();
    const { email, password, name, phone_number, package_id } = body;

    // 1. Input validation
    if (!email || !password || !name || !package_id) {
        throw new Error("Email, password, name, and package_id are required.");
    }

    // 2. Fetch package and determine user_type
    const { data: pkg, error: pkgError } = await supabase
        .from('packages')
        .select('associated_user_type')
        .eq('id', package_id)
        .single();
    if (pkgError || !pkg) throw new Error("Invalid package selected.");
    const user_type = pkg.associated_user_type;

    // 3. Get GP51 Admin Token
    const adminToken = await getGP51AdminToken(supabase);

    // 4. Create user in GP51
    // In a real implementation, you would add rollback logic here.
    // If step 5 or 6 fails, you would call a hypothetical 'delete_user' on GP51.
    const gp51User = await createGP51User(adminToken, body, user_type);
    const gp51_username = gp51User.username || email; // Use returned username or default to email

    // 5. Create user in Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
                package_id,
                user_type,
            }
        }
    });
    if (authError) throw authError;
    if (!user) throw new Error("Supabase auth user creation failed.");

    // 6. Create corresponding record in public.envio_users
    const { error: envioUserError } = await supabase
        .from('envio_users')
        .insert({
            // NOTE: This assumes `envio_users.id` is NOT a foreign key to `auth.users.id`.
            // A future migration should link them using a `user_id` column.
            id: user.id, // Using the auth user ID for our public user table
            email: user.email,
            name,
            phone_number,
            gp51_username,
            user_type,
            package_id,
            registration_status: 'completed',
        });
    if (envioUserError) throw envioUserError;

    console.log(`[user-registration-service] Successfully registered user ${email}`);
    return new Response(JSON.stringify({ success: true, user }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`[user-registration-service] Top-level error: ${error.message}`);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
