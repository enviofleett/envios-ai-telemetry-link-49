
// Trigger re-deploy - 2025-06-15
import { GP51ValidationResult } from './types.ts';
import { md5_sync } from '../_shared/crypto_utils.ts'; // Corrected path

export async function validatePasswordWithGP51(username: string, password: string): Promise<GP51ValidationResult> {
  try {
    const hashedPassword = md5_sync(password);
    
    const authData = {
      action: 'login', // Standard action
      username: username.trim(), // Trim username
      password: hashedPassword,
    };

    console.log(`Validating password for ${username} with GP51...`);

    const GP51_API_URL = Deno.env.get("GP51_API_URL") || "https://www.gps51.com/webapi";

    const response = await fetch(GP51_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0/PasswordValidator'
      },
      body: new URLSearchParams(authData).toString()
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`GP51 API request failed during validation for ${username}: ${response.status} ${response.statusText}`, errorText.substring(0,100));
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
        console.error(`GP51 validation for ${username} returned invalid JSON:`, responseText.substring(0,200));
        return {
            success: false,
            error: `Received an invalid response from GP51. Please try again later.`
        };
    }
    
    if (result.status === 0 && result.token) {
        console.log(`GP51 validation success for ${username}.`);
        return { success: true, token: result.token };
    }

    const errorMessage = (result.cause || result.message || 'Unknown GP51 error').toLowerCase();
    console.warn(`GP51 validation failed for ${username}: ${errorMessage}`);

    if (errorMessage.includes('user not exist') || errorMessage.includes('user does not exist')) {
        return { success: false, error: 'User does not exist in GP51.' };
    }

    if (errorMessage.includes('password error') || errorMessage.includes('password is error')) {
        return { success: false, error: 'The password you entered does not match your GP51 account. Please try again.' };
    }
    
    return { success: false, error: `Could not verify with GP51 at this time. Please try again later.` };

  } catch (error) {
    console.error('Critical GP51 validation error:', error);
    return {
        success: false,
        error: 'An internal error occurred during GP51 validation.'
    };
  }
}
