import { GP51ValidationResult } from './types.ts';
import { md5_sync } from '../_shared/crypto_utils.ts'; // Corrected path

export async function validatePasswordWithGP51(username: string, password: string): Promise<GP51ValidationResult> {
  try {
    const hashedPassword = md5_sync(password);
    
    const authData = {
      action: 'login', // Standard action
      username: username.trim(), // Trim username
      password: hashedPassword,
      // from: 'WEB', // Optional standard params
      // type: 'USER'  // Optional standard params
    };

    console.log(`Validating password for ${username} with GP51...`);

    // Standardized GP51 API endpoint
    const GP51_API_URL = Deno.env.get("GP51_API_URL") || "https://www.gps51.com/webapi";

    const response = await fetch(GP51_API_URL, {
      method: 'POST',
      // GP51 often expects 'application/x-www-form-urlencoded'
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0/PasswordValidator'
      },
      body: new URLSearchParams(authData).toString() // Send as form data
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`GP51 API request failed during validation for ${username}: ${response.status} ${response.statusText}`, errorText.substring(0,100));
        return {
            success: false,
            error: `GP51 API request failed (${response.status}): ${errorText.substring(0,100)}`
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
            error: `Invalid response from GP51 (not JSON). Preview: ${responseText.substring(0,100)}`
        };
    }
    
    // Standardized success check - GP51 uses status: 0 for success
    if (result.status === 0 && result.token) {
      console.log(`Password validation successful for ${username}`);
      return {
        success: true,
        token: result.token // Return the token if received
      };
    } else {
      const errorMessage = result.cause || result.message || 'GP51 authentication failed during validation.';
      console.log(`Password validation failed for ${username}: ${errorMessage} (GP51 Status: ${result.status})`);
      return {
        success: false,
        error: errorMessage,
        gp51_status: result.status // Include GP51 status for debugging
      };
    }

  } catch (error) {
    console.error(`GP51 validation error for ${username}:`, error.message, error.stack);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during GP51 validation.'
    };
  }
}

// Removed local hashMD5 and fallbackMD5 functions
