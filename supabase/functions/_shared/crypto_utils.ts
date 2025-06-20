

// Fix the crypto import to use the correct module path and version
import { createHash } from 'https://deno.land/std@0.177.0/hash/mod.ts';

// Rate limiting storage
const rateLimits = new Map<string, { count: number; resetTime: number }>();

export function md5_for_gp51_only(input: string): string {
  const hash = createHash('md5');
  hash.update(input);
  return hash.toString('hex');
}

// Add the missing md5_sync export that gp51_api_client_unified.ts is expecting
export const md5_sync = md5_for_gp51_only;

export function secureHash(input: string): string {
  const hash = createHash('sha256');
  hash.update(input);
  return hash.toString('hex');
}

export function verifySecureHash(input: string, hash: string): boolean {
  return secureHash(input) === hash;
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

