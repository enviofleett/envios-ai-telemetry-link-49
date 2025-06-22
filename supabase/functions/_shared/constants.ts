
export const GP51_BASE_URL = "https://api.gps51.com"; // Updated to new endpoint
export const REQUEST_TIMEOUT = 5000; // 5 seconds
export const MAX_RETRIES = 2;

/**
 * Constructs the GP51 API URL by intelligently appending /webapi to the base URL
 * Handles various base URL formats and prevents duplication
 * @param baseUrl - The GP51 base URL (defaults to GP51_BASE_URL)
 * @returns The complete GP51 API URL with /webapi endpoint
 */
export function getGP51ApiUrl(baseUrl?: string): string {
  // Use environment variable first, then parameter, then default
  const envBaseUrl = Deno.env.get('GP51_API_BASE_URL');
  const url = envBaseUrl || baseUrl || GP51_BASE_URL;
  
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
 * Updated to accept both old and new GP51 domains
 * @param url - The URL to validate
 * @returns true if the URL is valid for GP51 usage
 */
export function isValidGP51BaseUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' && (
      urlObj.hostname.includes('gps51.com') || 
      urlObj.hostname.includes('api.gps51.com')
    );
  } catch {
    return false;
  }
}
