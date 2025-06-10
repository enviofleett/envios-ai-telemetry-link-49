
import { createResponse } from './cors.ts';
import { authenticateWithGP51 } from './gp51-auth.ts';

export async function handleSaveCredentials({ 
  username, 
  password, 
  apiUrl 
}: { 
  username: string; 
  password: string; 
  apiUrl?: string;
}) {
  console.log('🔐 Basic GP51 credential save handler');
  
  try {
    const authResult = await authenticateWithGP51({
      username,
      password,
      apiUrl
    });

    if (authResult.success) {
      return createResponse({
        success: true,
        message: 'GP51 credentials validated successfully',
        username: authResult.username,
        apiUrl: authResult.apiUrl
      });
    } else {
      return createResponse({
        success: false,
        error: 'GP51 authentication failed',
        details: authResult.error || 'Invalid credentials'
      }, 400);
    }
  } catch (error) {
    console.error('❌ Basic credential save failed:', error);
    return createResponse({
      success: false,
      error: 'Credential validation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}

export async function handleGetStatus() {
  console.log('📊 GP51 status check');
  
  // For now, return a basic status
  return createResponse({
    connected: false,
    message: 'Status check not fully implemented'
  });
}
