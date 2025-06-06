
import { authenticateWithGP51 } from './gp51-auth.ts';
import { saveGP51Session, getGP51Status } from './database.ts';
import { createResponse } from './cors.ts';
import type { GP51Credentials } from './types.ts';

export async function handleSaveCredentials(credentials: GP51Credentials & { apiUrl?: string }) {
  // Trim whitespace from username
  const trimmedUsername = credentials.username?.trim();
  const trimmedPassword = credentials.password?.trim();
  const trimmedApiUrl = credentials.apiUrl?.trim();
  
  console.log('Processing GP51 credentials save request for user:', trimmedUsername);
  
  if (!trimmedUsername || !trimmedPassword) {
    console.error('Missing credentials: username or password not provided');
    return createResponse(
      { error: 'Username and password are required' },
      400
    );
  }

  try {
    console.log('Authenticating with GP51...');
    const authResult = await authenticateWithGP51({ 
      username: trimmedUsername, 
      password: trimmedPassword,
      apiUrl: trimmedApiUrl
    });
    
    console.log('Saving GP51 session to database...');
    await saveGP51Session(authResult.username, authResult.token, authResult.apiUrl);

    console.log('GP51 credentials successfully validated and saved');
    return createResponse({
      success: true,
      message: 'GP51 credentials validated and saved successfully!',
      username: authResult.username,
      apiUrl: authResult.apiUrl,
      tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('GP51 credential validation failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (errorMessage.includes('Network error connecting to GP51 API') || 
        errorMessage.includes('error sending request')) {
      return createResponse({
        error: 'GP51 Connection Failed',
        details: 'Unable to connect to GP51 API. Please check if the GP51 API URL is correct and that the GP51 server is accessible.'
      }, 503);
    } else if (errorMessage.includes('GP51 API URL is not a valid URL format') || 
               errorMessage.includes('GP51 API URL is required')) {
      return createResponse({
        error: 'GP51 API Configuration Error',
        details: 'The GP51 API URL is not properly configured. Please provide a valid GP51 API URL (e.g., https://api.gps51.com).'
      }, 500);
    } else if (errorMessage.includes('GP51 API returned an empty response') || 
               errorMessage.includes('GP51 API returned invalid JSON response')) {
      return createResponse({
        error: 'GP51 API Response Error',
        details: 'The GP51 API returned an invalid or empty response. Please check the GP51 API URL configuration and try again.'
      }, 502);
    } else if (errorMessage.includes('GP51 authentication failed')) {
      return createResponse({
        error: 'Authentication Failed',
        details: `Invalid GP51 username or password for user "${trimmedUsername}". Please verify your credentials and try again.`
      }, 401);
    } else if (errorMessage.includes('Failed to save')) {
      return createResponse({
        error: 'Database Error',
        details: 'Failed to save GP51 session to database. Please try again.'
      }, 500);
    } else if (errorMessage.includes('Failed to hash password')) {
      return createResponse({
        error: 'Password Processing Error',
        details: 'There was an error processing your password. Please try again.'
      }, 500);
    }

    return createResponse({
      error: 'GP51 Connection Failed',
      details: errorMessage,
      username: trimmedUsername
    }, 500);
  }
}

export async function handleGetStatus() {
  console.log('Checking GP51 connection status');
  
  try {
    const status = await getGP51Status();
    return createResponse(status);
  } catch (error) {
    console.error('Error checking GP51 status:', error);
    return createResponse({
      connected: false, 
      error: 'Error checking GP51 status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}
