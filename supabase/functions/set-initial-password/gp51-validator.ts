
import { GP51ValidationResult } from './types.ts';

export async function validatePasswordWithGP51(username: string, password: string): Promise<GP51ValidationResult> {
  try {
    const md5Hash = await hashMD5(password);
    
    const authData = {
      action: 'login',
      username: username,
      password: md5Hash
    };

    console.log(`Validating password for ${username} with GP51...`);

    // Standardized GP51 API endpoint
    const response = await fetch('https://www.gps51.com/webapi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authData)
    });

    const result = await response.json();
    
    // Standardized success check - GP51 uses status: 0 for success
    if (result.status === 0 && result.token) {
      console.log(`Password validation successful for ${username}`);
      return {
        success: true,
        token: result.token
      };
    } else {
      console.log(`Password validation failed for ${username}: ${result.cause || 'Unknown error'}`);
      return {
        success: false,
        error: result.cause || 'GP51 authentication failed'
      };
    }

  } catch (error) {
    console.error(`GP51 validation error for ${username}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function hashMD5(text: string): Promise<string> {
  try {
    console.log(`Hashing password of length: ${text.length}`);
    
    // Proper MD5 implementation using Web Crypto API
    const data = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    console.log('MD5 hash generated successfully');
    return hash;
    
  } catch (error) {
    console.error('MD5 hashing failed, using fallback:', error);
    return await fallbackMD5(text);
  }
}

async function fallbackMD5(text: string): Promise<string> {
  // Fallback MD5 implementation using Deno crypto
  const { createHash } = await import("https://deno.land/std@0.168.0/node/crypto.ts");
  const hash = createHash('md5');
  hash.update(text);
  const md5Hash = hash.digest('hex');
  console.log('Fallback MD5 hash generated successfully');
  return md5Hash;
}
