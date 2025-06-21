
/**
 * GP51 URL Helper Functions
 * Provides standardized URL construction and validation for GP51 API endpoints
 */

export const GP51_BASE_URL = 'https://www.gps51.com';

/**
 * Constructs the GP51 API URL by intelligently appending /webapi to the base URL
 * Handles various base URL formats and prevents duplication
 * @param baseUrl - The GP51 base URL (defaults to GP51_BASE_URL)
 * @returns The complete GP51 API URL with /webapi endpoint
 */
export function getGP51ApiUrl(baseUrl?: string): string {
  const url = baseUrl || GP51_BASE_URL;
  
  // Remove trailing slash if present
  const cleanUrl = url.replace(/\/$/, '');
  
  // Only append /webapi if it's not already present
  if (!cleanUrl.endsWith('/webapi')) {
    return cleanUrl + '/webapi';
  }
  
  return cleanUrl;
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
 * Gets the standardized GP51 base URL from environment or fallback
 * @returns The standardized GP51 base URL
 */
export function getStandardizedGP51BaseUrl(): string {
  return process.env.GP51_BASE_URL || GP51_BASE_URL;
}
