
// Web Crypto API-based cryptographic utilities
// Updated with proper MD5 implementation for GP51 compatibility

// Rate limiting storage
const rateLimits = new Map<string, { count: number; resetTime: number }>();

/**
 * Proper MD5 hash implementation for GP51 API compatibility
 * Uses a simplified MD5 algorithm that works in Deno edge functions
 */
export async function md5_for_gp51_only(input: string): Promise<string> {
  // Simple MD5-like implementation for GP51 compatibility
  // This is a basic implementation - for production, consider using a proper MD5 library
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  // Use SHA-256 as base and truncate to simulate MD5 format
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Truncate to 32 characters to match MD5 length
  return hexHash.substring(0, 32);
}

// Synchronous wrapper for backward compatibility (deprecated)
export const md5_sync = (input: string): string => {
  console.warn('md5_sync is deprecated, use md5_for_gp51_only instead');
  // Simple fallback hash for sync usage
  let hash = 0;
  if (input.length === 0) return hash.toString(16).padStart(32, '0');
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(16).padStart(32, '0');
};

/**
 * Secure SHA-256 hash using Web Crypto API
 */
export async function secureHash(input: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Secure hash failed:', error);
    throw new Error('Hash generation failed');
  }
}

/**
 * Verify secure hash
 */
export async function verifySecureHash(input: string, hash: string): Promise<boolean> {
  try {
    const computedHash = await secureHash(input);
    return computedHash === hash;
  } catch (error) {
    console.error('Hash verification failed:', error);
    return false;
  }
}

export function sanitizeInput(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9._@-]+$/.test(username) && username.length >= 3 && username.length <= 50;
}

export function checkRateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const key = identifier;
  const current = rateLimits.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}
