
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts"
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

    const response = await fetch('https://www.gps51.com/webapi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authData)
    });

    const result = await response.json();
    
    if (result.status === 'success' && result.token) {
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
