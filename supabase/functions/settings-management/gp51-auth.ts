
import { md5 } from './crypto.ts';
import type { GP51Credentials, GP51AuthPayload, GP51LoginResult } from './types.ts';

export async function authenticateWithGP51(credentials: GP51Credentials): Promise<string> {
  console.log('Starting GP51 credential validation for user:', credentials.username);

  // MD5 encrypt the password
  const hashedPassword = await md5(credentials.password);
  console.log('Password hashed successfully');

  // Corrected GP51 authentication payload - removed the action field from body
  const authPayload: GP51AuthPayload = {
    username: credentials.username,
    password: hashedPassword,
    from: 'WEB',
    type: 'USER'
  };

  console.log('Attempting GP51 authentication with corrected payload...');

  // Use the correct GP51 API endpoint with action parameter in URL only
  const loginResponse = await fetch('https://www.gps51.com/webapi?action=login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Envio-Console/1.0',
      'Accept': 'application/json'
    },
    body: JSON.stringify(authPayload),
    signal: AbortSignal.timeout(15000) // 15 second timeout
  });

  console.log('GP51 API response status:', loginResponse.status);

  if (!loginResponse.ok) {
    console.error('GP51 API returned non-OK status:', loginResponse.status, loginResponse.statusText);
    const errorText = await loginResponse.text();
    console.error('GP51 API error response body:', errorText);
    
    throw new Error(`GP51 API error: ${loginResponse.status} ${loginResponse.statusText}`);
  }

  const responseText = await loginResponse.text();
  console.log('GP51 API raw response received');

  let loginResult: GP51LoginResult;
  try {
    loginResult = JSON.parse(responseText);
    console.log('GP51 parsed response received');
  } catch (parseError) {
    console.error('Failed to parse GP51 response as JSON:', parseError);
    console.error('Raw response was:', responseText.substring(0, 200));
    
    throw new Error('Invalid response format from GP51 API');
  }

  // Check for successful response - GP51 uses status: 0 for success
  if (loginResult.status !== 0) {
    console.error('GP51 authentication failed. Status:', loginResult.status, 'Cause:', loginResult.cause);
    
    throw new Error(loginResult.cause || `GP51 authentication failed (status: ${loginResult.status})`);
  }

  // Extract token from successful response
  const token = loginResult.token;
  if (!token) {
    console.error('GP51 login successful but no token received');
    console.error('Full response:', JSON.stringify(loginResult, null, 2));
    throw new Error('GP51 authentication successful but no token received');
  }

  console.log('GP51 authentication successful. Token received');
  return token;
}
