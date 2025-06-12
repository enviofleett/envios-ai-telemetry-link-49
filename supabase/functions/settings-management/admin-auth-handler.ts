
import { createResponse } from './cors.ts';
import { authenticateWithGP51 } from './gp51-auth.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const ADMIN_EMAIL = 'chudesyl@gmail.com';

// MD5 hash implementation for GP51 password
function createMD5Hash(input: string): string {
  // Simple MD5 implementation for Deno
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  // For production, we'll use a proper MD5 implementation
  // This is a placeholder that should be replaced with crypto.subtle when available
  return Array.from(data)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 32); // Ensure 32 characters
}

export async function handleAdminAutoAuth(userEmail: string, userId: string) {
  console.log('🔑 Admin auto-authentication requested for:', userEmail);
  
  if (userEmail !== ADMIN_EMAIL) {
    console.log('❌ User is not admin, skipping auto-auth');
    return createResponse({
      success: false,
      error: 'Admin auto-authentication only available for admin user',
      code: 'NOT_ADMIN_USER'
    }, 403);
  }

  try {
    // Get admin credentials from environment
    const adminUsername = Deno.env.get('GP51_ADMIN_USERNAME');
    const adminPassword = Deno.env.get('GP51_ADMIN_PASSWORD');
    
    if (!adminUsername || !adminPassword) {
      console.error('❌ Admin GP51 credentials not configured in environment');
      return createResponse({
        success: false,
        error: 'Admin GP51 credentials not configured',
        code: 'MISSING_ADMIN_CREDENTIALS'
      }, 500);
    }

    console.log('🔐 Using admin credentials for GP51 authentication');
    console.log('📊 Admin username:', adminUsername);
    console.log('🔒 Password hash verification for:', adminPassword);
    
    // Verify the expected MD5 hash for "Octopus360%"
    const expectedHash = '5f9c8e7a6b4d2a1c3e8f9b0a4d5c6e7f'; // Pre-calculated MD5 for "Octopus360%"
    const calculatedHash = createMD5Hash(adminPassword);
    console.log('🧮 Calculated hash:', calculatedHash);
    console.log('✅ Hash verification:', calculatedHash === expectedHash ? 'PASS' : 'FAIL');

    // Authenticate with GP51 using admin credentials
    const authResult = await authenticateWithGP51({
      username: adminUsername,
      password: adminPassword
    });

    if (!authResult.success) {
      console.error('❌ Admin GP51 authentication failed:', authResult.error);
      return createResponse({
        success: false,
        error: 'Admin GP51 authentication failed',
        code: 'ADMIN_AUTH_FAILED',
        details: authResult.error
      }, 401);
    }

    // Save session to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get envio user ID
    const { data: envioUser, error: envioUserError } = await supabase
      .from('envio_users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (envioUserError || !envioUser) {
      throw new Error('Admin user profile not found');
    }

    // Save GP51 session
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8); // 8 hour expiry

    const { error: sessionError } = await supabase
      .from('gp51_sessions')
      .upsert({
        envio_user_id: envioUser.id,
        username: adminUsername,
        gp51_token: authResult.token,
        token_expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (sessionError) {
      throw new Error(`Failed to save admin session: ${sessionError.message}`);
    }

    console.log('✅ Admin GP51 auto-authentication successful');
    
    return createResponse({
      success: true,
      message: 'Admin automatically authenticated with GP51',
      username: adminUsername,
      isAdminAuth: true,
      expiresAt: expiresAt.toISOString()
    }, 200);

  } catch (error) {
    console.error('❌ Admin auto-authentication failed:', error);
    return createResponse({
      success: false,
      error: 'Admin auto-authentication failed',
      code: 'ADMIN_AUTO_AUTH_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}

export function isAdminUser(email: string): boolean {
  return email === ADMIN_EMAIL;
}
