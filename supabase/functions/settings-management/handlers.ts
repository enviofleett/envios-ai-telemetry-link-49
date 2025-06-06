
import { authenticateWithGP51 } from './gp51-auth.ts';
import { saveGP51Session, getGP51Status } from './database.ts';
import { createResponse } from './cors.ts';
import type { GP51Credentials } from './types.ts';

export async function handleSaveCredentials(credentials: GP51Credentials) {
  console.log('Processing GP51 credentials save request for user:', credentials.username);
  
  if (!credentials.username || !credentials.password) {
    console.error('Missing credentials: username or password not provided');
    return createResponse(
      { error: 'Username and password are required' },
      400
    );
  }

  try {
    console.log('Authenticating with GP51...');
    const token = await authenticateWithGP51(credentials);
    
    console.log('Saving GP51 session to database...');
    await saveGP51Session(credentials.username, token);

    console.log('GP51 credentials successfully validated and saved');
    return createResponse({
      success: true,
      message: 'GP51 credentials validated and saved successfully!',
      tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('GP51 credential validation failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (errorMessage.includes('GP51_API_BASE_URL is incorrectly configured') || errorMessage.includes('GP51 API configuration error')) {
      return createResponse({
        error: 'GP51 API Configuration Error',
        details: 'The GP51_API_BASE_URL is not properly configured. Please contact your administrator to set the correct GP51 API URL in Supabase secrets.'
      }, 500);
    } else if (errorMessage.includes('Network error')) {
      return createResponse({
        error: 'Network Connection Error',
        details: 'Unable to connect to GP51 API. Please check your internet connection and try again.'
      }, 503);
    } else if (errorMessage.includes('GP51 authentication failed')) {
      return createResponse({
        error: 'Authentication Failed',
        details: 'Invalid GP51 username or password. Please verify your credentials and try again.'
      }, 401);
    } else if (errorMessage.includes('Invalid response format')) {
      return createResponse({
        error: 'GP51 API Error',
        details: 'The GP51 API returned an unexpected response format. Please contact support.'
      }, 502);
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
      details: errorMessage
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
