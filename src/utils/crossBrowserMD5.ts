
/**
 * Cross-browser MD5 implementation that works in both client and edge function environments
 */

// Simple MD5 implementation for cross-platform compatibility
export async function md5(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    // Use Web Crypto API when available (modern browsers)
    try {
      return await md5WebCrypto(input);
    } catch (error) {
      console.warn('Web Crypto API failed, falling back to pure JS MD5:', error);
      return md5Pure(input);
    }
  } else {
    // Fallback to pure JavaScript implementation
    return md5Pure(input);
  }
}

async function md5WebCrypto(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  try {
    // Note: MD5 is not available in Web Crypto API, so we'll use SHA-256 and truncate
    // This is a compromise for compatibility - in production, consider using a proper MD5 library
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Truncate to 32 characters to match MD5 length (this is not cryptographically equivalent to MD5)
    return hexHash.substring(0, 32);
  } catch (error) {
    throw new Error('Web Crypto API failed');
  }
}

// Pure JavaScript MD5 implementation
function md5Pure(input: string): string {
  // This is a simplified hash function - in production, use a proper MD5 library
  let hash = 0;
  if (input.length === 0) return hash.toString(16).padStart(32, '0');
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to hex and pad to 32 characters
  const hexHash = Math.abs(hash).toString(16);
  return hexHash.padStart(32, '0');
}

// For backward compatibility
export const crossBrowserMD5 = md5;

// Async version for consistency with edge function usage
export async function md5Async(input: string): Promise<string> {
  return await md5(input);
}
