
/**
 * GP51 API constants and helper functions
 */

export const GP51_DEFAULT_BASE_URL = 'https://api.gps51.com'; // Updated to use api subdomain
export const GP51_WEBAPI_PATH = '/webapi';

/**
 * Gets the correct GP51 API URL, ensuring proper format
 * @param baseUrl - The base URL (e.g., 'https://api.gps51.com')
 * @returns The properly formatted API URL
 */
export function getGP51ApiUrl(baseUrl: string = GP51_DEFAULT_BASE_URL): string {
  // Remove any trailing slashes
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  
  // Ensure we don't double up on /webapi
  if (cleanBaseUrl.endsWith('/webapi')) {
    return cleanBaseUrl;
  }
  
  return `${cleanBaseUrl}${GP51_WEBAPI_PATH}`;
}

/**
 * Builds a GP51 API URL with action and parameters
 * @param baseUrl - The base URL
 * @param action - The API action (querydevicestree, etc.)
 * @param params - Additional query parameters
 * @returns The complete API URL with query parameters
 */
export function buildGP51ApiUrl(
  baseUrl: string = GP51_DEFAULT_BASE_URL,
  action: string,
  params: Record<string, string> = {}
): string {
  const apiUrl = getGP51ApiUrl(baseUrl);
  const url = new URL(apiUrl);
  
  url.searchParams.set('action', action);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  return url.toString();
}

/**
 * Validates if a URL is a valid GP51 base URL
 * @param url - The URL to validate
 * @returns True if valid GP51 base URL
 */
export function isValidGP51BaseUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Accept both gps51.com and api.gps51.com
    return /^(api\.)?gps51\.com$/.test(urlObj.hostname) && 
           (urlObj.protocol === 'https:' || urlObj.protocol === 'http:');
  } catch {
    return false;
  }
}

/**
 * Sanitizes GP51 API parameters
 * @param params - Parameters to sanitize
 * @returns Sanitized parameters
 */
export function sanitizeGP51Params(params: Record<string, any>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) {
      // Convert to string and sanitize
      sanitized[key] = String(value).trim();
    }
  }
  
  return sanitized;
}
