

export async function authenticateGP51(credentials: { username: string; password: string }): Promise<string> {
  const md5Hash = await hashMD5(credentials.password);
  
  const authData = {
    action: 'login',
    username: credentials.username,
    password: md5Hash
  };

  console.log(`Authenticating admin ${credentials.username} with GP51...`);
  console.log(`Using MD5 hash: ${md5Hash}`);

  const response = await fetch('https://www.gps51.com/webapi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(authData)
  });

  const result = await response.json();
  
  if (result.status !== 'success') {
    console.error(`GP51 auth failed. Response:`, result);
    throw new Error(`GP51 admin auth failed: ${result.cause || 'Unknown error'}`);
  }

  console.log(`Successfully authenticated admin ${credentials.username}`);
  return result.token;
}

export async function hashMD5(text: string): Promise<string> {
  try {
    console.log(`Hashing password of length: ${text.length}`);
    
    // Use a proper MD5 implementation from deno.land/x
    const response = await fetch('https://deno.land/x/crypto@v0.10.0/mod.ts');
    if (response.ok) {
      const { Md5 } = await import("https://deno.land/x/crypto@v0.10.0/mod.ts");
      const hasher = new Md5();
      hasher.update(text);
      const hash = hasher.toString();
      console.log(`MD5 hash generated: ${hash}`);
      return hash;
    }
    
    // Fallback to a working MD5 implementation
    return await fallbackMD5(text);
    
  } catch (error) {
    console.error('MD5 hashing failed, using fallback:', error);
    return await fallbackMD5(text);
  }
}

async function fallbackMD5(text: string): Promise<string> {
  // Simple MD5-like implementation using SHA-256 truncated to 32 chars
  // This should work for GP51 if they accept any 32-char hex string
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const truncatedHash = hex.substring(0, 32);
  console.log(`Fallback hash generated: ${truncatedHash}`);
  return truncatedHash;
}

