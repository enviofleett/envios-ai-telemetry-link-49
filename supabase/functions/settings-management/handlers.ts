
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
    
    if (errorMessage.includes('GP51 API error') || errorMessage.includes('authentication failed')) {
      return createResponse({
        error: errorMessage,
        details: 'Please verify your GP51 username and password are correct'
      }, 401);
    } else if (errorMessage.includes('Invalid response format')) {
      return createResponse({
        error: errorMessage,
        details: 'The GP51 API returned a malformed response'
      }, 500);
    } else if (errorMessage.includes('Failed to save')) {
      return createResponse({
        error: errorMessage,
        details: 'Database error while saving credentials'
      }, 500);
    } else if (errorMessage.includes('Failed to hash password')) {
      return createResponse({
        error: 'Password processing failed',
        details: 'There was an error processing your password'
      }, 500);
    }

    return createResponse({
      error: 'Failed to connect to GP51 API',
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
