export async function authenticateGP51(credentials: { username: string; password: string }, apiUrl?: string): Promise<string> {
  const md5Hash = await hashMD5(credentials.password);
  
  const authData = {
    action: 'login',
    username: credentials.username,
    password: md5Hash
  };

  console.log(`Authenticating admin ${credentials.username} with GP51 using API URL: ${apiUrl}...`);

  // Use provided API URL or fallback to environment variable or default - ensure complete URL
  let GP51_COMPLETE_API_URL = apiUrl || Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com/webapi';
  
  // Ensure the URL includes /webapi
  if (!GP51_COMPLETE_API_URL.includes('/webapi')) {
    // Add protocol if missing
    if (!GP51_COMPLETE_API_URL.startsWith('http://') && !GP51_COMPLETE_API_URL.startsWith('https://')) {
      GP51_COMPLETE_API_URL = 'https://' + GP51_COMPLETE_API_URL;
    }
    GP51_COMPLETE_API_URL = `${GP51_COMPLETE_API_URL}/webapi`;
  }
    
  console.log(`Using GP51 complete API URL: ${GP51_COMPLETE_API_URL}`);

  // Simply append query parameters to the complete API URL
  const apiEndpoint = `${GP51_COMPLETE_API_URL}?action=login&token=`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(authData)
  });

  if (!response.ok) {
    console.error(`GP51 auth HTTP error: ${response.status} ${response.statusText}`);
    throw new Error(`GP51 authentication failed: HTTP ${response.status}`);
  }

  const result = await response.json();
  console.log('GP51 auth response received');
  
  // Standardized success check - GP51 uses status: 0 for success
  if (result.status === 0 && result.token) {
    console.log(`Successfully authenticated admin ${credentials.username} using API: ${GP51_COMPLETE_API_URL}`);
    return result.token;
  }

  // Enhanced error handling with standardized error extraction
  const errorMessage = result.cause || result.message || result.error || 'Authentication failed';
  console.error(`GP51 auth failed. Status: ${result.status}, Error: ${errorMessage}`);
  throw new Error(`GP51 admin authentication failed: ${errorMessage}`);
}

export async function hashMD5(text: string): Promise<string> {
  try {
    console.log(`Hashing password of length: ${text.length}`);
    
    // Proper MD5 implementation using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Use Web Crypto API for proper MD5 hashing
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const md5Hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('MD5 hash generated successfully');
    return md5Hash;
    
  } catch (error) {
    console.error('MD5 hashing failed:', error);
    
    // Fallback MD5 implementation for environments where Web Crypto MD5 isn't available
    return await fallbackMD5Hash(text);
  }
}

async function fallbackMD5Hash(text: string): Promise<string> {
  // Import MD5 from a reliable source for Deno environment
  const { createHash } = await import('https://deno.land/std@0.168.0/node/crypto.ts');
  const hash = createHash('md5');
  hash.update(text);
  const md5Hash = hash.digest('hex');
  
  console.log('Fallback MD5 hash generated successfully');
  return md5Hash;
}
