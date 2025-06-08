
import { authenticateWithGP51 } from './gp51-auth.ts';
import { saveGP51Session, getGP51Status } from './database.ts';
import { createResponse } from './cors.ts';

export async function handleSaveCredentialsWithVehicleImport({ 
  username, 
  password, 
  apiUrl,
  userId 
}: { 
  username: string; 
  password: string; 
  apiUrl?: string;
  userId: string;
}) {
  const trimmedUsername = username?.trim();
  const trimmedPassword = password?.trim();
  const trimmedApiUrl = apiUrl?.trim();
  
  console.log('Processing enhanced GP51 credentials save with vehicle import for user:', trimmedUsername, 'User ID:', userId);
  
  if (!trimmedUsername || !trimmedPassword) {
    console.error('Missing credentials: username or password not provided');
    return createResponse(
      { error: 'Username and password are required' },
      400
    );
  }

  if (!userId) {
    console.error('Missing user ID: user must be authenticated');
    return createResponse(
      { error: 'User authentication required' },
      401
    );
  }

  try {
    console.log('Authenticating with GP51...');
    const authResult = await authenticateWithGP51({ 
      username: trimmedUsername, 
      password: trimmedPassword,
      apiUrl: trimmedApiUrl
    });
    
    console.log('Saving GP51 session to database with user linking...');
    await saveGP51Session(authResult.username, authResult.token, authResult.apiUrl, userId);

    console.log('GP51 credentials successfully validated and saved with user linking');
    
    // Trigger vehicle import in the background (optional)
    console.log('Enhanced save completed - vehicle import can be triggered separately');
    
    return createResponse({
      success: true,
      message: 'GP51 credentials validated and saved successfully! Vehicle import can now be performed.',
      username: authResult.username,
      apiUrl: authResult.apiUrl,
      tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('Enhanced GP51 credential validation failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return createResponse({
      error: 'GP51 Connection Failed',
      details: errorMessage,
      username: trimmedUsername
    }, 500);
  }
}

export async function handleHealthCheck() {
  console.log('Performing GP51 health check');
  
  try {
    // Basic health check - just return system status
    return createResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'GP51 Settings Management'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return createResponse({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
}
