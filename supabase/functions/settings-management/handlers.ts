
import { authenticateWithGP51 } from './gp51-auth.ts';
import { saveGP51Session, getGP51Status } from './database.ts';
import { createResponse } from './cors.ts';
import type { GP51Credentials } from './types.ts';

export async function handleSaveCredentials(credentials: GP51Credentials) {
  if (!credentials.username || !credentials.password) {
    console.error('Missing credentials: username or password not provided');
    return createResponse(
      { error: 'Username and password are required' },
      400
    );
  }

  try {
    const token = await authenticateWithGP51(credentials);
    await saveGP51Session(credentials.username, token);

    return createResponse({
      success: true,
      message: 'GP51 credentials validated and saved successfully!',
      tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('GP51 credential validation failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('GP51 API error') || error.message.includes('authentication failed')) {
        return createResponse({
          error: error.message,
          details: 'Please verify your GP51 username and password are correct'
        }, 401);
      } else if (error.message.includes('Invalid response format')) {
        return createResponse({
          error: error.message,
          details: 'The GP51 API returned a malformed response'
        }, 500);
      } else if (error.message.includes('Failed to save')) {
        return createResponse({
          error: error.message,
          details: 'Database error while saving credentials'
        }, 500);
      }
    }

    return createResponse({
      error: 'Failed to connect to GP51 API',
      details: error instanceof Error ? error.message : 'Network error'
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
