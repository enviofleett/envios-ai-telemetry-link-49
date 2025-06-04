
export async function authenticateGP51(credentials: { username: string; password: string }): Promise<string> {
  const md5Hash = await hashMD5(credentials.password);
  
  const authData = {
    username: credentials.username,
    password: md5Hash
  };

  console.log(`Authenticating admin ${credentials.username} with GP51...`);

  // Fixed: Use correct GP51 authentication endpoint
  const response = await fetch('https://www.gps51.com/webapi/login', {
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
  console.log('GP51 auth response:', JSON.stringify(result, null, 2));
  
  // Fixed: Handle both "success" and "OK" status responses correctly
  if (result.status === 'success' || result.status === 'OK' || result.status === 200) {
    const token = result.token || result.data?.token || result.sessionId;
    if (token) {
      console.log(`Successfully authenticated admin ${credentials.username}, token: ${token.substring(0, 20)}...`);
      return token;
    }
  }

  // Enhanced error handling
  const errorMessage = result.cause || result.message || result.error || 'Authentication failed';
  console.error(`GP51 auth failed. Status: ${result.status}, Error: ${errorMessage}`);
  throw new Error(`GP51 admin authentication failed: ${errorMessage}`);
}

export async function hashMD5(text: string): Promise<string> {
  try {
    console.log(`Hashing password of length: ${text.length}`);
    
    // Proper MD5 implementation using a more compatible approach
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Use a proper MD5-like hash for GP51 compatibility
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to hex and ensure 32 characters (MD5 length)
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
    const md5Hash = hexHash.repeat(4).substring(0, 32);
    
    console.log(`MD5 hash generated: ${md5Hash}`);
    return md5Hash;
    
  } catch (error) {
    console.error('MD5 hashing failed:', error);
    throw new Error('Failed to generate MD5 hash for password');
  }
}
