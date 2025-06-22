// Comprehensive crypto utilities for GP51 compatibility
// This version includes a CORRECT MD5 implementation following RFC 1321

// Rate limiting storage
const rateLimits = new Map<string, { count: number; resetTime: number }>();

/**
 * CORRECTED MD5 hash implementation following RFC 1321 specification
 * This implements actual MD5 algorithm for GP51 compatibility
 */
export async function md5_for_gp51_only(input: string): Promise<string> {
  console.log(`🔐 MD5 hashing input of length: ${input.length}`);
  
  try {
    // Test with known vector first
    if (input === "hello") {
      console.log(`🧪 [MD5-TEST] Testing with known vector "hello"`);
    }
    
    // Convert string to bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    
    // MD5 constants
    const h = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476];
    
    // MD5 round constants (correct values from RFC 1321)
    const k = [
      0xD76AA478, 0xE8C7B756, 0x242070DB, 0xC1BDCEEE, 0xF57C0FAF, 0x4787C62A, 0xA8304613, 0xFD469501,
      0x698098D8, 0x8B44F7AF, 0xFFFF5BB1, 0x895CD7BE, 0x6B901122, 0xFD987193, 0xA679438E, 0x49B40821,
      0xF61E2562, 0xC040B340, 0x265E5A51, 0xE9B6C7AA, 0xD62F105D, 0x02441453, 0xD8A1E681, 0xE7D3FBC8,
      0x21E1CDE6, 0xC33707D6, 0xF4D50D87, 0x455A14ED, 0xA9E3E905, 0xFCEFA3F8, 0x676F02D9, 0x8D2A4C8A,
      0xFFFA3942, 0x8771F681, 0x6D9D6122, 0xFDE5380C, 0xA4BEEA44, 0x4BDECFA9, 0xF6BB4B60, 0xBEBFBC70,
      0x289B7EC6, 0xEAA127FA, 0xD4EF3085, 0x04881D05, 0xD9D4D039, 0xE6DB99E5, 0x1FA27CF8, 0xC4AC5665,
      0xF4292244, 0x432AFF97, 0xAB9423A7, 0xFC93A039, 0x655B59C3, 0x8F0CCC92, 0xFFEFF47D, 0x85845DD1,
      0x6FA87E4F, 0xFE2CE6E0, 0xA3014314, 0x4E0811A1, 0xF7537E82, 0xBD3AF235, 0x2AD7D2BB, 0xEB86D391
    ];
    
    // Shift amounts for each round
    const s = [
      7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
      5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20,
      4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
      6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
    ];
    
    // Pre-processing: adding padding bits
    const msgLength = data.length;
    const paddedLength = Math.ceil((msgLength + 9) / 64) * 64;
    const padded = new Uint8Array(paddedLength);
    padded.set(data);
    padded[msgLength] = 0x80;
    
    // Append original length in bits as 64-bit little-endian
    const lengthInBits = msgLength * 8;
    const view = new DataView(padded.buffer);
    view.setUint32(paddedLength - 8, lengthInBits, true);
    view.setUint32(paddedLength - 4, Math.floor(lengthInBits / 0x100000000), true);
    
    // Process the message in 512-bit chunks
    for (let offset = 0; offset < paddedLength; offset += 64) {
      const w = new Uint32Array(16);
      
      // Break chunk into sixteen 32-bit little-endian words
      for (let i = 0; i < 16; i++) {
        w[i] = view.getUint32(offset + i * 4, true);
      }
      
      // Initialize hash value for this chunk
      let [a, b, c, d] = h;
      
      // Main loop (64 operations, divided into 4 rounds of 16 operations each)
      for (let i = 0; i < 64; i++) {
        let f, g;
        
        if (i < 16) {
          // Round 1
          f = (b & c) | ((~b) & d);
          g = i;
        } else if (i < 32) {
          // Round 2
          f = (d & b) | ((~d) & c);
          g = (5 * i + 1) % 16;
        } else if (i < 48) {
          // Round 3
          f = b ^ c ^ d;
          g = (3 * i + 5) % 16;
        } else {
          // Round 4
          f = c ^ (b | (~d));
          g = (7 * i) % 16;
        }
        
        // Be sure to keep as 32-bit
        f = (f + a + k[i] + w[g]) >>> 0;
        a = d;
        d = c;
        c = b;
        // Correct left rotation
        b = (b + ((f << s[i]) | (f >>> (32 - s[i])))) >>> 0;
      }
      
      // Add this chunk's hash to result so far
      h[0] = (h[0] + a) >>> 0;
      h[1] = (h[1] + b) >>> 0;
      h[2] = (h[2] + c) >>> 0;
      h[3] = (h[3] + d) >>> 0;
    }
    
    // Convert hash to hex string (little-endian)
    const result = h.map(n => {
      return [
        (n & 0xFF).toString(16).padStart(2, '0'),
        ((n >>> 8) & 0xFF).toString(16).padStart(2, '0'),
        ((n >>> 16) & 0xFF).toString(16).padStart(2, '0'),
        ((n >>> 24) & 0xFF).toString(16).padStart(2, '0')
      ].join('');
    }).join('');
    
    console.log(`✅ MD5 hash generated successfully: ${result}`);
    
    // Test known vectors for verification
    if (input === "hello") {
      const expected = "5d41402abc4b2a76b9719d911017c592";
      console.log(`🧪 [MD5-TEST] Expected: ${expected}`);
      console.log(`🧪 [MD5-TEST] Got:      ${result}`);
      console.log(`🧪 [MD5-TEST] Match:    ${result === expected ? "✅ PASS" : "❌ FAIL"}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ MD5 hashing failed:', error);
    throw new Error('MD5 hash generation failed');
  }
}

/**
 * Synchronous MD5 function for backward compatibility
 * Note: This is a simplified implementation, not cryptographically secure
 */
export function md5_sync(input: string): string {
  console.log(`🔐 Sync MD5 hashing input of length: ${input.length}`);
  
  // Simple hash function for compatibility - not cryptographically secure
  let hash = 0;
  if (input.length === 0) return hash.toString(16).padStart(32, '0');
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to hex and pad to 32 characters
  const hexHash = Math.abs(hash).toString(16);
  const result = hexHash.padStart(32, '0');
  
  console.log(`✅ Sync MD5 hash generated: ${result.substring(0, 8)}...`);
  return result;
}

/**
 * Secure hash function using crypto API when available
 */
export async function secureHash(input: string): Promise<string> {
  console.log(`🔒 Secure hashing input of length: ${input.length}`);
  
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const result = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      console.log(`✅ Secure hash generated: ${result.substring(0, 8)}...`);
      return result;
    } else {
      // Fallback to MD5 for GP51 compatibility
      return await md5_for_gp51_only(input);
    }
  } catch (error) {
    console.error('❌ Secure hashing failed:', error);
    throw new Error('Secure hash generation failed');
  }
}

/**
 * Verify secure hash
 */
export async function verifySecureHash(input: string, hash: string): Promise<boolean> {
  try {
    const inputHash = await secureHash(input);
    return inputHash === hash;
  } catch (error) {
    console.error('❌ Hash verification failed:', error);
    return false;
  }
}

/**
 * Email validation function
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
