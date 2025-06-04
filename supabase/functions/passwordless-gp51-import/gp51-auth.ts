
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts"

export async function authenticateGP51(credentials: { username: string; password: string }): Promise<string> {
  const md5Hash = await hashMD5(credentials.password);
  
  const authData = {
    action: 'login',
    username: credentials.username,
    password: md5Hash
  };

  console.log(`Authenticating admin ${credentials.username} with GP51...`);

  const response = await fetch('https://www.gps51.com/webapi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(authData)
  });

  const result = await response.json();
  
  if (result.status !== 'success') {
    throw new Error(`GP51 admin auth failed: ${result.cause || 'Unknown error'}`);
  }

  console.log(`Successfully authenticated admin ${credentials.username}`);
  return result.token;
}

export async function hashMD5(text: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('MD5 hashing failed:', error);
    throw new Error('MD5 hashing not supported in this environment');
  }
}
