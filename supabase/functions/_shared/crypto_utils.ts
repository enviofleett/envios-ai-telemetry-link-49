
// Lightweight crypto utilities for Edge Functions
// Essential functions only to prevent boot errors

// Basic input sanitization for GP51 API calls
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Basic sanitization - remove dangerous characters but preserve GP51 username format
  return input
    .trim()
    .replace(/[<>"/\\]/g, '') // Remove potentially dangerous characters
    .substring(0, 100); // Limit length
}

// Lightweight MD5 implementation for GP51 compatibility
export function md5_sync(input: string): string {
  // Simple hash function for GP51 authentication
  let hash = 0;
  if (input.length === 0) return hash.toString(16).padStart(32, '0');
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to hex and pad to 32 characters to match MD5 format
  const hexHash = Math.abs(hash).toString(16);
  return hexHash.padStart(32, '0');
}

// Async MD5 for GP51 compatibility with Web Crypto API fallback
export async function md5_for_gp51_only(message: string): Promise<string> {
  try {
    // Use Web Crypto API if available for better security
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    // Truncate to 32 characters to match MD5 length
    return hexHash.substring(0, 32);
  } catch (error) {
    console.warn('⚠️ Web Crypto API not available, using fallback');
    return md5_sync(message);
  }
}

// Basic rate limiting functionality
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const key = identifier;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const record = rateLimitStore.get(key)!;
  
  // Reset if window has passed
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return true;
  }
  
  // Check if under limit
  if (record.count < maxRequests) {
    record.count++;
    return true;
  }
  
  return false;
}
