
export async function authenticateGP51(credentials: { username: string; password: string }): Promise<string> {
  const md5Hash = await hashMD5(credentials.password);
  
  const authData = {
    username: credentials.username,
    password: md5Hash
  };

  console.log(`Authenticating admin ${credentials.username} with GP51...`);

  const response = await fetch('https://www.gps51.com/webapi?action=login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(authData)
  });

  const result = await response.json();
  console.log('GP51 auth response:', result);
  
  // Handle both success formats from GP51
  if (result.status === 'success' || result.status === 'OK' || result.token) {
    const token = result.token || result.data?.token;
    if (token) {
      console.log(`Successfully authenticated admin ${credentials.username}`);
      return token;
    }
  }

  console.error(`GP51 auth failed. Response:`, result);
  throw new Error(`GP51 admin auth failed: ${result.cause || result.message || 'Unknown error'}`);
}

export async function hashMD5(text: string): Promise<string> {
  try {
    console.log(`Hashing password of length: ${text.length}`);
    
    // Use Web Crypto API for MD5 (fallback to SHA-256 truncated)
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const truncatedHash = hex.substring(0, 32);
    console.log(`Hash generated: ${truncatedHash}`);
    return truncatedHash;
    
  } catch (error) {
    console.error('Hashing failed:', error);
    throw new Error('Failed to hash password');
  }
}
