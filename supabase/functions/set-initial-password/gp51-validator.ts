
import { GP51ValidationResult } from './types.ts';
import { md5_for_gp51_only, sanitizeInput, isValidUsername } from '../_shared/crypto_utils.ts';

export async function validatePasswordWithGP51(username: string, password: string): Promise<GP51ValidationResult> {
  const trimmedUsername = sanitizeInput(username);
  
  if (!isValidUsername(trimmedUsername)) {
    return {
      success: false,
      error: 'Invalid username format'
    };
  }

  try {
    // Use MD5 only for GP51 API compatibility
    const hashedPassword = await md5_for_gp51_only(password);
    
    const authData = {
      action: 'login',
      username: trimmedUsername,
      password: hashedPassword,
    };

    console.log(`Validating password for ${trimmedUsername} with GP51...`);

    const GP51_API_URL = Deno.env.get("GP51_API_URL") || "https://www.gps51.com/webapi";

    const response = await fetch(GP51_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0/PasswordValidator'
      },
      body: new URLSearchParams(authData).toString(),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`GP51 API request failed during validation for ${trimmedUsername}: ${response.status} ${response.statusText}`, errorText.substring(0,100));
        return {
            success: false,
            error: `GP51 API connection failed. Please try again later.`
        };
    }
    
    const responseText = await response.text();
    let result;
    try {
        result = JSON.parse(responseText);
    } catch (e) {
        console.error(`GP51 validation for ${trimmedUsername} returned invalid JSON:`, responseText.substring(0,200));
        return {
            success: false,
            error: `Received an invalid response from GP51. Please try again later.`
        };
    }
    
    if (result.status === 0 && result.token) {
        console.log(`GP51 validation success for ${trimmedUsername}.`);
        return { success: true, token: result.token };
    }

    const errorMessage = (result.cause || result.message || 'Unknown GP51 error').toLowerCase();
    console.warn(`GP51 validation failed for ${trimmedUsername}: ${errorMessage}`);

    if (errorMessage.includes('user not exist') || errorMessage.includes('user does not exist')) {
        return { success: false, error: 'User does not exist in GP51.' };
    }

    if (errorMessage.includes('password error') || errorMessage.includes('password is error')) {
        return { success: false, error: 'The password you entered does not match your GP51 account. Please try again.' };
    }
    
    return { success: false, error: `Could not verify with GP51 at this time. Please try again later.` };

  } catch (error) {
    console.error('Critical GP51 validation error:', error);
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'GP51 connection timed out. Please try again.'
      };
    }
    return {
        success: false,
        error: 'An internal error occurred during GP51 validation.'
    };
  }
}
