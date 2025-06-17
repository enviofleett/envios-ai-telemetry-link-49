
import { gp51ApiClient } from '../_shared/gp51_api_client_unified.ts';

export async function authenticateWithGP51({ 
  username, 
  password, 
  apiUrl 
}: { 
  username: string; 
  password: string; 
  apiUrl?: string;
}) {
  const trimmedUsername = username.trim();
  console.log('🔐 Starting GP51 credential validation using unified client for user:', trimmedUsername);
  
  try {
    // Create client instance with custom API URL if provided
    const client = apiUrl ? 
      new (await import('../_shared/gp51_api_client_unified.ts')).UnifiedGP51ApiClient(apiUrl) : 
      gp51ApiClient;
    
    console.log('🌐 Using GP51 API URL:', apiUrl || 'default');
    console.log('🔄 Attempting login with unified client...');
    
    const loginResult = await client.login(
      trimmedUsername,
      password, // Pass plain password, client will hash it
      'WEB',
      'USER'
    );

    console.log(`✅ Unified client authentication successful for ${trimmedUsername}`);
    
    return {
      success: true,
      token: loginResult.token!,
      username: trimmedUsername,
      password: password,
      hashedPassword: (await import('../_shared/crypto_utils.ts')).md5_sync(password),
      apiUrl: apiUrl || (await import('../_shared/constants.ts')).GP51_API_URL,
      method: 'UNIFIED_CLIENT'
    };

  } catch (error) {
    console.error('❌ GP51 authentication failed with unified client:', error);
    
    // Return structured error response
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'GP51 connection timed out. Please try again.',
        username: trimmedUsername
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
      username: trimmedUsername
    };
  }
}
