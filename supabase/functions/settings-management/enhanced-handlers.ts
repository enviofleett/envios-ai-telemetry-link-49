
import { authenticateWithGP51 } from './gp51-auth.ts';
import { saveGP51Session, getGP51Status } from './database.ts';
import { createResponse } from './cors.ts';
import type { GP51Credentials } from './types.ts';

export async function handleSaveCredentialsWithVehicleImport(credentials: GP51Credentials & { apiUrl?: string; testOnly?: boolean }) {
  const trimmedUsername = credentials.username?.trim();
  const trimmedPassword = credentials.password?.trim();
  const trimmedApiUrl = credentials.apiUrl?.trim();
  
  console.log(`Enhanced GP51 credentials save request for user: ${trimmedUsername}, testOnly: ${credentials.testOnly || false}`);
  
  if (!trimmedUsername || !trimmedPassword) {
    console.error('Missing credentials: username or password not provided');
    return createResponse(
      { 
        success: false,
        error: 'Username and password are required',
        details: 'Both username and password must be provided for GP51 authentication'
      },
      400
    );
  }

  try {
    console.log('Starting GP51 authentication process...');
    const authResult = await authenticateWithGP51({ 
      username: trimmedUsername, 
      password: trimmedPassword,
      apiUrl: trimmedApiUrl
    });
    
    console.log(`GP51 authentication successful for user: ${authResult.username}`);

    if (credentials.testOnly) {
      console.log('Test-only mode: skipping session save');
      return createResponse({
        success: true,
        message: 'GP51 connection test successful!',
        username: authResult.username,
        apiUrl: authResult.apiUrl,
        testMode: true
      });
    }

    console.log('Saving GP51 session to database...');
    const sessionData = await saveGP51Session(authResult.username, authResult.token, authResult.apiUrl);

    console.log('GP51 credentials successfully validated and saved');
    return createResponse({
      success: true,
      message: 'GP51 credentials validated and saved successfully!',
      username: authResult.username,
      apiUrl: authResult.apiUrl,
      sessionId: sessionData?.id,
      tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('GP51 credential validation failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const statusCode = getErrorStatusCode(errorMessage);
    
    return createResponse({
      success: false,
      error: getErrorTitle(errorMessage),
      details: getErrorDetails(errorMessage, trimmedUsername),
      username: trimmedUsername,
      apiUrl: trimmedApiUrl,
      timestamp: new Date().toISOString()
    }, statusCode);
  }
}

export async function handleHealthCheck() {
  console.log('Performing GP51 health check...');
  
  try {
    const status = await getGP51Status();
    
    const healthData = {
      timestamp: new Date().toISOString(),
      gp51Status: status,
      systemHealth: 'operational',
      checks: {
        database: true,
        gp51Connection: status.connected || false,
        sessionValid: status.connected && !status.error
      }
    };

    console.log('Health check completed:', healthData);
    
    return createResponse({
      success: true,
      health: healthData,
      connected: status.connected || false
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return createResponse({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown health check error',
      timestamp: new Date().toISOString()
    }, 500);
  }
}

function getErrorStatusCode(errorMessage: string): number {
  if (errorMessage.includes('Network error') || errorMessage.includes('connection')) {
    return 503; // Service Unavailable
  } else if (errorMessage.includes('authentication failed') || errorMessage.includes('Invalid')) {
    return 401; // Unauthorized
  } else if (errorMessage.includes('URL format') || errorMessage.includes('required')) {
    return 400; // Bad Request
  } else if (errorMessage.includes('API returned')) {
    return 502; // Bad Gateway
  }
  return 500; // Internal Server Error
}

function getErrorTitle(errorMessage: string): string {
  if (errorMessage.includes('Network error')) {
    return 'GP51 Connection Failed';
  } else if (errorMessage.includes('authentication failed')) {
    return 'Authentication Failed';
  } else if (errorMessage.includes('URL format')) {
    return 'GP51 API Configuration Error';
  } else if (errorMessage.includes('API returned')) {
    return 'GP51 API Response Error';
  }
  return 'GP51 Connection Failed';
}

function getErrorDetails(errorMessage: string, username?: string): string {
  if (errorMessage.includes('Network error connecting to GP51 API')) {
    return 'Unable to connect to GP51 API. Please check if the GP51 API URL is correct and accessible. Try using "https://www.gps51.com/webapi" if you\'re unsure of the correct URL.';
  } else if (errorMessage.includes('Invalid GP51 API URL format')) {
    return 'The GP51 API URL format is invalid. Please provide a valid GP51 API URL (e.g., https://www.gps51.com/webapi or https://api.gps51.com).';
  } else if (errorMessage.includes('GP51 API returned an empty response')) {
    return 'The GP51 API returned an invalid or empty response. Please check the GP51 API URL configuration and try again.';
  } else if (errorMessage.includes('GP51 authentication failed')) {
    return `Invalid GP51 username or password for user "${username}". Please verify your credentials and try again.`;
  } else if (errorMessage.includes('All GP51 authentication methods failed')) {
    return 'Could not connect to GP51 using any known API endpoints. Please verify your API URL is correct or try the legacy URL: https://www.gps51.com/webapi';
  }
  return errorMessage;
}
