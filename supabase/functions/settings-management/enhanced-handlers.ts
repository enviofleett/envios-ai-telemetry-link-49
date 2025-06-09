
import { authenticateWithGP51 } from './gp51-auth.ts';
import { saveGP51Session, getGP51Status } from './database.ts';
import { createResponse } from './cors.ts';
import { GP51ErrorHandler } from './error-handling.ts';
import type { GP51Credentials } from './types.ts';

export async function handleSaveCredentialsWithVehicleImport(credentials: GP51Credentials & { apiUrl?: string; testOnly?: boolean }) {
  const trimmedUsername = credentials.username?.trim();
  const trimmedPassword = credentials.password?.trim();
  const trimmedApiUrl = credentials.apiUrl?.trim();
  
  console.log(`Enhanced GP51 credentials save request for user: ${trimmedUsername}, testOnly: ${credentials.testOnly || false}`);
  
  // Input validation with detailed feedback
  if (!trimmedUsername || !trimmedPassword) {
    const validationError = GP51ErrorHandler.createDetailedError(
      new Error('Missing required credentials'),
      { providedUsername: !!trimmedUsername, providedPassword: !!trimmedPassword }
    );
    validationError.code = 'GP51_VALIDATION_ERROR';
    validationError.category = 'validation';
    validationError.details = 'Both username and password are required for GP51 authentication.';
    validationError.suggestions = [
      'Enter your GP51 username',
      'Enter your GP51 password',
      'Ensure no extra spaces in credentials',
      'Verify credentials with your GP51 administrator'
    ];
    
    GP51ErrorHandler.logError(validationError);
    return createResponse(GP51ErrorHandler.formatErrorForClient(validationError), 400);
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
        testMode: true,
        connectionDetails: {
          authenticatedAt: new Date().toISOString(),
          responseTime: 'Connected successfully',
          apiEndpoint: authResult.apiUrl
        }
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
      tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      connectionDetails: {
        connectedAt: new Date().toISOString(),
        sessionCreated: true,
        apiEndpoint: authResult.apiUrl
      }
    });

  } catch (error) {
    console.error('GP51 credential validation failed:', error);
    
    const detailedError = GP51ErrorHandler.createDetailedError(error, {
      username: trimmedUsername,
      apiUrl: trimmedApiUrl,
      testOnly: credentials.testOnly
    });
    
    GP51ErrorHandler.logError(detailedError, { 
      operation: 'credential_validation',
      userAgent: 'settings-management-function'
    });
    
    const statusCode = getErrorStatusCode(detailedError.category, detailedError.severity);
    return createResponse(GP51ErrorHandler.formatErrorForClient(detailedError), statusCode);
  }
}

export async function handleHealthCheck() {
  console.log('Performing comprehensive GP51 health check...');
  
  try {
    const status = await getGP51Status();
    
    const healthData = {
      timestamp: new Date().toISOString(),
      gp51Status: status,
      systemHealth: 'operational',
      checks: {
        database: true,
        gp51Connection: status.connected || false,
        sessionValid: status.connected && !status.error,
        apiReachable: false // Will be updated by connection test
      },
      performance: {
        responseTime: null,
        lastSuccessfulConnection: status.lastConnected || null
      },
      recommendations: []
    };

    // Add recommendations based on status
    if (!status.connected) {
      healthData.recommendations.push(
        'Configure GP51 credentials in Settings',
        'Verify GP51 API URL is correct',
        'Test connection manually'
      );
    }

    if (status.error) {
      healthData.recommendations.push(
        'Check error details in connection logs',
        'Verify GP51 service availability',
        'Review authentication credentials'
      );
    }

    console.log('Health check completed:', healthData);
    
    return createResponse({
      success: true,
      health: healthData,
      connected: status.connected || false,
      message: status.connected ? 'GP51 system is healthy' : 'GP51 requires attention'
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    const detailedError = GP51ErrorHandler.createDetailedError(error, {
      operation: 'health_check'
    });
    
    GP51ErrorHandler.logError(detailedError);
    
    return createResponse({
      success: false,
      health: {
        timestamp: new Date().toISOString(),
        systemHealth: 'degraded',
        error: detailedError.message,
        recommendations: detailedError.suggestions
      },
      ...GP51ErrorHandler.formatErrorForClient(detailedError)
    }, 500);
  }
}

function getErrorStatusCode(category: string, severity: string): number {
  switch (category) {
    case 'network':
      return 503; // Service Unavailable
    case 'authentication':
      return 401; // Unauthorized
    case 'configuration':
    case 'validation':
      return 400; // Bad Request
    case 'api':
      return severity === 'critical' ? 503 : 502; // Service Unavailable or Bad Gateway
    default:
      return 500; // Internal Server Error
  }
}
