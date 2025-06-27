
/**
 * GP51 URL Helper Functions
 * Provides standardized URL construction and validation for GP51 API endpoints
 * Updated to use consistent domain without www prefix
 */

export const GP51_BASE_URL = 'https://gps51.com/webapi'; // Standardized endpoint

/**
 * Constructs the GP51 API URL using the standardized base URL
 * @param baseUrl - The GP51 base URL (defaults to GP51_BASE_URL)
 * @returns The complete GP51 API URL
 */
export function getGP51ApiUrl(baseUrl?: string): string {
  return baseUrl || GP51_BASE_URL;
}

/**
 * Validates if a GP51 base URL is properly formatted
 * @param url - The URL to validate
 * @returns true if the URL is valid for GP51 usage
 */
export function isValidGP51BaseUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' && urlObj.hostname.includes('gps51.com');
  } catch {
    return false;
  }
}

/**
 * Gets the standardized GP51 base URL
 * @returns The standardized GP51 base URL
 */
export function getStandardizedGP51BaseUrl(): string {
  return GP51_BASE_URL;
}

/**
 * GP51 API Actions - Using correct action names from working console calls
 */
export const GP51_ACTIONS = {
  LOGIN: 'login',
  DEVICE_TREE: 'querydevicetreebyuser', // Correct action from console
  POSITIONS: 'queryalllastrecordsbyuser', // Correct action for positions
  LOGOUT: 'logout'
} as const;

/**
 * Constructs GP51 API URL with action
 * @param action - The API action to perform
 * @param token - Optional token for authenticated requests
 * @returns Complete API URL with action
 */
export function buildGP51ApiUrl(action: string, token?: string): string {
  const baseUrl = GP51_BASE_URL;
  const url = new URL(baseUrl);
  url.searchParams.set('action', action);
  
  if (token) {
    url.searchParams.set('token', token);
  }
  
  return url.toString();
}
