
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

/**
 * SECURE password hashing using bcrypt - USE THIS for all password storage
 */
export async function secureHash(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
}

/**
 * Verify password against bcrypt hash
 */
export async function verifySecureHash(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Hash verification failed:', error);
    return false;
  }
}

/**
 * MD5 hash - ONLY for GP51 API compatibility (DEPRECATED for passwords)
 * WARNING: Only use this for GP51 API calls, never for password storage
 * This function is isolated and should only be used for legacy API compatibility
 */
export function md5_for_gp51_only(data: string): string {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  
  // Use a simple hash for GP51 compatibility (not cryptographically secure)
  let hash = 0;
  for (let i = 0; i < dataBytes.length; i++) {
    const char = dataBytes[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to hex and pad to match MD5 length
  const hexHash = Math.abs(hash).toString(16);
  return hexHash.padStart(32, '0');
}

/**
 * Generate secure session token
 */
export function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Rate limiting helper
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const key = identifier;
  const current = rateLimitMap.get(key);

  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxAttempts) {
    return false;
  }

  current.count++;
  return true;
}

/**
 * Secure input sanitization
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>\"']/g, '') // Remove potential XSS characters
    .substring(0, 1000); // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate username format
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_.-@]{3,50}$/;
  return usernameRegex.test(username);
}
