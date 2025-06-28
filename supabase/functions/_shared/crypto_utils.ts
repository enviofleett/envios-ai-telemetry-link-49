
// Improved MD5 implementation for GP51 compatibility
export function md5_sync(input: string): string {
  console.log(`🔐 [CRYPTO] Computing MD5 for input length: ${input.length}`);
  
  try {
    const hash = md5Pure(input);
    console.log(`✅ [CRYPTO] MD5 computed successfully: ${hash.substring(0, 8)}...`);
    return hash;
  } catch (error) {
    console.error('❌ [CRYPTO] MD5 computation failed:', error);
    throw new Error('MD5 hash computation failed');
  }
}

export async function md5_for_gp51_only(input: string): Promise<string> {
  return md5_sync(input);
}

// Pure JavaScript MD5 implementation compatible with GP51
function md5Pure(input: string): string {
  // MD5 constants
  const K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
  ];

  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];

  // Convert string to UTF-8 bytes
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  
  // Pre-processing: adding padding bits
  const msgLength = bytes.length;
  const bitLength = msgLength * 8;
  
  // Append the '1' bit (plus zero padding to eight bits)
  const paddedBytes = new Uint8Array(Math.ceil((msgLength + 9) / 64) * 64);
  paddedBytes.set(bytes, 0);
  paddedBytes[msgLength] = 0x80;
  
  // Append original length in bits mod 2^64 to message (little-endian)
  const lengthView = new DataView(paddedBytes.buffer);
  lengthView.setUint32(paddedBytes.length - 8, bitLength, true);
  lengthView.setUint32(paddedBytes.length - 4, Math.floor(bitLength / 0x100000000), true);
  
  // Initialize MD5 buffer
  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  
  // Process the message in 512-bit chunks
  for (let offset = 0; offset < paddedBytes.length; offset += 64) {
    const chunk = new DataView(paddedBytes.buffer, offset, 64);
    const w = new Array(16);
    
    // Break chunk into sixteen 32-bit little-endian words
    for (let i = 0; i < 16; i++) {
      w[i] = chunk.getUint32(i * 4, true);
    }
    
    // Initialize hash value for this chunk
    let a = h0, b = h1, c = h2, d = h3;
    
    // Main loop
    for (let i = 0; i < 64; i++) {
      let f, g;
      
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      
      const temp = d;
      d = c;
      c = b;
      b = addMod32(b, leftRotate(addMod32(addMod32(a, f), addMod32(K[i], w[g])), S[i]));
      a = temp;
    }
    
    // Add this chunk's hash to result so far
    h0 = addMod32(h0, a);
    h1 = addMod32(h1, b);
    h2 = addMod32(h2, c);
    h3 = addMod32(h3, d);
  }
  
  // Produce the final hash value as a 128-bit hex string (little-endian)
  return [h0, h1, h2, h3].map(h => {
    return [
      h & 0xff,
      (h >>> 8) & 0xff,
      (h >>> 16) & 0xff,
      (h >>> 24) & 0xff
    ].map(b => b.toString(16).padStart(2, '0')).join('');
  }).join('');
}

function addMod32(a: number, b: number): number {
  return ((a + b) & 0xffffffff) >>> 0;
}

function leftRotate(value: number, amount: number): number {
  return ((value << amount) | (value >>> (32 - amount))) >>> 0;
}

// Input sanitization function for security
export function sanitizeInput(input: string, type: 'deviceId' | 'imei' | 'username' | 'password' = 'username'): { isValid: boolean; sanitized: string; error?: string } {
  if (!input || typeof input !== 'string') {
    return { isValid: false, sanitized: '', error: 'Input must be a non-empty string' };
  }

  const trimmed = input.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, sanitized: '', error: 'Input cannot be empty' };
  }

  switch (type) {
    case 'deviceId':
      if (trimmed.length < 3 || trimmed.length > 50) {
        return { isValid: false, sanitized: trimmed, error: 'Device ID must be between 3 and 50 characters' };
      }
      // Remove potentially harmful characters
      const sanitizedDeviceId = trimmed.replace(/[<>\"'&]/g, '');
      return { isValid: true, sanitized: sanitizedDeviceId };
      
    case 'imei':
      if (!/^\d{15}$/.test(trimmed)) {
        return { isValid: false, sanitized: trimmed, error: 'IMEI must be exactly 15 digits' };
      }
      return { isValid: true, sanitized: trimmed };
      
    case 'username':
      if (trimmed.length < 3 || trimmed.length > 30) {
        return { isValid: false, sanitized: trimmed, error: 'Username must be between 3 and 30 characters' };
      }
      // Remove potentially harmful characters
      const sanitizedUsername = trimmed.replace(/[<>\"'&]/g, '');
      return { isValid: true, sanitized: sanitizedUsername };
      
    case 'password':
      if (trimmed.length < 4 || trimmed.length > 100) {
        return { isValid: false, sanitized: trimmed, error: 'Password must be between 4 and 100 characters' };
      }
      return { isValid: true, sanitized: trimmed };
      
    default:
      return { isValid: true, sanitized: trimmed };
  }
}

// Rate limiting implementation
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  
  if (!entry || now - entry.timestamp > windowMs) {
    rateLimitMap.set(identifier, { count: 1, timestamp: now });
    return true;
  }
  
  if (entry.count >= maxRequests) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Secure hash generation
export async function secureHash(input: string, salt?: string): Promise<string> {
  const actualSalt = salt || crypto.getRandomValues(new Uint8Array(16)).toString();
  const encoder = new TextEncoder();
  const data = encoder.encode(input + actualSalt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${actualSalt}:${hashHex}`;
}

export async function verifySecureHash(input: string, storedHash: string): Promise<boolean> {
  try {
    const [salt, hash] = storedHash.split(':');
    const computedHash = await secureHash(input, salt);
    return computedHash === storedHash;
  } catch {
    return false;
  }
}

// Test MD5 implementation with corrected test cases
console.log('🧪 Testing MD5 implementation...');
const testCases = [
  { input: 'test', expected: '098f6bcd4621d373cade4e832627b4f6' },
  { input: 'password', expected: '5f4dcc3b5aa765d61d8327deb882cf99' }, // Corrected
  { input: '123456', expected: 'e10adc3949ba59abbe56e057f20f883e' },
  { input: 'hello', expected: '5d41402abc4b2a76b9719d911017c592' }
];

let passedTests = 0;
for (const test of testCases) {
  const result = md5Pure(test.input);
  const passed = result === test.expected;
  console.log(`📝 Test "${test.input}": ${passed ? '✅' : '❌'} (got: ${result}, expected: ${test.expected})`);
  if (passed) passedTests++;
}

console.log(`📊 MD5 Tests: ${passedTests}/${testCases.length} ${passedTests === testCases.length ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);

// Test with GP51 example
const testGP51Password = 'password';
const hashedPassword = md5Pure(testGP51Password);
console.log(`🔐 GP51 Password "${testGP51Password}" → MD5: ${hashedPassword}`);
