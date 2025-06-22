
// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (entry.count >= maxRequests) {
    return false;
  }
  
  entry.count++;
  return true;
}

export function sanitizeInput(input: string): string {
  return input.replace(/[^\w\-@.]/g, '');
}

// Synchronous MD5 implementation for GP51 compatibility
export function md5_sync(input: string): string {
  // Convert string to UTF-8 bytes
  const msgBytes = new TextEncoder().encode(input);
  
  // MD5 constants
  const K = new Uint32Array([
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
  ]);

  const S = new Uint8Array([
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ]);

  // Helper functions
  function F(x: number, y: number, z: number): number {
    return (x & y) | (~x & z);
  }

  function G(x: number, y: number, z: number): number {
    return (x & z) | (y & ~z);
  }

  function H(x: number, y: number, z: number): number {
    return x ^ y ^ z;
  }

  function I(x: number, y: number, z: number): number {
    return y ^ (x | ~z);
  }

  function rotateLeft(value: number, shift: number): number {
    return ((value << shift) | (value >>> (32 - shift))) >>> 0;
  }

  function addUnsigned(x: number, y: number): number {
    return (x + y) >>> 0;
  }

  // Padding
  const msgLength = msgBytes.length;
  const bitLength = msgLength * 8;
  
  // Add padding bit
  const paddedLength = msgLength + 1 + ((55 - msgLength) % 64);
  const paddedMsg = new Uint8Array(paddedLength + 8);
  paddedMsg.set(msgBytes);
  paddedMsg[msgLength] = 0x80;
  
  // Add length in bits as 64-bit little-endian
  const lengthBytes = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    lengthBytes[i] = (bitLength >>> (i * 8)) & 0xff;
  }
  paddedMsg.set(lengthBytes, paddedLength);

  // Initialize MD buffer
  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;

  // Process message in 512-bit chunks
  for (let offset = 0; offset < paddedMsg.length; offset += 64) {
    const chunk = paddedMsg.slice(offset, offset + 64);
    const w = new Uint32Array(16);
    
    // Break chunk into sixteen 32-bit little-endian words
    for (let i = 0; i < 16; i++) {
      w[i] = chunk[i * 4] | (chunk[i * 4 + 1] << 8) | (chunk[i * 4 + 2] << 16) | (chunk[i * 4 + 3] << 24);
    }

    let a = h0, b = h1, c = h2, d = h3;

    // Main loop
    for (let i = 0; i < 64; i++) {
      let f: number, g: number;
      
      if (i < 16) {
        f = F(b, c, d);
        g = i;
      } else if (i < 32) {
        f = G(b, c, d);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = H(b, c, d);
        g = (3 * i + 5) % 16;
      } else {
        f = I(b, c, d);
        g = (7 * i) % 16;
      }

      f = addUnsigned(f, a);
      f = addUnsigned(f, K[i]);
      f = addUnsigned(f, w[g]);
      
      a = d;
      d = c;
      c = b;
      b = addUnsigned(b, rotateLeft(f, S[i]));
    }

    h0 = addUnsigned(h0, a);
    h1 = addUnsigned(h1, b);
    h2 = addUnsigned(h2, c);
    h3 = addUnsigned(h3, d);
  }

  // Produce the final hash value as a 128-bit number (little-endian)
  const result = new Uint8Array(16);
  
  for (let i = 0; i < 4; i++) {
    result[i] = (h0 >>> (i * 8)) & 0xff;
    result[i + 4] = (h1 >>> (i * 8)) & 0xff;
    result[i + 8] = (h2 >>> (i * 8)) & 0xff;
    result[i + 12] = (h3 >>> (i * 8)) & 0xff;
  }

  // Convert to hex string
  return Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Async version for compatibility
export async function md5_for_gp51_only(input: string): Promise<string> {
  return md5_sync(input);
}
